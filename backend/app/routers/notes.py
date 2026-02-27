from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from app.data_store import DataStore, get_data_store
from app.services.note_service import NoteService
from app.schemas.note import NoteCreate

router = APIRouter(prefix="/api/v1", tags=["notes"])

_note_service: NoteService | None = None


def get_note_service(ds: DataStore = Depends(get_data_store)) -> NoteService:
    global _note_service
    if _note_service is None:
        _note_service = NoteService(ds)
    return _note_service


@router.get("/transactions/{transaction_id}/notes")
def get_notes(
    transaction_id: str,
    svc: NoteService = Depends(get_note_service),
):
    result = svc.get_notes(transaction_id)
    if result is None:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Transaction not found"})
    return {"data": result}


@router.post("/transactions/{transaction_id}/notes")
def create_note(
    transaction_id: str,
    body: NoteCreate,
    svc: NoteService = Depends(get_note_service),
):
    try:
        result = svc.create_note(transaction_id, body.content, body.author)
    except ValueError as e:
        raise HTTPException(status_code=422, detail={"code": "VALIDATION_ERROR", "message": str(e)})

    if result is None:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Transaction not found"})

    return JSONResponse(status_code=201, content={"data": result})
