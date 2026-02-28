# Alert Service Design

## Responsibility
Alert management for transactions flagged as fraudulent by the model (list retrieval, status changes).

## Dependencies
- DataStore (data loader service)

## Data Structure

### Alert Data Initialization
At application startup, extract rows where `prediction == 1` (transactions flagged as fraud by the model) from DataStore.transactions and generate the alert list.

Each alert has the following structure:
```python
@dataclass
class Alert:
    alert_id: str          # Format: "alert_00001"
    transaction_id: str    # Corresponding transaction ID
    status: str            # "pending" | "investigating" | "resolved" | "false_positive"
    fraud_score: float     # Model prediction probability
    created_at: datetime   # Alert creation time (= transaction timestamp)
    updated_at: datetime   # Last status update time
```

Initially, all alerts have status set to `pending`.

### Status Management
- Status is managed in an in-memory dictionary (alert_id → status, updated_at)
- Resets on application restart (no DB persistence in this prototype)

## Endpoint Implementation

### GET /api/v1/alerts
1. Retrieve the alert list
2. Filtering:
   - status: split comma-separated values and extract alerts matching any of them
   - from_bank, to_bank, currency, payment_format: filter by corresponding transaction data columns
   - min_amount / max_amount: filter by amount_paid
   - min_score / max_score: filter by fraud_score
   - start_date / end_date: filter by timestamp
3. Sort by sort_by / sort_order
4. Apply pagination
5. Add bank names using bank_lookup

### GET /api/v1/alerts/summary
1. Get total alert count
2. Aggregate counts by status
3. today_new: count of alerts linked to transactions on today's date (since this is demo data, treat the most recent date in the entire period as "today")

### PATCH /api/v1/alerts/:alertId/status
1. Search for the alert by alertId (return 404 if not found)
2. Validate the status from the request body (allowed values: pending, investigating, resolved, false_positive)
3. Update status and updated_at
4. Return the updated alert

## Validation
- If alertId does not exist: 404
- If an invalid status value is specified: 422
