
import base64
import io
from typing import Optional

from PIL import Image, ImageDraw
from app.providers.base import GeneratedImage


class MockImageProvider:
    """Free development provider that returns a visible placeholder."""

    async def generate(
        self,
        *,
        image: bytes,
        prompt: str,
        aspect_ratio: str,
        strength: Optional[float] = None,
        seed: Optional[int] = None,
    ) -> GeneratedImage:
        # Create a visible image locally; this is NOT AI-generated.
        canvas = Image.new("RGB", (768, 512), "#f4f0e8")
        draw = ImageDraw.Draw(canvas)

        draw.rounded_rectangle(
            (30, 30, 738, 482),
            radius=28,
            outline="#ef4d23",
            width=5,
        )
        draw.ellipse(
            (284, 115, 484, 315),
            fill="#f6c453",
            outline="#2d3748",
            width=5,
        )
        draw.arc(
            (330, 205, 438, 275),
            start=10,
            end=170,
            fill="#2d3748",
            width=5,
        )
        draw.ellipse((335, 180, 350, 195), fill="#2d3748")
        draw.ellipse((418, 180, 433, 195), fill="#2d3748")

        buffer = io.BytesIO()
        canvas.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return GeneratedImage(
            image_base64=encoded,
            image_url=None,
            mime_type="image/png",
            seed=seed if seed is not None else 0,
        )
