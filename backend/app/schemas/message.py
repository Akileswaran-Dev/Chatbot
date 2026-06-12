from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    role: str = Field(..., description="Role must be 'user' or 'model'.")
    content: str = Field(..., min_length=1)


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, description="Message prompt content.")


class MessageOut(MessageBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True
