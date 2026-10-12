import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from tests.test_backend_core import create_test_image_bytes

# Initialize TestClient with raise_server_exceptions=False to test 500 handler responses
client = TestClient(app, raise_server_exceptions=False)


def test_cors_allowed_origin():
    """Allowed origins should receive Access-Control-Allow-Origin header."""
    res = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_disallowed_origin():
    """Unregistered origin should NOT receive access-control-allow-origin header."""
    res = client.get("/health", headers={"Origin": "http://malicious-website.com"})
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") is None


def test_unhandled_exception_leaks_no_stack_trace():
    """Unexpected internal server error returns safe message and no traceback."""
    valid_png = create_test_image_bytes()
    files = {"sketch": ("sketch.png", valid_png, "image/png")}
    data = {"prompt": "A modern cityscape at twilight", "style": "photorealistic"}

    with patch("app.routers.generate.check_rate_limit", side_effect=RuntimeError("Secret internal database credentials")):
        res = client.post("/generate", files=files, data=data)
        assert res.status_code == 500
        body = res.json()
        assert "error" in body
        assert body["error"]["code"] == "INTERNAL_ERROR"
        # Secret exception message must NEVER be echoed
        assert "Secret internal database credentials" not in body["error"]["message"]
        assert "Traceback" not in res.text
