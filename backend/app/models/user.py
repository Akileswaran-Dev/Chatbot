import uuid
from sqlalchemy import Column, String, DateTime, Uuid
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # One-to-One relationship to Settings
    settings = relationship("Settings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    # One-to-Many relationship to Chats
    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")
