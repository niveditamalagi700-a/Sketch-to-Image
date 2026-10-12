from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ValidationError(AppError):
    def __init__(self, message: str):
        super().__init__(code="VALIDATION_ERROR", message=message, status_code=400)


class FileTooLargeError(AppError):
    def __init__(self, max_mb: int):
        super().__init__(
            code="FILE_TOO_LARGE",
            message=f"Sketch file exceeds the maximum limit of {max_mb} MB.",
            status_code=413
        )


class InvalidImageError(AppError):
    def __init__(self, message: str = "Invalid or corrupted image format. Please upload PNG, JPG, or WEBP."):
        super().__init__(code="INVALID_IMAGE", message=message, status_code=400)


class RateLimitExceededError(AppError):
    def __init__(self):
        super().__init__(
            code="RATE_LIMIT_EXCEEDED",
            message="Too many generation requests. Please wait a moment before trying again.",
            status_code=429
        )


class ProviderAuthError(AppError):
    def __init__(self):
        super().__init__(
            code="PROVIDER_AUTH_ERROR",
            message="Service configuration error. Please contact the administrator.",
            status_code=500
        )


class ProviderRateLimitError(AppError):
    def __init__(self):
        super().__init__(
            code="PROVIDER_BUSY",
            message="The AI generation service is temporarily busy. Please retry shortly.",
            status_code=503
        )


class ProviderTimeoutError(AppError):
    def __init__(self):
        super().__init__(
            code="PROVIDER_TIMEOUT",
            message="Generation request timed out. Please try again or use a simpler prompt.",
            status_code=504
        )


class ProviderModerationError(AppError):
    def __init__(self):
        super().__init__(
            code="MODERATION_REJECTED",
            message="The sketch or prompt could not be processed due to safety guidelines. Please modify your input.",
            status_code=400
        )


class ProviderServiceError(AppError):
    def __init__(self):
        super().__init__(
            code="PROVIDER_ERROR",
            message="AI generation encountered an unexpected error. Please retry.",
            status_code=502
        )


async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}}
    )
