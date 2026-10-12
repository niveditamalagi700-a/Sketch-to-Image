from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class StylePreset(str, Enum):
    PHOTOREALISTIC = "photorealistic"
    DIGITAL_ART = "digital_art"
    WATERCOLOR = "watercolor"
    ANIME = "anime"
    THREE_D_RENDER = "3d_render"
    PENCIL_REALISTIC = "pencil_realistic"
    UI_MOCKUP = "ui_mockup"


class AspectRatio(str, Enum):
    SQUARE = "1:1"
    FOUR_THREE = "4:3"
    THREE_FOUR = "3:4"
    SIXTEEN_NINE = "16:9"
    NINE_SIXTEEN = "9:16"


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail


class GenerateResponse(BaseModel):
    request_id: str
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    mime_type: str = "image/png"
    seed: int
    style: StylePreset
    elapsed_ms: int


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str = "1.0.0"
