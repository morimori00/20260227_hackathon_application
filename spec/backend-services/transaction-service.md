# Transaction Service Design

## Responsibility
Search, retrieve, and display detailed transaction data.

## Dependencies
- DataStore (data loader service)

## Endpoint Implementation

### GET /api/v1/transactions
Perform the following on DataStore.transactions:
1. Filter based on query parameters (narrow down using pandas conditional expressions)
2. Apply sort column and sort order
3. Pagination (calculate offset / limit)
4. Add bank names using bank_lookup
5. Format and return the response

Filtering logic:
- `from_bank`: `df[df['from_bank'] == value]`
- `to_bank`: `df[df['to_bank'] == value]`
- `account_id`: `df[(df['from_account'] == value) | (df['to_account'] == value)]`
- `currency`: `df[df['payment_currency'] == value]`
- `payment_format`: `df[df['payment_format'] == value]`
- `min_amount` / `max_amount`: `df[(df['amount_paid'] >= min) & (df['amount_paid'] <= max)]`
- `start_date` / `end_date`: `df[(df['timestamp'] >= start) & (df['timestamp'] <= end)]`
- `prediction`: `df[df['prediction'] == value]`

### GET /api/v1/transactions/:transactionId
1. Retrieve a single record by ID from DataStore.transactions
2. Add entity information for sender and receiver using account_lookup
3. Calculate feature importance for the individual transaction from the model:
   - Return SHAP values from XGBClassifier, or return global feature_importances
   - Return the top 5 feature names and importances

## Validation
- If transactionId does not exist: 404
- Invalid query parameter type: 422
