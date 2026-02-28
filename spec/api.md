# API Design Document

## Common Specifications

### Base URL
```
http://localhost:8000/api/v1
```

### Response Format
All endpoints return responses in JSON format.

Success:
```json
{
  "data": { ... },
  "meta": { "total": 100, "page": 1, "per_page": 20 }
}
```

Error:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### Pagination
List endpoints are controlled via query parameters `page` (default: 1) and `per_page` (default: 20, max: 100).

### Date/Time Format
ISO 8601 format `YYYY-MM-DDTHH:MM:SS`

### About Fraud Detection
The transaction data does not include a fraud label (`Is Laundering`). All fraud decisions are assigned via batch inference using the XGBClassifier pipeline (`saved_model/aml_pipeline.joblib`) at startup.
- `prediction`: model prediction label (0 = normal, 1 = fraud)
- `fraud_score`: model fraud class probability (0.0-1.0)

---

## Endpoint List

### 1. Transactions

#### GET /transactions
Retrieve the transaction list.

Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| page | int | No | Page number (default: 1) |
| per_page | int | No | Items per page (default: 20) |
| from_bank | string | No | Filter by sender bank ID |
| to_bank | string | No | Filter by receiver bank ID |
| account_id | string | No | Filter by account ID (sender or receiver) |
| currency | string | No | Filter by payment currency |
| payment_format | string | No | Filter by payment method |
| min_amount | float | No | Minimum amount |
| max_amount | float | No | Maximum amount |
| start_date | string | No | Start date/time (ISO 8601) |
| end_date | string | No | End date/time (ISO 8601) |
| prediction | int | No | Model prediction label (0 = normal, 1 = fraud) |
| sort_by | string | No | Sort column (default: timestamp) |
| sort_order | string | No | asc / desc (default: desc) |

Response:
```json
{
  "data": [
    {
      "id": "txn_00001",
      "timestamp": "2022-09-01T00:20:00",
      "from_bank_id": "10",
      "from_bank_name": "US Bank #10",
      "from_account": "8000EBD30",
      "to_bank_id": "10",
      "to_bank_name": "US Bank #10",
      "to_account": "8000EBD30",
      "amount_received": 3697.34,
      "receiving_currency": "US Dollar",
      "amount_paid": 3697.34,
      "payment_currency": "US Dollar",
      "payment_format": "Reinvestment",
      "prediction": 0,
      "fraud_score": 0.02
    }
  ],
  "meta": { "total": 5078336, "page": 1, "per_page": 20 }
}
```

#### GET /transactions/:transactionId
Retrieve transaction details.

Response:
```json
{
  "data": {
    "id": "txn_00001",
    "timestamp": "2022-09-01T00:20:00",
    "from_bank_id": "10",
    "from_bank_name": "US Bank #10",
    "from_account": "8000EBD30",
    "from_entity_name": "Corporation #12345",
    "to_bank_id": "10",
    "to_bank_name": "US Bank #10",
    "to_account": "8000EBD30",
    "to_entity_name": "Sole Proprietorship #67890",
    "amount_received": 3697.34,
    "receiving_currency": "US Dollar",
    "amount_paid": 3697.34,
    "payment_currency": "US Dollar",
    "payment_format": "Reinvestment",
    "prediction": 0,
    "fraud_score": 0.02,
    "feature_importances": [
      { "feature": "Amount Paid", "importance": 0.35 },
      { "feature": "Payment Format_ACH", "importance": 0.22 },
      { "feature": "Week_Saturday", "importance": 0.15 },
      { "feature": "Payment Currency_Bitcoin", "importance": 0.12 },
      { "feature": "From Bank_70", "importance": 0.08 }
    ]
  }
}
```

---

### 2. Network

#### GET /network
Retrieve network graph data starting from a specified account.

Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| account_id | string | Yes | Origin account ID |
| hops | int | No | Number of exploration hops (default: 2, max: 5) |
| start_date | string | No | Start date/time |
| end_date | string | No | End date/time |

Response:
```json
{
  "data": {
    "nodes": [
      {
        "id": "8000EBD30",
        "bank_id": "10",
        "bank_name": "US Bank #10",
        "entity_name": "Corporation #12345",
        "total_amount": 500000.00,
        "transaction_count": 25,
        "fraud_score": 0.85,
        "is_origin": true
      }
    ],
    "edges": [
      {
        "id": "txn_00001",
        "source": "8000EBD30",
        "target": "8000F5340",
        "amount": 3697.34,
        "currency": "US Dollar",
        "timestamp": "2022-09-01T00:20:00",
        "payment_format": "Cheque",
        "prediction": 0,
        "fraud_score": 0.02
      }
    ],
    "patterns": [
      {
        "type": "CYCLE",
        "detail": "Max 10 hops",
        "transaction_ids": ["txn_00021", "txn_00022", "txn_00023"],
        "total_amount": 150000.00
      }
    ]
  }
}
```

