from datetime import datetime
from typing import Optional

from app.data_store import DataStore


class NoteService:
    def __init__(self, data_store: DataStore):
        self.data_store = data_store
        self._notes: dict[str, list[dict]] = {}
        self._counter = 0

    def _transaction_exists(self, transaction_id: str) -> bool:
        return not self.data_store.transactions[
            self.data_store.transactions["id"] == transaction_id
        ].empty

    def get_notes(self, transaction_id: str) -> Optional[list[dict]]:
        if not self._transaction_exists(transaction_id):
            return None

        notes = self._notes.get(transaction_id, [])
        return sorted(notes, key=lambda x: x["created_at"], reverse=True)

    def create_note(
        self, transaction_id: str, content: str, author: str
    ) -> Optional[dict]:
        if not self._transaction_exists(transaction_id):
            return None

        if not content or len(content) > 500:
            raise ValueError("Content must be 1-500 characters")
        if not author or len(author) > 100:
            raise ValueError("Author must be 1-100 characters")

        self._counter += 1
        note = {
            "note_id": f"note_{self._counter:03d}",
            "transaction_id": transaction_id,
            "content": content,
            "author": author,
            "created_at": datetime.utcnow().isoformat(),
        }

        if transaction_id not in self._notes:
            self._notes[transaction_id] = []
        self._notes[transaction_id].append(note)

        return note
