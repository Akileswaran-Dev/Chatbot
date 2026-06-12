from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.repositories.user import UserRepository
from app.models.user import User
from app.schemas.auth import TokenPayload

# OAuth2 scheme configures Swagger integrations and API validation routes.
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    """FastAPI route dependency that extracts and validates JWT Bearer tokens."""
    try:
        # Decode and parse JWT sub claims
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=["HS256"]
        )
        # Validate that payload has the required fields
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject claim.",
            )
        token_data = TokenPayload(sub=user_id)
    except (JWTError, Exception):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    # Fetch User record
    user = UserRepository.get_by_id(db, user_id=token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
