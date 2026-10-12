import io
import logging
from typing import Tuple
from PIL import Image, ImageFilter, ImageOps

logger = logging.getLogger("sketch_to_image.preprocess")


def flatten_to_white_background(image: Image.Image) -> Image.Image:
    """
    Flattens any alpha/transparency onto a solid white background.
    Canvas exports often have transparent backgrounds, which would otherwise
    render as black in standard RGB converters and produce garbled AI results.
    """
    if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
        rgba_image = image.convert("RGBA")
        white_bg = Image.new("RGBA", rgba_image.size, (255, 255, 255, 255))
        # Composite RGBA image over solid white
        composite = Image.alpha_composite(white_bg, rgba_image)
        return composite.convert("RGB")

    if image.mode != "RGB":
        return image.convert("RGB")

    return image


def enhance_sketch_lines(image: Image.Image) -> Image.Image:
    """
    Optional sketch enhancement:
    - Auto-contrasts the image to make faint pencil strokes crisp and visible.
    - Applies a subtle MinFilter to thicken very faint strokes.
    """
    # Auto-contrast across all channels
    contrasted = ImageOps.autocontrast(image, cutoff=2)
    # Slight filter to bring out line art definition
    enhanced = contrasted.filter(ImageFilter.EDGE_ENHANCE)
    return enhanced


def resize_and_align(image: Image.Image, max_dimension: int = 1024) -> Image.Image:
    """
    Resizes image while keeping aspect ratio within max_dimension bounds,
    and aligns width and height to multiples of 16 (required by diffusion models).
    """
    orig_w, orig_h = image.size

    # Calculate scale factor
    scale = min(max_dimension / orig_w, max_dimension / orig_h, 1.0)
    new_w = max(64, int(orig_w * scale))
    new_h = max(64, int(orig_h * scale))

    # Snap to nearest multiple of 16
    new_w = max(64, (new_w // 16) * 16)
    new_h = max(64, (new_h // 16) * 16)

    if (new_w, new_h) != (orig_w, orig_h):
        resized = image.resize((new_w, new_h), Image.Resampling.LANCZOS)
        return resized

    return image


def preprocess_sketch(
    image: Image.Image,
    enhance: bool = False,
    max_dimension: int = 1024
) -> Tuple[bytes, int, int]:
    """
    Full sketch preprocessing pipeline:
    1. Flatten transparency onto pure white
    2. Convert to RGB
    3. Optional line thickening / auto-contrast
    4. Resize maintaining aspect ratio and 16px multiple alignment
    5. Re-encode as high-quality PNG bytes
    """
    rgb_image = flatten_to_white_background(image)

    if enhance:
        rgb_image = enhance_sketch_lines(rgb_image)

    final_image = resize_and_align(rgb_image, max_dimension=max_dimension)

    output_buffer = io.BytesIO()
    final_image.save(output_buffer, format="PNG", optimize=True)
    png_bytes = output_buffer.getvalue()

    return png_bytes, final_image.width, final_image.height
