from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class ChatBase(BaseModel):
    title: str = Field(default="New Chat")


class ChatCreate(ChatBase):
    pass


class ChatUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Updated chat title.")


class ChatOut(ChatBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True
