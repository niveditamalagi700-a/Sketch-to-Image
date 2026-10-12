from collections import defaultdict
import time
from fastapi import Request
from app.config import settings
from app.errors import RateLimitExceededError

# Maps client IP -> list of request timestamps (epoch seconds)
_rate_limit_records = defaultdict(list)


def check_rate_limit(request: Request) -> None:
    """
    Enforces simple in-memory rate limiting per client IP.
    Default limit is configured in settings.RATE_LIMIT_PER_MINUTE.
    """
    # Prefer client IP from request, fallback to '127.0.0.1'
    client_ip = request.client.host if request.client else "unknown"

    # Forwarded-For header if behind a reverse proxy
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    now = time.time()
    window_start = now - 60.0  # 1 minute sliding window

    # Purge timestamps older than 60 seconds
    timestamps = [ts for ts in _rate_limit_records[client_ip] if ts > window_start]
    _rate_limit_records[client_ip] = timestamps

    if len(timestamps) >= settings.RATE_LIMIT_PER_MINUTE:
        raise RateLimitExceededError()

    _rate_limit_records[client_ip].append(now)


def reset_rate_limits() -> None:
    """Utility for testing."""
    _rate_limit_records.clear()
