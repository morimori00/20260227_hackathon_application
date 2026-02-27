# Implementation Plan

## Guiding Principles

- Always refer to `/spec` before implementing any component.
- Do not specify versions in `requirements.txt`.
- All implementation (code comments, UI text) must be in English, even though specs are in Japanese.
- Build bottom-up: data layer first, then services, then API routes, then frontend.
- Each phase should result in a testable, runnable state.

---

## Phase 1: Project Scaffolding

### 1.1 Backend project setup
- Create `backend/` directory structure per `spec/directry.md`
- Create `backend/requirements.txt`:
  ```
  fastapi
  uvicorn
  pandas
  xgboost
  scikit-learn
  joblib
  numpy
  pytest
  httpx
  ```
- Create `backend/app/__init__.py`, `backend/app/routers/__init__.py`, `backend/app/services/__init__.py`, `backend/app/schemas/__init__.py`
- Create `backend/tests/__init__.py`, `backend/tests/test_routers/__init__.py`
- Create `backend/app/config.py` with file paths:
  - `DATA_DIR` → `data/`
  - `MODEL_DIR` → `saved_model/`
  - Transaction CSV, accounts CSV, patterns TXT paths
- Copy `saved_model/` into `backend/saved_model/` (or mount via Docker volume)

### 1.2 Frontend project setup
- `npm create vite@latest frontend -- --template react-ts`
- Install dependencies: `axios`, `react-router-dom`, `recharts`, `react-force-graph-2d`, `d3`
- Install Tailwind CSS + configure `tailwind.config.js`
- Initialize shadcn/ui with `npx shadcn@latest init`
- Add shadcn components: button, card, table, badge, select, input, slider, tabs, tooltip, dropdown-menu, pagination
- Create `src/api/client.ts` with axios instance (`baseURL: http://localhost:8000/api/v1`)
- Create basic `App.tsx` with React Router routes
- Create `MainLayout.tsx` shell with sidebar placeholder

### 1.3 Docker Compose
- Create `docker-compose.yml` with two services:
  - `backend`: Python image, mount `data/` and `saved_model/`, expose port 8000
  - `frontend`: Node image, expose port 5173, proxy API to backend
- Verify `docker compose up` starts both services without errors

**Checkpoint: Both containers start. Backend returns 404 on any route. Frontend shows blank Vite page.**

---

## Phase 2: Backend Data Layer

### 2.1 PredictionService (`backend/app/prediction_service.py`)
Ref: `spec/backend-services/prediction-service.md`

- Load `aml_pipeline.joblib`, `feature_columns.joblib`, `cat_columns.joblib`
- Implement `predict_batch(df)`:
  - Map snake_case column names to model-expected names (e.g. `from_bank` → `From Bank`, `day_of_week` → `Week`, `to_account` → `Account.1`)
  - Process in 100k-row chunks
  - Add `prediction` (int) and `fraud_score` (float) columns
- Implement `predict_single(row_dict) → {"prediction": int, "fraud_score": float}`
- Implement `get_feature_importances() → list[dict]`:
  - Extract from XGBClassifier step in pipeline
  - Get OHE feature names from encoder + numeric column names
  - Return sorted by importance descending

### 2.2 DataStore (`backend/app/data_store.py`)
Ref: `spec/backend-services/data-loader.md`

- Implement startup loading sequence:
  1. Load transactions CSV → rename columns to snake_case → drop duplicates → parse timestamp → add `day_of_week`, `hour`, `id` columns
  2. Load accounts CSV → rename columns → build `bank_lookup` (bank_id→bank_name) and `account_lookup` (account_id→AccountInfo)
  3. Load patterns TXT → parse BEGIN/END blocks → build pattern list with transaction references
  4. Call `PredictionService.predict_batch()` → add `prediction` + `fraud_score` columns
- Build indexes:
  - `from_account_index`: dict[str, list[int]] (account_id → row indices)
  - `to_account_index`: dict[str, list[int]]
  - `flagged_subset`: DataFrame where prediction == 1
- Expose as a singleton accessed via FastAPI dependency injection

### 2.3 Schemas (`backend/app/schemas/`)
Ref: `spec/api.md`

- `common.py`: `PaginatedResponse`, `ErrorResponse`, `Meta`
- `transaction.py`: `TransactionSummary`, `TransactionDetail`, `FeatureImportance`
- `network.py`: `Node`, `Edge`, `Pattern`, `NetworkResponse`
- `account.py`: `AccountProfile`, `AccountSummary`, `Counterparty`, `TimelineEntry`
- `alert.py`: `Alert`, `AlertSummary`, `StatusUpdate`
- `note.py`: `Note`, `NoteCreate`
- `analytics.py`: `HeatmapEntry`, `CurrencyPaymentEntry`, `HighRiskBank`, `FeatureImportanceEntry`, `PatternDistributionEntry`

