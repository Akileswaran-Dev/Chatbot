from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.settings import Settings
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password


class AuthService:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate) -> Optional[User]:
        """Register a user, hashing passwords and creating default settings."""
        # Prevent email collision
        existing_user = UserRepository.get_by_email(db, user_in.email)
        if existing_user:
            return None

        # Create user record
        hashed_pw = get_password_hash(user_in.password)
        db_user = User(
            email=user_in.email,
            hashed_password=hashed_pw
        )
        UserRepository.create(db, db_user)

        # Create default user settings record
        default_settings = Settings(
            user_id=db_user.id
        )
        db.add(default_settings)
        db.commit()
        db.refresh(db_user)

        return db_user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """Verify user credentials."""
        db_user = UserRepository.get_by_email(db, email)
        if not db_user:
            return None
        if not verify_password(password, db_user.hashed_password):
            return None
        return db_user
