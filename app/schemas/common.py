from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class ApiResponse(BaseModel, Generic[DataT]):
    """Standard generic API success response envelope."""

    success: bool = Field(default=True, description="Indicates if the request succeeded")
    data: Optional[DataT] = Field(default=None, description="Response payload")
    message: Optional[str] = Field(default=None, description="Optional informational message")


class ErrorDetail(BaseModel):
    """Structured error payload details."""

    code: str = Field(..., description="Machine-readable error identifier")
    message: str = Field(..., description="Human-readable error description")
    details: Optional[Any] = Field(default=None, description="Additional contextual metadata or validation errors")


class ErrorResponse(BaseModel):
    """Standard generic API error response envelope."""

    success: bool = Field(default=False, description="Indicates failure")
    error: ErrorDetail = Field(..., description="Error detail container")