---

### 3. Accounts

#### GET /accounts/:accountId
Retrieve account profile.

Response:
```json
{
  "data": {
    "account_id": "8000EBD30",
    "bank_id": "10",
    "bank_name": "US Bank #10",
    "entity_id": "80062E240",
    "entity_name": "Corporation #12345",
    "summary": {
      "total_transactions": 150,
      "total_sent": 2500000.00,
      "total_received": 3200000.00,
      "flagged_transactions": 3
    }
  }
}
```

#### GET /accounts/:accountId/transactions
Retrieve account transaction history.

Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| page | int | No | Page number |
| per_page | int | No | Items per page |
| direction | string | No | sent / received / all (default: all) |
| start_date | string | No | Start date/time |
| end_date | string | No | End date/time |

Response is in the same format as GET /transactions.

#### GET /accounts/:accountId/counterparties
Retrieve counterparty account list.

Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| direction | string | No | sent / received / all (default: all) |
| sort_by | string | No | transaction_count / total_amount / last_transaction (default: transaction_count) |
| sort_order | string | No | asc / desc (default: desc) |

Response:
```json
{
  "data": [
    {
      "account_id": "8000F5340",
      "bank_id": "1",
      "bank_name": "US Bank #1",
      "transaction_count": 12,
      "total_amount": 45000.00,
      "last_transaction_date": "2022-09-08T14:30:00",
      "has_flagged_transactions": true
    }
  ],
  "meta": { "total": 35, "page": 1, "per_page": 20 }
}
```

#### GET /accounts/:accountId/timeline
Retrieve daily transaction amount trends for the account.

Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| start_date | string | No | Start date |
| end_date | string | No | End date |

Response:
```json
{
  "data": [
    {
      "date": "2022-09-01",
      "sent_amount": 50000.00,
      "received_amount": 75000.00,
      "sent_count": 3,
      "received_count": 5,
      "has_flagged": true
    }
  ]
}
```

---

### 4. Alerts

#### GET /alerts
Retrieve the list of transactions flagged as fraudulent by the model (alerts).

Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| page | int | No | Page number |
| per_page | int | No | Items per page |
| status | string | No | Comma-separated, multiple values allowed (pending / investigating / resolved / false_positive) |
| from_bank | string | No | Sender bank ID |
| to_bank | string | No | Receiver bank ID |
| currency | string | No | Currency |
| payment_format | string | No | Payment method |
| min_amount | float | No | Minimum amount |
| max_amount | float | No | Maximum amount |
| min_score | float | No | Minimum fraud score (0.0-1.0) |
| max_score | float | No | Maximum fraud score (0.0-1.0) |
| start_date | string | No | Start date/time |
| end_date | string | No | End date/time |
| sort_by | string | No | fraud_score / timestamp / amount (default: fraud_score) |
| sort_order | string | No | asc / desc (default: desc) |

Response:
```json
{
  "data": [
    {
      "alert_id": "alert_00001",
      "transaction_id": "txn_04742",
      "status": "pending",
      "fraud_score": 0.93,
      "timestamp": "2022-09-01T00:21:00",
      "from_bank_id": "70",
      "from_bank_name": "Bank #70",
      "from_account": "100428660",
      "to_bank_id": "1124",
      "to_bank_name": "Bank #1124",
      "to_account": "800825340",
      "amount_paid": 389769.39,
      "payment_currency": "US Dollar",
      "payment_format": "Cheque"
    }
  ],
  "meta": { "total": 5177, "page": 1, "per_page": 20 }
}
```

#### GET /alerts/summary
Retrieve alert summary statistics.

Response:
```json
{
  "data": {
    "total": 5177,
    "by_status": {
      "pending": 4800,
      "investigating": 200,
      "resolved": 150,
      "false_positive": 27
    },
    "today_new": 42
  }
}
```

#### PATCH /alerts/:alertId/status
Update an alert's status.

Request Body:
```json
{
  "status": "investigating"
}
```

Response:
```json
{
  "data": {
    "alert_id": "alert_00001",
    "status": "investigating",
    "updated_at": "2024-01-15T10:30:00"
  }
}
```

