from typing import Optional
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Schema for user login credentials."""

    username: str = Field(..., min_length=3, description="Username or email address")
    password: str = Field(..., min_length=4, description="User password")


class TokenResponse(BaseModel):
    """Schema for authentication token response."""

    access_token: str = Field(..., description="Bearer JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user_id: int = Field(..., description="Unique user identifier")
    role: str = Field(..., description="Assigned user role")
    expires_in: Optional[int] = Field(default=3600, description="Token validity in seconds")
