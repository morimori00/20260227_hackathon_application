# Directory Structure

```
hackathon/
├── docker-compose.yml
├── data/
│   ├── HI-Small_Trans.csv.csv        # Transaction data
│   ├── HI-Small_accounts.csv         # Account master data
│   └── HI-Small_Patterns.txt         # Fraud pattern definitions
├── spec/                              # Design documents (reference during implementation)
│   ├── overview.md
│   ├── ui.md
│   ├── api.md
│   ├── directry.md
│   ├── backend.test.plan.md
│   └── backend-services/
│       ├── data-loader.md
│       ├── prediction-service.md
│       ├── transaction-service.md
│       ├── network-service.md
│       ├── account-service.md
│       ├── alert-service.md
│       ├── note-service.md
│       ├── analytics-service.md
│       └── master-service.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                    # FastAPI application entry point
│   │   ├── config.py                  # Configuration (file paths, constants)
│   │   ├── data_store.py              # DataStore: data loading, storage, and querying
│   │   ├── prediction_service.py      # PredictionService: model loading, batch inference, feature importance
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── transactions.py        # /api/v1/transactions
│   │   │   ├── network.py             # /api/v1/network
│   │   │   ├── accounts.py            # /api/v1/accounts
│   │   │   ├── alerts.py              # /api/v1/alerts
│   │   │   ├── notes.py               # /api/v1/transactions/:id/notes
│   │   │   ├── analytics.py           # /api/v1/analytics
│   │   │   └── master.py              # /api/v1/master
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── transaction_service.py
│   │   │   ├── network_service.py
│   │   │   ├── account_service.py
│   │   │   ├── alert_service.py
│   │   │   ├── note_service.py
│   │   │   ├── analytics_service.py
│   │   │   ├── prediction_service.py
│   │   │   └── master_service.py
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── transaction.py         # Pydantic models: Transaction, TransactionDetail
│   │       ├── network.py             # Pydantic models: Node, Edge, NetworkResponse
│   │       ├── account.py             # Pydantic models: Account, Counterparty, Timeline
│   │       ├── alert.py               # Pydantic models: Alert, AlertSummary
│   │       ├── note.py                # Pydantic models: Note
│   │       ├── analytics.py           # Pydantic models: Heatmap, Matrix, etc.
│   │       └── common.py              # Common: PaginatedResponse, ErrorResponse
│   ├── saved_model/
│   │   ├── aml_pipeline.joblib        # Trained XGBClassifier pipeline
│   │   ├── feature_columns.joblib     # Model input feature column name list
│   │   └── cat_columns.joblib         # Categorical column name list
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py                # pytest fixtures (test DataStore, etc.)
│       ├── test_prediction_service.py
│       ├── test_transaction_service.py
│       ├── test_network_service.py
│       ├── test_account_service.py
│       ├── test_alert_service.py
│       ├── test_note_service.py
│       ├── test_analytics_service.py
│       ├── test_master_service.py
│       └── test_routers/
│           ├── __init__.py
│           ├── test_transactions.py
│           ├── test_network.py
│           ├── test_accounts.py
│           ├── test_alerts.py
│           ├── test_notes.py
│           ├── test_analytics.py
│           └── test_master.py
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── index.html
    ├── public/
    │   └── loading.svg                # Loading SVG animation
    ├── src/
    │   ├── main.tsx                    # Entry point
    │   ├── App.tsx                     # Routing configuration
    │   ├── api/
    │   │   ├── client.ts              # axios instance (baseURL configuration)
    │   │   ├── transactions.ts        # Transaction API call functions
    │   │   ├── network.ts             # Network API call functions
    │   │   ├── accounts.ts            # Account API call functions
    │   │   ├── alerts.ts              # Alert API call functions
    │   │   ├── notes.ts               # Notes API call functions
    │   │   ├── analytics.ts           # Analytics API call functions
    │   │   └── master.ts              # Master data API call functions
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Sidebar.tsx        # Sidebar navigation
    │   │   │   ├── MainLayout.tsx     # Main layout (sidebar + content)
    │   │   │   └── Loading.tsx        # SVG loading component
    │   │   ├── ui/                    # shadcn/ui components (auto-generated)
    │   │   │   ├── button.tsx
    │   │   │   ├── card.tsx
    │   │   │   ├── table.tsx
    │   │   │   ├── badge.tsx
    │   │   │   ├── select.tsx
    │   │   │   ├── input.tsx
    │   │   │   ├── slider.tsx
    │   │   │   ├── tabs.tsx
    │   │   │   ├── tooltip.tsx
    │   │   │   ├── dropdown-menu.tsx
    │   │   │   ├── pagination.tsx
    │   │   │   └── date-picker.tsx
    │   │   ├── network/
    │   │   │   ├── NetworkGraph.tsx    # Force-directed graph (D3.js or react-force-graph)
    │   │   │   └── PatternPanel.tsx   # Pattern detection panel
    │   │   ├── transactions/
    │   │   │   ├── TransactionCard.tsx # Transaction information card
    │   │   │   ├── FraudScoreDisplay.tsx # Fraud score display
    │   │   │   └── FeatureImportanceChart.tsx # Feature importance bar chart
    │   │   ├── accounts/
    │   │   │   ├── AccountHeader.tsx   # Account information header
    │   │   │   ├── SummaryCards.tsx    # Summary cards
    │   │   │   └── TimelineChart.tsx   # Transaction amount trend graph
    │   │   ├── alerts/
    │   │   │   ├── AlertTable.tsx      # Alert table
    │   │   │   ├── AlertFilters.tsx    # Filter bar
    │   │   │   └── StatusBadge.tsx     # Status badge
    │   │   └── analytics/
    │   │       ├── Heatmap.tsx         # Day-of-week x hour heatmap
    │   │       ├── CurrencyPaymentMatrix.tsx # Cross-tabulation table
    │   │       ├── HighRiskBanksChart.tsx    # High-risk bank bar chart
    │   │       ├── FeatureImportanceChart.tsx # Feature importance bar chart
    │   │       └── PatternDistribution.tsx    # Pattern type donut chart
    │   ├── pages/
    │   │   ├── NetworkPage.tsx         # Transaction network visualization page
    │   │   ├── TransactionDetailPage.tsx # Transaction detail page
    │   │   ├── AccountProfilePage.tsx  # Account profile page
    │   │   ├── AlertsPage.tsx          # Alert list page
    │   │   └── AnalyticsPage.tsx       # Pattern analysis page
    │   ├── hooks/
    │   │   ├── useTransactions.ts      # Transaction data fetch hooks
    │   │   ├── useNetwork.ts           # Network data fetch hooks
    │   │   ├── useAccounts.ts          # Account data fetch hooks
    │   │   ├── useAlerts.ts            # Alert data fetch hooks
    │   │   └── useAnalytics.ts         # Analytics data fetch hooks
    │   ├── lib/
    │   │   └── utils.ts               # Utility functions
    │   └── styles/
    │       └── globals.css            # Global CSS (Tailwind directives)
    └── components.json                # shadcn/ui configuration
```

## Technology Stack Details

### Backend
- Python 3.11
- FastAPI
- pandas (data manipulation)
- XGBoost (model inference)
- uvicorn (ASGI server)
- pytest (testing)

### Frontend
- React 18
- TypeScript
- Vite (build tool)
- Tailwind CSS
- shadcn/ui (UI components)
- D3.js or react-force-graph (network visualization)
- Recharts (charts: bar, line, donut)
- axios (API communication)
- React Router v6 (routing)

### Infrastructure
- Docker Compose
  - `backend` service: Python + FastAPI (port 8000)
  - `frontend` service: Node + Vite dev server (port 5173) → production: nginx (port 80)
