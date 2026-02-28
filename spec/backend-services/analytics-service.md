# Analytics Service Design

## Responsibility
Provide aggregated data for the pattern analysis page.

## Dependencies
- DataStore (data loader service)

## Endpoint Implementation

### GET /api/v1/analytics/heatmap
Aggregate fraud transaction counts by day-of-week x hour.

1. Extract the subset where `prediction == 1` from DataStore.transactions
2. Apply date filter (start_date / end_date)
3. Group by `day_of_week` and `hour`, count occurrences
4. Return all combinations of days (Monday-Sunday) x hours (0-23) (including zero counts)
5. Days are ordered: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday

### GET /api/v1/analytics/currency-payment-matrix
Return cross-tabulation by payment method x currency.

1. Apply date filter
2. Group by `payment_format` and `payment_currency`
3. For each combination:
   - total_count: total transaction count
   - fraud_count: count where prediction == 1
   - fraud_rate: fraud_count / total_count
4. Exclude combinations where total_count is 0

### GET /api/v1/analytics/high-risk-banks
Return ranking of banks with the most fraud transactions.

1. Extract transactions where prediction == 1
2. Apply date filter
3. Group by `from_bank` (banks involved in fraud transactions as sender)
4. Based on metric parameter:
   - `count`: sort by fraud transaction count descending
   - `amount`: sort by sum of amount_paid for fraud transactions descending
5. Add bank names using bank_lookup
6. Return top `limit` entries

### GET /api/v1/analytics/feature-importances
Return DataStore.feature_importances as-is.
Already sorted by importance descending.

### GET /api/v1/analytics/pattern-distribution
Aggregate counts by pattern type from DataStore.patterns.

1. Apply date filter (based on dates of transactions within patterns)
2. Group by pattern_type
3. For each pattern type:
   - count: number of patterns
   - total_amount: sum of amount_paid for related transactions
4. Sort by count descending

## Performance Considerations
- Heatmap and cross-tabulation can be pre-computed and cached at startup (when no date filter is applied)
- When date filter is provided, compute per request