### 2.4 FastAPI app entry point (`backend/app/main.py`)
- Create FastAPI app
- On startup: initialize DataStore (load data + run predictions)
- Add CORS middleware (allow frontend origin)
- Include all routers (placeholder empty routers for now)
- Add health check endpoint `GET /api/v1/health`

**Checkpoint: `docker compose up` → backend starts, loads 5M rows, runs model inference, logs completion. `GET /api/v1/health` returns 200.**

---

## Phase 3: Backend Services + Routers (one by one)

Build each service + its router + its tests together. Order matters: simpler services first, building toward complex ones.

### 3.1 Master Service
Ref: `spec/backend-services/master-service.md`, `spec/api.md` §7

- `services/master_service.py`:
  - `get_banks()` → cached list from bank_lookup
  - `get_currencies()` → cached unique values
  - `get_payment_formats()` → cached unique values
  - `search_accounts(q, limit)` → prefix match on sorted account_id list
- `routers/master.py`:
  - `GET /api/v1/master/banks`
  - `GET /api/v1/master/currencies`
  - `GET /api/v1/master/payment-formats`
  - `GET /api/v1/accounts/search?q=&limit=`
- Tests: `test_master_service.py` (6 cases), `test_routers/test_master.py`

### 3.2 Transaction Service
Ref: `spec/backend-services/transaction-service.md`, `spec/api.md` §1

- `services/transaction_service.py`:
  - `get_transactions(filters, sort, pagination)` → filtered + paginated DataFrame
  - `get_transaction_detail(txn_id)` → single row enriched with entity names + feature importances
- `routers/transactions.py`:
  - `GET /api/v1/transactions`
  - `GET /api/v1/transactions/{transaction_id}`
- Tests: `test_transaction_service.py` (9 cases), `test_routers/test_transactions.py`

### 3.3 Account Service
Ref: `spec/backend-services/account-service.md`, `spec/api.md` §3

- `services/account_service.py`:
  - `get_account_profile(account_id)` → account info + summary stats
  - `get_account_transactions(account_id, direction, filters, pagination)`
  - `get_counterparties(account_id, direction, sort, pagination)`
  - `get_timeline(account_id, start_date, end_date)`
- `routers/accounts.py`:
  - `GET /api/v1/accounts/{account_id}`
  - `GET /api/v1/accounts/{account_id}/transactions`
  - `GET /api/v1/accounts/{account_id}/counterparties`
  - `GET /api/v1/accounts/{account_id}/timeline`
- Tests: `test_account_service.py` (9 cases), `test_routers/test_accounts.py`

### 3.4 Alert Service
Ref: `spec/backend-services/alert-service.md`, `spec/api.md` §4

- `services/alert_service.py`:
  - On init: extract `prediction == 1` rows → create alert objects with auto-incrementing IDs, initial status "pending"
  - In-memory status dict: `{alert_id: {status, updated_at}}`
  - `get_alerts(filters, sort, pagination)`
  - `get_alert_summary()` → total, by_status counts, today_new
  - `update_alert_status(alert_id, new_status)`
- `routers/alerts.py`:
  - `GET /api/v1/alerts`
  - `GET /api/v1/alerts/summary`
  - `PATCH /api/v1/alerts/{alert_id}/status`
- Tests: `test_alert_service.py` (9 cases), `test_routers/test_alerts.py`

### 3.5 Note Service
Ref: `spec/backend-services/note-service.md`, `spec/api.md` §5

- `services/note_service.py`:
  - In-memory dict: `{transaction_id: list[Note]}`
  - `get_notes(transaction_id)` → list sorted by created_at desc
  - `create_note(transaction_id, content, author)` → validate, create, return
- `routers/notes.py`:
  - `GET /api/v1/transactions/{transaction_id}/notes`
  - `POST /api/v1/transactions/{transaction_id}/notes`
- Tests: `test_note_service.py` (7 cases), `test_routers/test_notes.py`

### 3.6 Analytics Service
Ref: `spec/backend-services/analytics-service.md`, `spec/api.md` §6

- `services/analytics_service.py`:
  - `get_heatmap(start_date, end_date)` → 168 entries (7 days × 24 hours)
  - `get_currency_payment_matrix(start_date, end_date)` → cross-tab fraud rates
  - `get_high_risk_banks(metric, limit, start_date, end_date)` → ranked list
  - `get_feature_importances()` → delegate to DataStore
  - `get_pattern_distribution(start_date, end_date)` → pattern type counts
- `routers/analytics.py`:
  - `GET /api/v1/analytics/heatmap`
  - `GET /api/v1/analytics/currency-payment-matrix`
  - `GET /api/v1/analytics/high-risk-banks`
  - `GET /api/v1/analytics/feature-importances`
  - `GET /api/v1/analytics/pattern-distribution`
