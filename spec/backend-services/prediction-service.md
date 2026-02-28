# Prediction Service Design

## Responsibility
Load the saved XGBClassifier pipeline and assign money laundering decisions (prediction labels and probability scores) to transaction data.

## Saved Model Files

| File | Type | Content |
|---|---|---|
| `saved_model/aml_pipeline.joblib` | sklearn.pipeline.Pipeline | Pipeline with OneHotEncoder + XGBClassifier |
| `saved_model/feature_columns.joblib` | list[str] | Feature column names required by the model |
| `saved_model/cat_columns.joblib` | list[str] | Categorical column names for OneHotEncoding |

### Pipeline Structure
```
Pipeline(
  Step 1: "Transformer" -> ColumnTransformer(
    "One Hot Encoding" -> Pipeline(OneHotEncoder(drop='first', handle_unknown='ignore'))
    Target columns: ['From Bank', 'Account', 'To Bank', 'Receiving Currency',
                 'Payment Currency', 'Payment Format', 'Week']
  )
  Step 2: "Estimator" -> XGBClassifier
)
```

### Input Columns Required by the Model (feature_columns)
```
['From Bank', 'Account', 'To Bank', 'Account.1',
 'Amount Received', 'Receiving Currency', 'Amount Paid',
 'Payment Currency', 'Payment Format', 'Week']
```

## Startup Processing

### 1. Model Loading
```python
import joblib

pipeline = joblib.load('saved_model/aml_pipeline.joblib')
feature_columns = joblib.load('saved_model/feature_columns.joblib')
cat_columns = joblib.load('saved_model/cat_columns.joblib')
```

### 2. Batch Inference on All Transaction Data

After the data loader reads and preprocesses the transaction data, execute the following:

1. Extract columns matching `feature_columns` from the transaction DataFrame
   - Note: The `Week` column does not exist in the original data, so a day-of-week name must be derived from `Timestamp`
   - `Account.1` corresponds to `to_account` in the original CSV
2. Rename input DataFrame columns to match the model's expected format:
   - `from_bank` → `From Bank`
   - `from_account` → `Account`
   - `to_bank` → `To Bank`
   - `to_account` → `Account.1`
   - `amount_received` → `Amount Received`
   - `receiving_currency` → `Receiving Currency`
   - `amount_paid` → `Amount Paid`
   - `payment_currency` → `Payment Currency`
   - `payment_format` → `Payment Format`
   - `day_of_week` → `Week`
3. Get prediction labels (0 or 1) via `pipeline.predict(input_df)`
4. Get fraud probability scores (0.0-1.0) via `pipeline.predict_proba(input_df)[:, 1]`
5. Add the following columns to the transaction DataFrame:
   - `prediction`: prediction label (0 = Normal, 1 = Laundering)
   - `fraud_score`: fraud probability score (float)

### 3. Feature Importance Extraction
```python
xgb_model = pipeline.named_steps['Estimator']
importances = xgb_model.feature_importances_

# Get feature names after OneHotEncoding
ohe = pipeline.named_steps['Transformer'].transformers_[0][1].named_steps['Encoder']
encoded_feature_names = ohe.get_feature_names_out(cat_columns)

# Numeric column feature names (not OneHotEncoded)
num_columns = [c for c in feature_columns if c not in cat_columns]

all_feature_names = list(encoded_feature_names) + num_columns
feature_importance_list = [
    {"feature": name, "importance": float(imp)}
    for name, imp in sorted(zip(all_feature_names, importances), key=lambda x: -x[1])
]
```

## Performance Considerations

### Batch Inference Optimization
- Running predict_proba on 5 million records at once may cause memory issues
- Process in chunks (100,000 rows at a time):
```python
chunk_size = 100_000
scores = []
predictions = []
for i in range(0, len(df), chunk_size):
    chunk = df.iloc[i:i+chunk_size]
    input_chunk = chunk[feature_columns]  # Column names already converted to model-expected format
    predictions.append(pipeline.predict(input_chunk))
    scores.append(pipeline.predict_proba(input_chunk)[:, 1])
df['prediction'] = np.concatenate(predictions)
df['fraud_score'] = np.concatenate(scores)
```

### handle_unknown='ignore'
- Bank IDs and account IDs not present in the training data will be encoded as all-zero vectors by the OneHotEncoder
- Warnings will appear but no errors will occur (already configured in the pipeline)

## Public Interface

```python
class PredictionService:
    pipeline: Pipeline
    feature_columns: list[str]
    cat_columns: list[str]
    feature_importances: list[dict]  # [{"feature": str, "importance": float}]

    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add prediction and fraud_score columns to the DataFrame and return it"""

    def predict_single(self, row: dict) -> dict:
        """Return prediction result for a single transaction"""
        # return {"prediction": int, "fraud_score": float}

    def get_feature_importances(self) -> list[dict]:
        """Return the importance list for all features"""
```
