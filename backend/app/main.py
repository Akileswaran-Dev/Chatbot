import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

# Conditionally disable API footprint exposure in production
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.ENV != "production" else None,
    docs_url="/docs" if settings.ENV != "production" else None,
    redoc_url="/redoc" if settings.ENV != "production" else None,
)

# CORS configurations.
# Restricts cross-origin requests to allowed domains in production
if settings.ENV == "production":
    try:
        origins = json.loads(settings.CORS_ORIGINS)
    except Exception:
        origins = ["http://localhost:5173"]
else:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 router prefixing (e.g. /api/v1)
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API. Access /health or {settings.API_V1_STR}/health for diagnostics."
    }
