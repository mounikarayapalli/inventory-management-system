from typing import Any, Optional


class AppException(Exception):
    """Base exception class for application-level errors."""

    def __init__(
        self,
        message: str = "An unexpected error occurred.",
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Any] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details


class NotFoundException(AppException):
    """Exception raised when a requested resource is not found."""

    def __init__(
        self,
        message: str = "Requested resource not found.",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            status_code=404,
            error_code="RESOURCE_NOT_FOUND",
            details=details,
        )


class BadRequestException(AppException):
    """Exception raised for client-side semantic errors or malformed input."""

    def __init__(
        self,
        message: str = "Invalid request payload or parameters.",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            status_code=400,
            error_code="BAD_REQUEST",
            details=details,
        )


class ConflictException(AppException):
    """Exception raised when an operation conflicts with existing server state."""

    def __init__(
        self,
        message: str = "Resource conflict detected.",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            status_code=409,
            error_code="RESOURCE_CONFLICT",
            details=details,
        )


class UnauthorizedException(AppException):
    """Exception raised when authentication is missing or invalid."""

    def __init__(
        self,
        message: str = "Authentication required.",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            status_code=401,
            error_code="UNAUTHORIZED",
            details=details,
        )


class ForbiddenException(AppException):
    """Exception raised when authenticated user lacks permissions."""

    def __init__(
        self,
        message: str = "Access forbidden.",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            status_code=403,
            error_code="FORBIDDEN",
            details=details,
        )
