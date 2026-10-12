
import base64
import os
import httpx
from typing import Optional

from app.providers.base import GeneratedImage


class ColabImageProvider:
    """Calls the sketch + prompt model running in Google Colab."""

    async def generate(
        self,
        *,
        image: bytes,
        prompt: str,
        aspect_ratio: str,
        strength: Optional[float] = None,
        seed: Optional[int] = None,
        style: Optional[str] = None,
    ) -> GeneratedImage:

        base_url = os.getenv("COLAB_API_URL", "").rstrip("/")

        if not base_url:
            raise RuntimeError("COLAB_API_URL is not configured")

        files = {
            "image": ("sketch.png", image, "image/png")
        }

        data = {
            "prompt": prompt,
            "style": style or "photorealistic",
            "aspect_ratio": aspect_ratio,
            "strength": str(strength if strength is not None else 1.0),
            "seed": str(seed if seed is not None else -1),
        }

        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{base_url}/generate",
                files=files,
                data=data,
            )
            response.raise_for_status()

        content_type = response.headers.get(
            "content-type", "image/png"
        ).split(";")[0]

        if not content_type.startswith("image/"):
            raise RuntimeError(
                f"Colab returned unexpected content type: {content_type}"
            )

        return GeneratedImage(
            image_url=None,
            image_base64=base64.b64encode(
                response.content
            ).decode("utf-8"),
            mime_type=content_type,
            seed=seed if seed is not None else 0,
        )