- Tests: `test_analytics_service.py` (8 cases), `test_routers/test_analytics.py`

### 3.7 Network Service
Ref: `spec/backend-services/network-service.md`, `spec/api.md` §2

- `services/network_service.py`:
  - `get_network(account_id, hops, start_date, end_date)`:
    - BFS from origin account up to N hops
    - Build nodes (with fraud_score, bank_name, entity_name, total_amount) and edges (with direction, amount, fraud_score)
    - Match patterns from DataStore.patterns
    - Enforce limits: 200 nodes, 1000 edges → truncate with `truncated: true`
- `routers/network.py`:
  - `GET /api/v1/network?account_id=&hops=&start_date=&end_date=`
- Tests: `test_network_service.py` (7 cases), `test_routers/test_network.py`

### 3.8 Test fixtures (`backend/tests/conftest.py`)
Ref: `spec/backend.test.plan.md`

- Build before writing service tests (or in parallel with 3.1)
- 100-row sample DataFrame with known values
- 10 accounts in lookup
- 3 sample patterns (CYCLE, FAN-OUT, BIPARTITE)
- Mock PredictionService returning fixed fraud_scores
- TestClient fixture with DI override

**Checkpoint: All `pytest -v` tests pass. All API endpoints return correct JSON shapes.**

---

## Phase 4: Frontend Foundation

### 4.1 Layout + Routing
Ref: `spec/ui.md` §Common

- `MainLayout.tsx`: sidebar (240px collapsible) + content area
- `Sidebar.tsx`: navigation links with icons (Network, Alerts with badge, Analytics, Settings divider)
- `Loading.tsx`: SVG pulse animation component
- `App.tsx`: React Router v6 routes:
  - `/network` → NetworkPage
  - `/transactions/:transactionId` → TransactionDetailPage
  - `/accounts/:accountId` → AccountProfilePage
  - `/alerts` → AlertsPage
  - `/analytics` → AnalyticsPage
  - `/` → redirect to `/alerts`
