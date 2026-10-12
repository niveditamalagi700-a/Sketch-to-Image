from typing import Optional, Protocol
from pydantic import BaseModel


class GeneratedImage(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    mime_type: str = "image/png"
    seed: int


class ImageProvider(Protocol):
    async def generate(
        self,
        *,
        image: bytes,
        prompt: str,
        aspect_ratio: str,
        strength: Optional[float] = None,
        seed: Optional[int] = None
    ) -> GeneratedImage:
        ...
