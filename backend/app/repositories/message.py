from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.message import Message


class MessageRepository:
    @staticmethod
    def get_by_chat_id(db: Session, chat_id: UUID, limit: int = 50, offset: int = 0) -> List[Message]:
        """Fetch conversation messages sorted chronologically."""
        return db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at.asc()).offset(offset).limit(limit).all()

    @staticmethod
    def get_latest_by_chat_id(db: Session, chat_id: UUID, limit: int = 10) -> List[Message]:
        """Fetch the latest messages from the chat, sorted chronologically ascending."""
        messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at.desc()).limit(limit).all()
        messages.reverse()
        return messages

    @staticmethod
    def create(db: Session, chat_id: UUID, role: str, content: str) -> Message:
        """Log a user or assistant message to database records."""
        db_message = Message(chat_id=chat_id, role=role, content=content)
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
        return db_message