---

### 5. Notes

#### GET /transactions/:transactionId/notes
Retrieve the list of staff notes for a transaction.

Response:
```json
{
  "data": [
    {
      "note_id": "note_001",
      "transaction_id": "txn_04742",
      "content": "Investigating related patterns. Origin account of FAN-OUT pattern.",
      "author": "operator_01",
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

#### POST /transactions/:transactionId/notes
Add a note to a transaction.

Request Body:
```json
{
  "content": "Investigation complete. Determined to be a legitimate transaction.",
  "author": "operator_01"
}
```

Response: Created note object (201 Created).

---

### 6. Analytics

#### GET /analytics/heatmap
Retrieve heatmap data of fraud transaction counts by day-of-week x hour.

Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| start_date | string | No | Start date |
| end_date | string | No | End date |

Response:
```json
{
  "data": [
    { "day_of_week": "Monday", "hour": 0, "count": 5 },
    { "day_of_week": "Monday", "hour": 1, "count": 3 }
  ]
}
```

#### GET /analytics/currency-payment-matrix
Retrieve fraud rate cross-tabulation by payment method x currency.

Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| start_date | string | No | Start date |
| end_date | string | No | End date |

Response:
```json
{
  "data": [
    {
      "payment_format": "ACH",
      "currency": "US Dollar",
      "total_count": 150000,
      "fraud_count": 2500,
      "fraud_rate": 0.0167
    }
  ]
}
```

#### GET /analytics/high-risk-banks
Retrieve high-risk bank ranking.

Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| metric | string | No | count / amount (default: count) |
| limit | int | No | Top N entries (default: 10) |
| start_date | string | No | Start date |
| end_date | string | No | End date |

Response:
```json
{
  "data": [
    {
      "bank_id": "70",
      "bank_name": "Bank #70",
      "fraud_transaction_count": 633,
      "fraud_total_amount": 1500000000.00
    }
  ]
}
```

#### GET /analytics/feature-importances
Retrieve model feature importances.

Response:
```json
{
  "data": [
    { "feature": "Amount Paid", "importance": 0.35 },
    { "feature": "Payment Format_ACH", "importance": 0.22 }
  ]
}
```

#### GET /analytics/pattern-distribution
Retrieve fraud pattern type distribution.

Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| start_date | string | No | Start date |
| end_date | string | No | End date |

Response:
```json
{
  "data": [
    { "pattern_type": "FAN-OUT", "count": 56, "total_amount": 25000000.00 },
    { "pattern_type": "CYCLE", "count": 45, "total_amount": 18000000.00 },
    { "pattern_type": "BIPARTITE", "count": 49, "total_amount": 22000000.00 },
    { "pattern_type": "STACK", "count": 43, "total_amount": 15000000.00 },
    { "pattern_type": "SCATTER-GATHER", "count": 44, "total_amount": 20000000.00 },
    { "pattern_type": "GATHER-SCATTER", "count": 48, "total_amount": 19000000.00 },
    { "pattern_type": "RANDOM", "count": 42, "total_amount": 12000000.00 },
    { "pattern_type": "FAN-IN", "count": 43, "total_amount": 16000000.00 }
  ]
}
```

---

### 7. Master Data

#### GET /master/banks
Retrieve bank list (data source for filter dropdowns).

Response:
```json
{
  "data": [
    { "bank_id": "10", "bank_name": "US Bank #10" },
    { "bank_id": "70", "bank_name": "Bank #70" }
  ]
}
```

#### GET /master/currencies
Retrieve currency list.

Response:
```json
{
  "data": ["US Dollar", "Bitcoin", "Euro", "Australian Dollar", "Yuan", "Rupee", "Yen", "Mexican Peso", "UK Pound", "Ruble", "Canadian Dollar", "Swiss Franc", "Brazil Real", "Saudi Riyal", "Shekel"]
}
```

#### GET /master/payment-formats
Retrieve payment method list.

Response:
```json
{
  "data": ["Reinvestment", "Cheque", "Credit Card", "ACH", "Cash", "Wire", "Bitcoin"]
}
```

#### GET /accounts/search
For account ID autocomplete search.

Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| q | string | Yes | Search string (prefix match) |
| limit | int | No | Maximum results (default: 10) |

Response:
```json
{
  "data": [
    {
      "account_id": "8000EBD30",
      "bank_id": "10",
      "bank_name": "US Bank #10"
    }
  ]
}
```
