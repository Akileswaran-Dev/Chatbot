from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserOut
from app.schemas.settings import SettingsOut, SettingsUpdate
from app.repositories.settings import SettingsRepository

router = APIRouter()


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Fetch active authenticated user profile details."""
    return current_user


@router.get("/me/settings", response_model=SettingsOut)
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch user settings and model preferences."""
    db_settings = SettingsRepository.get_by_user_id(db, current_user.id)
    if not db_settings:
        raise HTTPException(status_code=404, detail="Settings preferences not found.")
    return db_settings


@router.put("/me/settings", response_model=SettingsOut)
def update_settings(
    settings_in: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update settings and model preferences."""
    db_settings = SettingsRepository.get_by_user_id(db, current_user.id)
    if not db_settings:
        raise HTTPException(status_code=404, detail="Settings preferences not found.")

    # Apply preference updates
    db_settings.theme = settings_in.theme
    db_settings.model_name = settings_in.model_name
    db_settings.temperature = settings_in.temperature
    db_settings.system_prompt = settings_in.system_prompt

    return SettingsRepository.update(db, db_settings)
