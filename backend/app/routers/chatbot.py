import logging

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.data_store import DataStore, get_data_store
from app.services.chatbot_service import ChatbotService
from app.schemas.chatbot import ChatRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chat", tags=["chatbot"])

_chatbot_service: ChatbotService | None = None


def get_chatbot_service(ds: DataStore = Depends(get_data_store)) -> ChatbotService:
    global _chatbot_service
    if _chatbot_service is None:
        _chatbot_service = ChatbotService(ds)
    return _chatbot_service


@router.post("")
def chat(
    body: ChatRequest,
    svc: ChatbotService = Depends(get_chatbot_service),
):
    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    content = svc.chat(messages)
    return {"data": {"content": content}}


@router.post("/stream")
async def chat_stream(
    body: ChatRequest,
    svc: ChatbotService = Depends(get_chatbot_service),
):
    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    return StreamingResponse(
        svc.chat_stream(messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
