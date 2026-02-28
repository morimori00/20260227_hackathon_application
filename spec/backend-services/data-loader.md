# Data Loader Service Design

## Responsibility
Load CSV/TXT files at application startup, perform preprocessing, run model inference via PredictionService, and make data queryable by other services.

## Data Sources
- `data/HI-Small_Trans.csv.csv` — Transaction data (approximately 5 million records, no fraud labels)
- `data/HI-Small_accounts.csv` — Account master data (approximately 510,000 records)
- `data/HI-Small_Patterns.txt` — Fraud pattern definitions (370 patterns)

**Important**: The actual transaction data does not contain an `Is Laundering` column. Fraud detection is assigned by PredictionService model inference.

## Startup Processing Flow

### 1. Loading and Preprocessing Transaction Data
1. Load CSV as a pandas DataFrame
2. Remove duplicate rows
3. Normalize column names to snake_case:
   - `Timestamp` → `timestamp`
   - `From Bank` → `from_bank`
   - `Account` → `from_account`
   - `To Bank` → `to_bank`
   - `Account.1` → `to_account`
   - `Amount Received` → `amount_received`
   - `Receiving Currency` → `receiving_currency`
   - `Amount Paid` → `amount_paid`
   - `Payment Currency` → `payment_currency`
   - `Payment Format` → `payment_format`
4. Convert `timestamp` to datetime type
5. Add derived columns:
   - `day_of_week`: day name (Monday-Sunday)
   - `hour`: hour (0-23)
6. Assign sequential transaction ID `id` (format: `txn_00000001`)
7. Unify all column types: string IDs as str, amounts as float

### 2. Loading Account Master Data
1. Load CSV
2. Normalize column names:
   - `Bank Name` → `bank_name`
   - `Bank ID` → `bank_id`
   - `Account Number` → `account_id`
   - `Entity ID` → `entity_id`
   - `Entity Name` → `entity_name`
3. Unify `bank_id` to string type
4. Build bank ID to bank name dictionary (bank_lookup)
5. Build account ID to account info dictionary (account_lookup)

### 3. Loading Pattern Data
1. Parse the text file line by line
2. Extract blocks between `BEGIN LAUNDERING ATTEMPT` and `END LAUNDERING ATTEMPT`
3. Structure each block into:
   - `pattern_type`: pattern type (FAN-OUT, FAN-IN, CYCLE, RANDOM, BIPARTITE, STACK, SCATTER-GATHER, GATHER-SCATTER)
   - `detail`: detailed information (e.g., "Max 16-degree Fan-Out")
   - `transactions`: parse CSV lines within the block as transaction data (use timestamp + from_account + to_account as key for linking to transaction IDs)
4. Build the pattern list

### 4. Fraud Score Assignment via Model Inference (delegated to PredictionService)
1. Initialize PredictionService (load model files)
2. Pass the transaction DataFrame to PredictionService.predict_batch()
3. The returned DataFrame has the following columns added:
   - `prediction`: prediction label (0 = Normal, 1 = Laundering)
   - `fraud_score`: fraud probability score (0.0-1.0)
4. Retrieve and store model feature importances via PredictionService.get_feature_importances()

## Public Interface

```python
class DataStore:
    """Holds all data and provides a query interface to other services"""

    # Transaction data (pandas DataFrame)
    # Includes prediction and fraud_score columns
    transactions: pd.DataFrame

    # Account master data
    account_lookup: dict[str, AccountInfo]
    bank_lookup: dict[str, str]  # bank_id → bank_name

    # Pattern data
    patterns: list[PatternInfo]

    # Model information (retrieved from PredictionService)
    feature_importances: list[dict]  # [{"feature": str, "importance": float}]

    # PredictionService instance (retained for individual predictions)
    prediction_service: PredictionService
```

## Performance Considerations
- Keep the entire 5 million row DataFrame in memory (estimated memory usage: approximately 500MB-1GB)
- Load once at startup, read-only thereafter
- Model inference is executed in chunks at startup (100,000 rows at a time, see prediction-service.md)
- Build indexes for frequently used queries:
  - Dictionary grouped by `from_account`
  - Dictionary grouped by `to_account`
  - Pre-extracted subset where `prediction == 1`