- Global styles: Notion-like palette (#FFFFFF, #37352F, #EB5757, #2F80ED, #E9E9E7), Inter + Noto Sans JP fonts
- `loading.svg` in public/

### 4.2 API client layer
Ref: `spec/api.md`

- `api/client.ts`: axios instance with baseURL, error interceptor
- `api/transactions.ts`: `getTransactions()`, `getTransactionDetail()`
- `api/network.ts`: `getNetwork()`
- `api/accounts.ts`: `getAccount()`, `getAccountTransactions()`, `getCounterparties()`, `getTimeline()`
- `api/alerts.ts`: `getAlerts()`, `getAlertSummary()`, `updateAlertStatus()`
- `api/notes.ts`: `getNotes()`, `createNote()`
- `api/analytics.ts`: `getHeatmap()`, `getCurrencyPaymentMatrix()`, `getHighRiskBanks()`, `getFeatureImportances()`, `getPatternDistribution()`
- `api/master.ts`: `getBanks()`, `getCurrencies()`, `getPaymentFormats()`, `searchAccounts()`

### 4.3 Custom hooks
- `useTransactions.ts`, `useNetwork.ts`, `useAccounts.ts`, `useAlerts.ts`, `useAnalytics.ts`
- Each hook wraps API calls with loading/error states

**Checkpoint: Frontend compiles. Sidebar navigates between placeholder pages. API hooks log responses from backend.**

---

## Phase 5: Frontend Pages (one by one)

### 5.1 Alerts Page (`/alerts`)
Ref: `spec/ui.md` §Page 2

Priority: **First page to build** — it's the main landing page and uses the most common UI patterns (table, filters, pagination, badges).

1. `AlertsPage.tsx`: page layout with summary cards + filter bar + table
2. `AlertFilters.tsx`: status chips, bank/currency/payment dropdowns (data from master API), amount range inputs, date picker, score slider, reset button
3. `AlertTable.tsx`: sortable columns (status dot, score bar, timestamp, from/to bank+account, amount, currency, payment format), row click → navigate to `/transactions/:id`
4. `StatusBadge.tsx`: colored dot + dropdown for inline status change (PATCH call)
5. Pagination component at bottom

### 5.2 Transaction Detail Page (`/transactions/:transactionId`)
Ref: `spec/ui.md` §Page 1.1

1. `TransactionDetailPage.tsx`: layout with card + model section + history + notes
2. `TransactionCard.tsx`: two-column from/to display with bank names + entity names, meta info row, red "Fraud Detected" badge when prediction=1
3. `FraudScoreDisplay.tsx`: large percentage number + circular progress
4. `FeatureImportanceChart.tsx`: horizontal bar chart (Recharts) for top 5 features
5. Transaction history section: tabs for sender/receiver history, table with highlight for flagged rows
6. Notes section: text area + save button + history list

### 5.3 Account Profile Page (`/accounts/:accountId`)
Ref: `spec/ui.md` §Page 1.2

1. `AccountProfilePage.tsx`: header + summary cards + timeline + counterparties + transactions
2. `AccountHeader.tsx`: account ID title, bank name, entity info, risk badge
3. `SummaryCards.tsx`: 4-column grid (total txns, sent total, received total, flagged count)
4. `TimelineChart.tsx`: line chart (Recharts) with sent/received series, red markers for flagged days
5. Counterparty table: tabs sent/received, sortable columns, click → navigate to counterparty profile
6. Related transactions table: filters + pagination

### 5.4 Analytics Page (`/analytics`)
Ref: `spec/ui.md` §Page 3

1. `AnalyticsPage.tsx`: date filter at top, 5 sections stacked vertically
2. `Heatmap.tsx`: 7×24 grid, yellow→red gradient, tooltip on hover (can use Recharts or custom SVG)
3. `CurrencyPaymentMatrix.tsx`: HTML table with heatmap-colored cells, click → navigate to alerts with filter
4. `HighRiskBanksChart.tsx`: horizontal bar chart (Recharts), tabs for count/amount, click → alerts
5. `FeatureImportanceChart.tsx`: horizontal bar chart with percentage labels
6. `PatternDistribution.tsx`: donut chart (Recharts PieChart), legend with counts, segment click → expand transactions list

### 5.5 Network Page (`/network`)
Ref: `spec/ui.md` §Page 1

Priority: **Last page to build** — most complex, depends on all other pages being navigable.

1. `NetworkPage.tsx`: header (search bar, hop selector, date filter) + graph area + pattern panel
2. `NetworkGraph.tsx`: force-directed graph using `react-force-graph-2d`
   - Nodes: circles sized by total_amount, colored by fraud_score (red/yellow/grey)
   - Edges: lines with arrows, thickness by amount, red for flagged
   - Hover: tooltip with account/bank/entity info
   - Click node → navigate to `/accounts/:id`
   - Click edge → navigate to `/transactions/:id`
   - Zoom/pan support
3. `PatternPanel.tsx`: right sidebar (280px), card list of detected patterns, card click → highlight on graph
4. Account search: autocomplete input using `/accounts/search` API

**Checkpoint: All 5 pages functional. Full navigation flow works end-to-end.**

---

## Phase 6: Docker & Polish

### 6.1 Dockerfiles
- `backend/Dockerfile`:
  - Python 3.11 slim base
  - Copy requirements.txt → pip install
  - Copy app/ and saved_model/
  - CMD: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- `frontend/Dockerfile`:
  - Node 20 base
  - Copy package.json → npm install
  - Copy src/
  - CMD: `npm run dev -- --host 0.0.0.0`
- `docker-compose.yml`:
  - Mount `data/` as volume for backend
  - Frontend depends_on backend
  - Network between services

### 6.2 Polish
- Loading states: skeleton screens on all pages during data fetch
- Error states: error boundary with retry button
- Empty states: meaningful messages when no data matches filters
- Responsive: sidebar collapse at narrow widths
- SVG loading animation in `public/loading.svg`

### 6.3 Final verification
- `docker compose up --build` from clean state
- All pages load with real data
- Alert status changes persist in session
- Notes can be added and viewed
- Network graph renders and is interactive
- Analytics charts display correct aggregations

---

## Implementation Order Summary

```
Phase 1: Scaffolding
  1.1 Backend dirs + requirements.txt + config
  1.2 Frontend init (Vite + Tailwind + shadcn)
  1.3 docker-compose.yml

Phase 2: Backend Data Layer
  2.1 PredictionService
  2.2 DataStore
  2.3 Pydantic Schemas
  2.4 FastAPI main.py + health check

Phase 3: Backend Services + Routers + Tests
  3.8 Test fixtures (conftest.py) — build first
  3.1 Master Service
  3.2 Transaction Service
  3.3 Account Service
  3.4 Alert Service
  3.5 Note Service
  3.6 Analytics Service
  3.7 Network Service

Phase 4: Frontend Foundation
  4.1 Layout + Routing + Global Styles
  4.2 API client layer (all api/*.ts files)
  4.3 Custom hooks

Phase 5: Frontend Pages
  5.1 Alerts Page (landing page, most common patterns)
  5.2 Transaction Detail Page
  5.3 Account Profile Page
  5.4 Analytics Page
  5.5 Network Page (most complex, built last)

Phase 6: Docker & Polish
  6.1 Dockerfiles
  6.2 Loading/error/empty states
  6.3 Final end-to-end verification
```

## Estimated File Count
- Backend: ~35 files (app + tests)
- Frontend: ~45 files (components + pages + hooks + API)
- Config: ~5 files (Docker, Vite, Tailwind, tsconfig)
- Total: ~85 files
