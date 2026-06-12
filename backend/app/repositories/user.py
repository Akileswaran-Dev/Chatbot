from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import User


class UserRepository:
    @staticmethod
    def get_by_id(db: Session, user_id: UUID) -> Optional[User]:
        """Fetch user record by UUID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """Fetch user record by unique email."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def create(db: Session, user: User) -> User:
        """Insert a new user record into the database."""
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
