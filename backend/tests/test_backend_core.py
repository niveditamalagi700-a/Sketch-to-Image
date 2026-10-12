import io
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.config import settings
from app.errors import (
    ProviderModerationError,
    ProviderRateLimitError,
    ProviderTimeoutError,
)
from app.main import app
from app.providers.base import GeneratedImage
from app.routers.generate import get_image_provider
from app.security import reset_rate_limits

client = TestClient(app)


def create_test_image_bytes(width: int = 128, height: int = 128, format: str = "PNG", mode: str = "RGB") -> bytes:
    """Creates in-memory image bytes for testing."""
    image = Image.new(mode, (width, height), color=(255, 255, 255))
    buf = io.BytesIO()
    image.save(buf, format=format)
    return buf.getvalue()


@pytest.fixture(autouse=True)
def clean_rate_limits():
    reset_rate_limits()


def test_missing_file():
    """Endpoint should reject request when sketch file is missing."""
    data = {"prompt": "A modern sports car", "style": "photorealistic"}
    res = client.post("/generate", data=data)
    assert res.status_code in (400, 422)
    body = res.json()
    assert "error" in body
    assert body["error"]["code"] == "VALIDATION_ERROR"


def test_wrong_file_type():
    """Endpoint should reject non-image file with unsupported type or bad magic bytes."""
    fake_file = ("sketch.txt", b"This is just plain text, not an image.", "text/plain")
    data = {"prompt": "A cute cartoon puppy", "style": "anime"}
    res = client.post("/generate", files={"sketch": fake_file}, data=data)
    assert res.status_code == 400
    body = res.json()
    assert body["error"]["code"] == "INVALID_IMAGE"


def test_oversized_file():
    """Endpoint should reject files exceeding MAX_UPLOAD_MB."""
    with patch.object(settings, "MAX_UPLOAD_MB", 1):
        # 1MB + 1024 bytes buffer
        big_bytes = b"\x89PNG\r\n\x1a\n" + (b"X" * (1024 * 1024 + 1024))
        file_payload = ("big_sketch.png", big_bytes, "image/png")
        data = {"prompt": "A mountain peak", "style": "watercolor"}
        res = client.post("/generate", files={"sketch": file_payload}, data=data)
        assert res.status_code == 413
        body = res.json()
        assert body["error"]["code"] == "FILE_TOO_LARGE"


def test_empty_or_short_prompt():
    """Endpoint should reject empty or under-3-character prompts."""
    valid_png = create_test_image_bytes()
    file_payload = ("sketch.png", valid_png, "image/png")

    # Empty prompt
    res1 = client.post("/generate", files={"sketch": file_payload}, data={"prompt": "  "})
    assert res1.status_code in (400, 422)
    assert "error" in res1.json()

    # Too short (< 3 chars)
    res2 = client.post("/generate", files={"sketch": file_payload}, data={"prompt": "ab"})
    assert res2.status_code == 400
    assert res2.json()["error"]["code"] == "VALIDATION_ERROR"


def test_valid_request():
    """Endpoint should successfully process valid sketch and prompt with mocked provider."""
    mock_provider = AsyncMock()
    mock_provider.generate.return_value = GeneratedImage(
        image_url="https://images.example.com/output_123.png",
        image_base64=None,
        mime_type="image/png",
        seed=42,
    )

    app.dependency_overrides[get_image_provider] = lambda: mock_provider
    try:
        valid_png = create_test_image_bytes(256, 256)
        file_payload = ("sketch.png", valid_png, "image/png")
        data = {
            "prompt": "Futuristic flying automobile over cyber city",
            "style": "3d_render",
            "aspect_ratio": "16:9",
            "strength": "0.75",
            "seed": "42",
        }
        res = client.post("/generate", files={"sketch": file_payload}, data=data)
        assert res.status_code == 200
        body = res.json()
        assert body["request_id"].startswith("req_")
        assert body["image_url"] == "https://images.example.com/output_123.png"
        assert body["seed"] == 42
        assert body["style"] == "3d_render"
        assert body["elapsed_ms"] >= 0
        assert mock_provider.generate.called
    finally:
        app.dependency_overrides.clear()


