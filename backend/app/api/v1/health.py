from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from app.api.deps import get_db

router = APIRouter()


@router.get("")
def health_check(db: Session = Depends(get_db)):
    try:
        # Perform a cheap SQL query to assert connectivity
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connectivity failed: {str(e)}"
        )
