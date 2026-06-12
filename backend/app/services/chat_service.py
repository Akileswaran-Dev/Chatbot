from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.chat import Chat
from app.models.message import Message
from app.repositories.chat import ChatRepository
from app.repositories.message import MessageRepository


class ChatService:
    @staticmethod
    def get_user_chats(db: Session, user_id: UUID, limit: int = 50, offset: int = 0) -> List[Chat]:
        """Fetch chats belonging to user."""
        return ChatRepository.get_multi_by_user(db, user_id, limit, offset)

    @staticmethod
    def create_chat(db: Session, user_id: UUID, title: str = "New Chat") -> Chat:
        """Initialize a new conversation thread."""
        return ChatRepository.create(db, user_id, title)

    @staticmethod
    def rename_chat(db: Session, chat: Chat, new_title: str) -> Chat:
        """Manually rename chat title."""
        chat.title = new_title
        return ChatRepository.update(db, chat)

    @staticmethod
    def delete_chat(db: Session, chat: Chat) -> None:
        """Remove a conversation."""
        ChatRepository.delete(db, chat)

    @staticmethod
    def get_chat_messages(db: Session, chat_id: UUID, limit: int = 50, offset: int = 0) -> List[Message]:
        """Fetch historical messages chronologically."""
        return MessageRepository.get_by_chat_id(db, chat_id, limit, offset)

    @staticmethod
    def get_latest_chat_messages(db: Session, chat_id: UUID, limit: int = 10) -> List[Message]:
        """Fetch the latest messages from the chat, sorted chronologically ascending."""
        return MessageRepository.get_latest_by_chat_id(db, chat_id, limit)

    @staticmethod
    def log_message(db: Session, chat: Chat, role: str, content: str) -> Message:
        """Save a message and trigger auto-titling on the first user prompt."""
        # Log message record
        msg = MessageRepository.create(db, chat.id, role, content)

        # Trigger auto-titling if chat is titled 'New Chat' and this is the first user prompt
        if role == "user" and chat.title == "New Chat":
            user_msg_count = db.query(Message).filter(
                Message.chat_id == chat.id,
                Message.role == "user"
            ).count()
            
            if user_msg_count <= 1:
                words = content.strip().split()
                if words:
                    title_words = words[:6]
                    auto_title = " ".join(title_words)
                    if len(words) > 6:
                        auto_title += "..."
                    chat.title = auto_title
                    ChatRepository.update(db, chat)

        return msg