def test_provider_timeout():
    """Endpoint should return 504 and user-safe message when provider times out."""
    mock_provider = AsyncMock()
    mock_provider.generate.side_effect = ProviderTimeoutError()

    app.dependency_overrides[get_image_provider] = lambda: mock_provider
    try:
        valid_png = create_test_image_bytes()
        file_payload = ("sketch.png", valid_png, "image/png")
        data = {"prompt": "Ancient mystical forest shrine", "style": "watercolor"}
        res = client.post("/generate", files={"sketch": file_payload}, data=data)
        assert res.status_code == 504
        body = res.json()
        assert body["error"]["code"] == "PROVIDER_TIMEOUT"
        assert "timed out" in body["error"]["message"].lower()
    finally:
        app.dependency_overrides.clear()


def test_provider_rate_limit_429():
    """Endpoint should return 503 when upstream provider is busy."""
    mock_provider = AsyncMock()
    mock_provider.generate.side_effect = ProviderRateLimitError()

    app.dependency_overrides[get_image_provider] = lambda: mock_provider
    try:
        valid_png = create_test_image_bytes()
        file_payload = ("sketch.png", valid_png, "image/png")
        data = {"prompt": "Stylized coffee cup icon", "style": "ui_mockup"}
        res = client.post("/generate", files={"sketch": file_payload}, data=data)
        assert res.status_code == 503
        body = res.json()
        assert body["error"]["code"] == "PROVIDER_BUSY"
        assert "busy" in body["error"]["message"].lower()
    finally:
        app.dependency_overrides.clear()


def test_provider_moderation_rejection():
    """Endpoint should return 400 and user-safe moderation message when input is rejected."""
    mock_provider = AsyncMock()
    mock_provider.generate.side_effect = ProviderModerationError()

    app.dependency_overrides[get_image_provider] = lambda: mock_provider
    try:
        valid_png = create_test_image_bytes()
        file_payload = ("sketch.png", valid_png, "image/png")
        data = {"prompt": "A scene triggering safety guidelines", "style": "photorealistic"}
        res = client.post("/generate", files={"sketch": file_payload}, data=data)
        assert res.status_code == 400
        body = res.json()
        assert body["error"]["code"] == "MODERATION_REJECTED"
        assert "safety guidelines" in body["error"]["message"].lower()
    finally:
        app.dependency_overrides.clear()


def test_transparency_flattening_preprocessing():
    """Verify that preprocessing flattens transparent RGBA into solid RGB without crashing."""
    from app.services.preprocess import flatten_to_white_background

    # Transparent image
    rgba_img = Image.new("RGBA", (100, 100), (0, 0, 0, 0))
    # Draw red mark with full alpha
    rgba_img.putpixel((50, 50), (255, 0, 0, 255))

    flattened = flatten_to_white_background(rgba_img)
    assert flattened.mode == "RGB"
    # Transparent pixel (0,0) should now be pure white (255, 255, 255)
    assert flattened.getpixel((0, 0)) == (255, 255, 255)
    # The painted pixel (50, 50) should remain red (255, 0, 0)
    assert flattened.getpixel((50, 50)) == (255, 0, 0)


def test_client_ip_rate_limiting():
    """Requests exceeding RATE_LIMIT_PER_MINUTE should receive 429."""
    valid_png = create_test_image_bytes()
    file_payload = ("sketch.png", valid_png, "image/png")
    data = {"prompt": "Simple sketch test", "style": "digital_art"}

    mock_provider = AsyncMock()
    mock_provider.generate.return_value = GeneratedImage(
        image_url="https://images.example.com/sample.png", seed=1, mime_type="image/png"
    )

    app.dependency_overrides[get_image_provider] = lambda: mock_provider
    try:
        with patch.object(settings, "RATE_LIMIT_PER_MINUTE", 3):
            # First 3 should pass
            for _ in range(3):
                res = client.post("/generate", files={"sketch": ("s.png", valid_png, "image/png")}, data=data)
                assert res.status_code == 200

            # 4th should be rate-limited
            res4 = client.post("/generate", files={"sketch": ("s.png", valid_png, "image/png")}, data=data)
            assert res4.status_code == 429
            assert res4.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    finally:
        app.dependency_overrides.clear()
