import json
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from google.genai.errors import APIError

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.chat import ChatOut, ChatCreate, ChatUpdate
from app.schemas.message import MessageOut, MessageCreate
from app.services.chat_service import ChatService
from app.services.gemini_service import GeminiService
from app.repositories.chat import ChatRepository
from app.repositories.settings import SettingsRepository

router = APIRouter()
gemini_service = GeminiService()


def get_user_chat_or_raise(db: Session, chat_id: UUID, user_id: UUID):
    """Retrieve chat record and raise 404 error if user is not the owner."""
    chat = ChatRepository.get_by_id(db, chat_id)
    if not chat or chat.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat conversation not found."
        )
    return chat


@router.get("", response_model=List[ChatOut])
def list_chats(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List chats belonging to current user."""
    return ChatService.get_user_chats(db, current_user.id, limit, offset)


@router.post("", response_model=ChatOut, status_code=status.HTTP_201_CREATED)
def create_chat(
    chat_in: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initialize a new chat conversation thread."""
    return ChatService.create_chat(db, current_user.id, chat_in.title)


@router.patch("/{chat_id}", response_model=ChatOut)
def rename_chat(
    chat_id: UUID,
    chat_in: ChatUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rename a conversation title."""
    chat = get_user_chat_or_raise(db, chat_id, current_user.id)
    return ChatService.rename_chat(db, chat, chat_in.title)


@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat(
    chat_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a conversation thread and purge all associated messages."""
    chat = get_user_chat_or_raise(db, chat_id, current_user.id)
    ChatService.delete_chat(db, chat)
    return None


@router.get("/{chat_id}/messages", response_model=List[MessageOut])
def get_messages(
    chat_id: UUID,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch chat history messages chronologically."""
    get_user_chat_or_raise(db, chat_id, current_user.id)
    return ChatService.get_chat_messages(db, chat_id, limit, offset)


@router.post("/{chat_id}/messages", response_model=MessageOut)
def create_message_fallback(
    chat_id: UUID,
    msg_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fallback route that appends a user message and returns user log details."""
    chat = get_user_chat_or_raise(db, chat_id, current_user.id)
    user_msg = ChatService.log_message(db, chat, role="user", content=msg_in.content)
    return user_msg


@router.post("/{chat_id}/stream")
def stream_ai_response(
    chat_id: UUID,
    msg_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send user prompt and stream Gemini 2.5 Flash response chunks via Server-Sent Events (SSE)."""
    chat = get_user_chat_or_raise(db, chat_id, current_user.id)

    # Save user message (triggers auto-titling if applicable)
    ChatService.log_message(db, chat, role="user", content=msg_in.content)

    # Load system settings
    settings_obj = SettingsRepository.get_by_user_id(db, current_user.id)
    system_prompt = settings_obj.system_prompt if settings_obj else "You are a helpful assistant."
    temperature = float(settings_obj.temperature) if settings_obj else 0.70

    # Fetch last 10 messages for context memory compiler
    history = ChatService.get_latest_chat_messages(db, chat.id, limit=10)
    contents = gemini_service.compile_history(history)

    def event_generator():
        full_response = ""
        try:
            # Call Google GenAI SDK streaming
            response_stream = gemini_service.generate_stream(
                contents=contents,
                system_prompt=system_prompt,
                temperature=temperature
            )

            for chunk in response_stream:
                chunk_text = chunk.text
                if chunk_text:
                    full_response += chunk_text
                    # Emit data event
                    yield f"data: {json.dumps({'chunk': chunk_text})}\n\n"

        except APIError as e:
            err_msg = str(e)
            # Catch Gemini 429 ResourceExhausted (rate limits) or auth errors
            if "429" in err_msg or "ResourceExhausted" in err_msg:
                yield f"data: {json.dumps({'error': 'Gemini API limit exceeded. Please wait a moment.'})}\n\n"
            else:
                yield f"data: {json.dumps({'error': f'Gemini API error: {err_msg}'})}\n\n"
            return
        except Exception as e:
            yield f"data: {json.dumps({'error': f'Server error: {str(e)}'})}\n\n"
            return

        # Save complete assistant response to database on successful stream completion
        if full_response:
            from app.core.database import SessionLocal
            from app.models.chat import Chat
            with SessionLocal() as db_session:
                db_chat = db_session.query(Chat).filter(Chat.id == chat.id).first()
                if db_chat:
                    ChatService.log_message(db_session, db_chat, role="model", content=full_response)

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Prevents Nginx/Vercel buffering issues
        }
    )
