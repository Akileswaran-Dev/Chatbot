from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.settings import Settings


class SettingsRepository:
    @staticmethod
    def get_by_user_id(db: Session, user_id: UUID) -> Optional[Settings]:
        """Fetch preference configurations linked to user UUID."""
        return db.query(Settings).filter(Settings.user_id == user_id).first()

    @staticmethod
    def create(db: Session, settings: Settings) -> Settings:
        """Insert a default configuration record."""
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings

    @staticmethod
    def update(db: Session, db_obj: Settings) -> Settings:
        """Save preference updates to the database."""
        db.commit()
        db.refresh(db_obj)
        return db_obj
