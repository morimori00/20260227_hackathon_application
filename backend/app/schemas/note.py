from pydantic import BaseModel


class Note(BaseModel):
    note_id: str
    transaction_id: str
    content: str
    author: str
    created_at: str


class NoteCreate(BaseModel):
    content: str
    author: str
