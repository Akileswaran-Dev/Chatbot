from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.chat import Chat


class ChatRepository:
    @staticmethod
    def get_by_id(db: Session, chat_id: UUID) -> Optional[Chat]:
        """Fetch a single chat conversation by UUID."""
        return db.query(Chat).filter(Chat.id == chat_id).first()

    @staticmethod
    def get_multi_by_user(db: Session, user_id: UUID, limit: int = 50, offset: int = 0) -> List[Chat]:
        """Fetch user's conversations sorted by latest updates."""
        return db.query(Chat).filter(Chat.user_id == user_id).order_by(Chat.updated_at.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def create(db: Session, user_id: UUID, title: str = "New Chat") -> Chat:
        """Create a new conversation entry."""
        db_chat = Chat(user_id=user_id, title=title)
        db.add(db_chat)
        db.commit()
        db.refresh(db_chat)
        return db_chat

    @staticmethod
    def update(db: Session, db_obj: Chat) -> Chat:
        """Commit title or timestamp changes."""
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, db_obj: Chat) -> None:
        """Remove a conversation and trigger cascaded message deletions."""
        db.delete(db_obj)
        db.commit()
