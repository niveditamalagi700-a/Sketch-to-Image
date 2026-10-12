import io
import logging
from typing import Tuple
from fastapi import UploadFile
from PIL import Image

from app.errors import FileTooLargeError, InvalidImageError, ValidationError

logger = logging.getLogger("sketch_to_image.validation")

ALLOWED_FORMATS = {"PNG", "JPEG", "WEBP"}
MIN_DIMENSION = 64
MAX_DIMENSION = 4096


def validate_prompt(prompt: str) -> str:
    """Validates that the user prompt is non-empty and between 3 and 1000 characters."""
    if not prompt:
        raise ValidationError("Prompt is required.")
    cleaned = prompt.strip()
    if len(cleaned) < 3:
        raise ValidationError("Prompt must be at least 3 characters long.")
    if len(cleaned) > 1000:
        raise ValidationError("Prompt cannot exceed 1000 characters.")
    return cleaned


async def validate_sketch_file(file: UploadFile, max_mb: int = 8) -> Tuple[bytes, Image.Image]:
    """
    Validates the uploaded sketch file:
    - Checks file presence
    - Enforces max upload size
    - Verifies image magic number and validity with Pillow (never trusts extension/MIME header alone)
    - Validates dimensions are within 64–4096 px
    """
    if not file or not file.filename:
        raise ValidationError("No sketch image file was uploaded.")

    # Read file content safely
    contents = await file.read()
    if not contents:
        raise ValidationError("Uploaded sketch file is empty.")

    max_bytes = max_mb * 1024 * 1024
    if len(contents) > max_bytes:
        raise FileTooLargeError(max_mb=max_mb)

    # Verify actual image data and magic number with Pillow
    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()  # Verifies file integrity and format magic numbers
    except Exception as e:
        logger.warning(f"File verification failed: {e}")
        raise InvalidImageError("Uploaded file is corrupted or not a valid image.")

    # Re-open for dimension inspection since verify() clears image state
    try:
        image = Image.open(io.BytesIO(contents))
    except Exception as e:
        logger.warning(f"Failed to re-read image: {e}")
        raise InvalidImageError("Unable to decode image.")

    if image.format not in ALLOWED_FORMATS:
        raise InvalidImageError(
            f"Unsupported image format '{image.format}'. Please upload PNG, JPG, or WEBP."
        )

    width, height = image.size
    if width < MIN_DIMENSION or height < MIN_DIMENSION:
        raise ValidationError(
            f"Image dimensions ({width}x{height}) are too small. Minimum resolution is 64x64 px."
        )
    if width > MAX_DIMENSION or height > MAX_DIMENSION:
        raise ValidationError(
            f"Image dimensions ({width}x{height}) are too large. Maximum resolution is 4096x4096 px."
        )

    return contents, image
