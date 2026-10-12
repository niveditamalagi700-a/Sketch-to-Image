import logging
import random
import time
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Request, UploadFile, status
from app.providers.mock import MockImageProvider
from dotenv import load_dotenv

load_dotenv()

from app.config import settings
from app.providers.base import ImageProvider
from app.providers.flux import FluxImageProvider
from app.schemas import AspectRatio, GenerateResponse, StylePreset
from app.security import check_rate_limit
from app.services.preprocess import preprocess_sketch
from app.services.prompt_builder import build_final_prompt
from app.services.validation import validate_prompt, validate_sketch_file

logger = logging.getLogger("sketch_to_image.routers.generate")

router = APIRouter(tags=["generation"])



import os
from app.providers.colab import ColabImageProvider

def get_image_provider() -> ImageProvider:
    """Returns the primary FLUX image provider with free AI inference & BFL API support."""
    colab_url = os.getenv("COLAB_API_URL", "").strip()
    if colab_url and not colab_url.startswith("#"):
        return ColabImageProvider()

    return FluxImageProvider()



@router.post("/generate", response_model=GenerateResponse, status_code=status.HTTP_200_OK)
async def generate_image(
    request: Request,
    sketch: UploadFile = File(..., description="Sketch image file (PNG/JPG/WEBP)"),
    prompt: str = Form(..., description="Text prompt describing the desired image"),
    style: StylePreset = Form(default=StylePreset.PHOTOREALISTIC, description="Style preset"),
    strength: Optional[float] = Form(default=0.7, ge=0.0, le=1.0, description="Fidelity / creativity slider"),
    seed: Optional[int] = Form(default=None, description="Optional random seed"),
    aspect_ratio: AspectRatio = Form(default=AspectRatio.SQUARE, description="Target aspect ratio"),
    provider: ImageProvider = Depends(get_image_provider),
):
    start_time = time.time()
    request_id = f"req_{uuid.uuid4().hex[:12]}"
    logger.info(f"[{request_id}] Starting generation: style={style}, ratio={aspect_ratio.value}, seed={seed}")

    # 1. Enforce Rate Limiting
    check_rate_limit(request)

    # 2. Validation
    cleaned_prompt = validate_prompt(prompt)
    _, pil_image = await validate_sketch_file(sketch, max_mb=settings.MAX_UPLOAD_MB)

    # 3. Preprocessing (transparency flattening, alignment, optional enhancement)
    processed_png_bytes, w, h = preprocess_sketch(
        pil_image,
        enhance=settings.ENHANCE_FAINT_SKETCHES,
    )
    logger.info(f"[{request_id}] Sketch preprocessed to {w}x{h} px ({len(processed_png_bytes)} bytes)")

    # 4. Prompt Assembly
    final_prompt = build_final_prompt(cleaned_prompt, style, strength=strength)
    logger.debug(f"[{request_id}] Final assembled prompt: {final_prompt}")

    # 5. Seed resolution
    effective_seed = seed if seed is not None else random.randint(1, 2147483647)

    # 6. Provider Call
    result = await provider.generate(
        image=processed_png_bytes,
        prompt=final_prompt,
        aspect_ratio=aspect_ratio.value,
        strength=strength,
        seed=effective_seed,
    )

    elapsed_ms = int((time.time() - start_time) * 1000)
    logger.info(f"[{request_id}] Generation completed in {elapsed_ms}ms")

    return GenerateResponse(
        request_id=request_id,
        image_url=result.image_url,
        image_base64=result.image_base64,
        mime_type=result.mime_type,
        seed=result.seed,
        style=style,
        elapsed_ms=elapsed_ms,
    )


@router.post("/regenerate", response_model=GenerateResponse, status_code=status.HTTP_200_OK)
async def regenerate_image(
    request: Request,
    sketch: UploadFile = File(..., description="Sketch image file (PNG/JPG/WEBP)"),
    prompt: str = Form(..., description="Text prompt describing the desired image"),
    style: StylePreset = Form(default=StylePreset.PHOTOREALISTIC, description="Style preset"),
    strength: Optional[float] = Form(default=0.7, ge=0.0, le=1.0, description="Fidelity / creativity slider"),
    seed: Optional[int] = Form(default=None, description="Optional random seed"),
    aspect_ratio: AspectRatio = Form(default=AspectRatio.SQUARE, description="Target aspect ratio"),
    previous_request_id: Optional[str] = Form(default=None, description="ID of previously generated image"),
    provider: ImageProvider = Depends(get_image_provider),
):
    start_time = time.time()
    request_id = f"req_{uuid.uuid4().hex[:12]}"
    logger.info(
        f"[{request_id}] Regenerating from previous={previous_request_id}: style={style}, ratio={aspect_ratio.value}"
    )

    # 1. Enforce Rate Limiting
    check_rate_limit(request)

    # 2. Validation
    cleaned_prompt = validate_prompt(prompt)
    _, pil_image = await validate_sketch_file(sketch, max_mb=settings.MAX_UPLOAD_MB)

    # 3. Preprocessing
    processed_png_bytes, _, _ = preprocess_sketch(
        pil_image,
        enhance=settings.ENHANCE_FAINT_SKETCHES,
    )

    # 4. Prompt Assembly
    final_prompt = build_final_prompt(cleaned_prompt, style, strength=strength)

    # 5. Pick a new random seed if no specific seed was supplied so the result differs
    effective_seed = seed if seed is not None else random.randint(1, 2147483647)

    # 6. Provider Call
    result = await provider.generate(
        image=processed_png_bytes,
        prompt=final_prompt,
        aspect_ratio=aspect_ratio.value,
        strength=strength,
        seed=effective_seed,
    )

    elapsed_ms = int((time.time() - start_time) * 1000)
    logger.info(f"[{request_id}] Regeneration completed in {elapsed_ms}ms")

    return GenerateResponse(
        request_id=request_id,
        image_url=result.image_url,
        image_base64=result.image_base64,
        mime_type=result.mime_type,
        seed=result.seed,
        style=style,
        elapsed_ms=elapsed_ms,
    )
