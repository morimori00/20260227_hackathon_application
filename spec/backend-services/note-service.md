# Note Service Design

## Responsibility
Add and retrieve staff notes for transactions.

## Dependencies
- DataStore (used for transaction ID existence verification)

## Data Structure

```python
@dataclass
class Note:
    note_id: str           # Format: "note_001" (auto-incremented)
    transaction_id: str    # Target transaction ID
    content: str           # Note content (max 500 characters)
    author: str            # Staff name
    created_at: datetime   # Creation time
```

### Storage
- Managed in an in-memory dictionary: `transaction_id → list[Note]`
- Resets on application restart (no DB persistence in this prototype)
- Auto-increment counter: global increment

## Endpoint Implementation

### GET /api/v1/transactions/:transactionId/notes
1. Verify that transactionId exists in DataStore (return 404 if not found)
2. Retrieve the note list for the transaction from the note dictionary
3. Sort by created_at descending (newest note first)
4. Return the list (return empty array if no notes exist)

### POST /api/v1/transactions/:transactionId/notes
1. Verify that transactionId exists in DataStore (return 404 if not found)
2. Validate the request body:
   - content: required, 1-500 characters
   - author: required, 1-100 characters
3. Create a Note object (note_id auto-incremented, created_at set to current time)
4. Add to the note dictionary
5. Return the created Note (201 Created)

## Validation
- If transactionId does not exist: 404
- If content is empty or exceeds 500 characters: 422
- If author is empty: 422
