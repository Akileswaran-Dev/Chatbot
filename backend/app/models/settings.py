import uuid
from sqlalchemy import Column, String, Numeric, Text, ForeignKey, Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    theme = Column(String(20), default="dark", nullable=False)
    model_name = Column(String(50), default="gemini-2.5-flash", nullable=False)
    temperature = Column(Numeric(precision=3, scale=2), default=0.70, nullable=False)
    system_prompt = Column(Text, default="You are a helpful assistant.", nullable=False)

    # Back-populates user settings
    user = relationship("User", back_populates="settings")
