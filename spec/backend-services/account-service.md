# Account Service Design

## Responsibility
Retrieve account profile information and provide transaction history, counterparties, and timeline related to the account.

## Dependencies
- DataStore (data loader service)

## Endpoint Implementation

### GET /api/v1/accounts/:accountId
1. Retrieve account information from account_lookup (bank_name, entity_id, entity_name)
2. Extract transactions involving the account from transactions (from_account or to_account)
3. Aggregate summary:
   - total_transactions: count of sent + received transactions
   - total_sent: sum of amount_paid for transactions where from_account matches
   - total_received: sum of amount_received for transactions where to_account matches
   - flagged_transactions: count of transactions where prediction == 1
4. If account ID does not exist in account_lookup: 404

### GET /api/v1/accounts/:accountId/transactions
1. Extract transactions for the account from transactions
2. Filter based on direction parameter:
   - `sent`: from_account == accountId
   - `received`: to_account == accountId
   - `all`: matches either
3. Apply date filter
4. Sort by timestamp descending
5. Apply pagination
6. Add bank names using bank_lookup

### GET /api/v1/accounts/:accountId/counterparties
1. Extract transactions for the account based on direction
2. Group by counterparty account and aggregate:
   - transaction_count: number of transactions
   - total_amount: total amount
   - last_transaction_date: most recent transaction date/time
   - has_flagged_transactions: whether fraud-flagged transactions exist
3. Add counterparty bank name using bank_lookup
4. Sort by sort_by / sort_order
5. Apply pagination

### GET /api/v1/accounts/:accountId/timeline
1. Extract transactions for the account
2. Group by date
3. For each date:
   - sent_amount: total sent amount
   - received_amount: total received amount
   - sent_count: number of sent transactions
   - received_count: number of received transactions
   - has_flagged: whether fraud-flagged transactions exist
4. Sort by date ascending

## Validation
- If accountId does not exist: 404
- Invalid query parameters: 422
