from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    FLUX_API_KEY: str = "mock_flux_key"
    FLUX_API_BASE_URL: str = "https://api.bfl.ml/v1"
    FLUX_MODEL: str = "flux.2-dev"
    FLUX_MODE: str = "reference"  # "reference" or "canny"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,https://sketch-to-image-two.vercel.app"
    MAX_UPLOAD_MB: int = 8
    REQUEST_TIMEOUT_S: int = 90
    RATE_LIMIT_PER_MINUTE: int = 10
    ENHANCE_FAINT_SKETCHES: bool = False

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
