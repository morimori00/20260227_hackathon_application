# Master Data Service Design

## Responsibility
Provide lists of banks, currencies, and payment methods for frontend filter dropdowns, and autocomplete for account search.

## Dependencies
- DataStore (data loader service)

## Endpoint Implementation

### GET /api/v1/master/banks
1. Retrieve all banks from DataStore.bank_lookup
2. Sort by bank_name ascending
3. Return an array of `[{ "bank_id": str, "bank_name": str }]`

### GET /api/v1/master/currencies
1. Get unique values from the `payment_currency` column of DataStore.transactions
2. Sort alphabetically
3. Return an array of strings

### GET /api/v1/master/payment-formats
1. Get unique values from the `payment_format` column of DataStore.transactions
2. Sort alphabetically
3. Return an array of strings

### GET /api/v1/accounts/search
1. Receive query string `q` (minimum 1 character)
2. Perform prefix match search on the keys (account IDs) of DataStore.account_lookup
3. Add bank_id and bank_name to matched accounts
4. Return at most `limit` entries (default: 10)
5. Return empty array if no results

## Performance Considerations
- banks, currencies, and payment_formats are computed once at startup and cached (not recomputed per request)
- The prefix match search for accounts/search is optimized via binary search on a sorted account ID list
