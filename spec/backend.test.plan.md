# Backend Test Plan

## Test Strategy

### Test Levels
1. **Service Layer Unit Tests** — Verify business logic of each service
2. **Router E2E Tests** — Verify API endpoint input/output using FastAPI TestClient

### Test Data
- Production data (5 million records) is not used in tests
- Define a small sample dataset (approximately 100 records) as test fixtures in conftest.py
- Sample data includes both prediction=0 (normal) and prediction=1 (fraud) (50:50 ratio for ease of testing)
- PredictionService is mocked to return fixed fraud_score / prediction values

### Test Framework
- pytest
- FastAPI TestClient (httpx-based)
- conftest.py provides test DataStore as fixtures

---

## conftest.py Fixture Design

```python
@pytest.fixture
def sample_transactions() -> pd.DataFrame:
    """100 sample transaction records (50 normal + 50 fraud)"""

@pytest.fixture
def sample_accounts() -> dict:
    """Sample account master data for 10 accounts"""

@pytest.fixture
def sample_patterns() -> list:
    """3 sample fraud patterns (CYCLE, FAN-OUT, BIPARTITE)"""

@pytest.fixture
def mock_prediction_service() -> PredictionService:
    """Mocked PredictionService (returns fixed scores)"""

@pytest.fixture
def data_store(sample_transactions, sample_accounts, sample_patterns, mock_prediction_service) -> DataStore:
    """Test DataStore instance (with prediction/fraud_score columns applied)"""

@pytest.fixture
def app(data_store) -> FastAPI:
    """Test FastAPI application (DataStore replaced via DI)"""

@pytest.fixture
def client(app) -> TestClient:
    """Test HTTP client"""
```

---

## Service Layer Tests

### test_prediction_service.py
| Test Case | Verification |
|---|---|
| test_load_model | aml_pipeline.joblib loads successfully |
| test_load_feature_columns | feature_columns.joblib column list matches expected |
| test_load_cat_columns | cat_columns.joblib column list matches expected |
| test_predict_batch_adds_columns | prediction and fraud_score columns are added after predict_batch |
| test_predict_batch_score_range | fraud_score is within 0.0-1.0 range |
| test_predict_batch_labels | prediction is only 0 or 1 |
| test_predict_batch_chunked | Large datasets are processed via chunk splitting |
| test_predict_single | Prediction result is returned for a single transaction |
| test_get_feature_importances | Feature importance list is non-empty and sorted by importance descending |
| test_column_name_mapping | snake_case to model-expected format conversion is correct |
| test_handle_unknown_categories | Unknown category values do not cause errors |

### test_transaction_service.py
| Test Case | Verification |
|---|---|
| test_get_transactions_default | Transaction list is returned with default parameters |
| test_get_transactions_filter_by_bank | from_bank filter works correctly |
| test_get_transactions_filter_by_date_range | Date range filter works correctly |
| test_get_transactions_filter_by_amount | Amount range filter works correctly |
| test_get_transactions_pagination | page and per_page function correctly |
| test_get_transactions_sort | Sort column and order work correctly |
| test_get_transaction_detail | Detail is retrieved by transaction ID |
| test_get_transaction_detail_not_found | Returns 404 for non-existent ID |
| test_get_transaction_detail_has_feature_importances | Feature importances are included |

### test_network_service.py
| Test Case | Verification |
|---|---|
| test_get_network_single_hop | Nodes and edges are returned for 1 hop |
| test_get_network_multi_hop | Reachable nodes are included for multiple hops |
| test_get_network_with_date_filter | Date filter is applied |
| test_get_network_node_has_fraud_score | Nodes contain fraud_score |
| test_get_network_origin_node_marked | Origin node has is_origin: true set |
| test_get_network_patterns_included | Related patterns are included |
| test_get_network_node_limit | When node count exceeds limit (200), truncated: true is returned |

### test_account_service.py
| Test Case | Verification |
|---|---|
| test_get_account_profile | Account information and summary are returned |
| test_get_account_not_found | Returns 404 for non-existent account ID |
| test_get_account_transactions_all | All transactions are returned |
| test_get_account_transactions_sent | Only sent transactions are filtered |
| test_get_account_transactions_received | Only received transactions are filtered |
| test_get_account_counterparties | Counterparty list is correctly aggregated |
| test_get_account_counterparties_sort | Sort works correctly |
| test_get_account_timeline | Daily aggregation is correct |
| test_get_account_timeline_has_flagged | has_flagged: true on days with fraud transactions |

### test_alert_service.py
| Test Case | Verification |
|---|---|
| test_get_alerts_default | All alerts are returned sorted by fraud_score descending |
| test_get_alerts_filter_by_status | Status filter works |
| test_get_alerts_filter_by_score_range | Score range filter works |
| test_get_alerts_filter_by_bank | Bank filter works |
| test_get_alerts_pagination | Pagination works |
| test_get_alerts_summary | Summary counts are correct |
| test_update_alert_status | Status update is reflected |
| test_update_alert_status_not_found | Returns 404 for non-existent ID |
| test_update_alert_status_invalid | Returns 422 for invalid status value |

### test_note_service.py
| Test Case | Verification |
|---|---|
| test_create_note | Note is created successfully |
| test_create_note_transaction_not_found | Returns 404 for non-existent transaction ID |
| test_create_note_empty_content | Returns 422 for empty content |
| test_create_note_content_too_long | Returns 422 for content exceeding 500 characters |
| test_get_notes_empty | Returns empty array when no notes exist |
| test_get_notes_ordered | Newest note appears first |
| test_get_notes_multiple | Multiple notes are returned correctly |

### test_analytics_service.py
| Test Case | Verification |
|---|---|
| test_heatmap_all_slots | All day-of-week x hour entries are returned (7x24 = 168 entries) |
| test_heatmap_with_date_filter | Count changes with date filter |
| test_currency_payment_matrix | Fraud rate for all combinations is within 0-1 range |
| test_high_risk_banks_by_count | Sorted in descending order by count |
| test_high_risk_banks_by_amount | Sorted in descending order by amount |
| test_high_risk_banks_limit | limit parameter functions correctly |
| test_feature_importances | Feature list is non-empty |
| test_pattern_distribution | Counts per pattern type are returned |

### test_master_service.py
| Test Case | Verification |
|---|---|
| test_get_banks | Bank list is returned |
| test_get_currencies | Currency list is returned |
| test_get_payment_formats | Payment format list is returned |
| test_search_accounts | Accounts are searched by prefix match |
| test_search_accounts_no_match | Returns empty array when no match |
| test_search_accounts_limit | limit parameter functions correctly |

---

## Router E2E Tests

Common test patterns for each router:

| Aspect | Test Content |
|---|---|
| Success case | 200 response and response structure verification |
| Pagination | meta.total, meta.page, meta.per_page verification |
| 404 | Access to non-existent resource |
| 422 | Invalid parameter type verification |
| Filter | Query parameters are correctly applied |

### Router Test File List
- `test_routers/test_transactions.py`
- `test_routers/test_network.py`
- `test_routers/test_accounts.py`
- `test_routers/test_alerts.py`
- `test_routers/test_notes.py`
- `test_routers/test_analytics.py`
- `test_routers/test_master.py`

---

## Test Execution

```bash
# Run all tests
cd backend && pytest -v

# Service layer only
pytest tests/test_*_service.py -v

# Routers only
pytest tests/test_routers/ -v

# With coverage
pytest --cov=app --cov-report=term-missing -v
```
