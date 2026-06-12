from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=10, description="User password must be at least 10 characters.")


class UserOut(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True  # SQLAlchemy 1.x compatibility, from_attributes for 2.0
