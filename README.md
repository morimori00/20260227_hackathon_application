# AML Fraud Detection Dashboard

A real-time anti-money laundering (AML) dashboard that leverages a pre-trained XGBoost model to detect suspicious transactions. Built for compliance officers and AML investigators to efficiently identify, investigate, and manage potentially fraudulent transactions.

**Demo:** http://95.133.253.112:5173
*(Temporary link — will be taken down after the hackathon)*



## Features

### Transaction Network Visualization (`/network`)
- Interactive force-directed graph showing fund flows between accounts
- Node size proportional to transaction volume, color-coded by fraud risk score
- Automatic detection of suspicious patterns (FAN-OUT, CYCLE, BIPARTITE, etc.)
- Drill-down into account profiles and individual transactions

### Alert Management (`/alerts`)
- Real-time list of model-flagged transactions sorted by fraud probability
- Status workflow: Pending → Investigating → Resolved / False Positive
- Advanced filtering by bank, amount range, currency, payment format, date, and fraud score
- Summary dashboard with alert counts by status

### Transaction Detail (`/transactions/:id`)
- Full transaction metadata with sender/receiver information
- Model prediction score with circular progress visualization
- Top contributing features displayed as a horizontal bar chart
- Transaction history for related accounts
- Investigator notes with audit trail

### Account Profile (`/accounts/:id`)
- Account summary: total transactions, sent/received amounts, flagged count
- Time-series chart of transaction amounts with fraud markers
- Counterparty list with risk indicators
- Filterable related transactions table

### Pattern Analytics (`/analytics`)
- Day-of-week × hour-of-day fraud heatmap
- Payment format × currency cross-tabulation of fraud rates
- High-risk bank ranking (by count or amount)
- Model feature importance visualization
- Fraud pattern type distribution (donut chart)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Charts | Recharts, react-force-graph-2d, D3.js |
| Backend | Python 3.11, FastAPI, Uvicorn |
| ML Model | XGBoost (XGBClassifier pipeline) |
| Data | pandas, NumPy, scikit-learn, joblib |
| Testing | pytest, FastAPI TestClient (httpx) |
| Infra | Docker Compose |

## Data

Uses the IBM synthetic AML transaction dataset:

- **HI-Small_Trans.csv** — ~5 million transactions
- **HI-Small_accounts.csv** — Account master data (bank, entity info)
- **HI-Small_Patterns.txt** — Known fraud pattern definitions (FAN-OUT, FAN-IN, CYCLE, RANDOM, BIPARTITE, STACK, SCATTER-GATHER, GATHER-SCATTER)

All fraud labels are generated at startup via batch inference with the pre-trained XGBClassifier pipeline (`saved_model/aml_pipeline.joblib`).

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Run

```bash
docker compose up --build
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api/v1
- **Health Check:** http://localhost:8000/api/v1/health

## API Overview

Base URL: `http://localhost:8000/api/v1`

| Endpoint | Method | Description |
|---|---|---|
| `/transactions` | GET | List transactions with filters and pagination |
| `/transactions/:id` | GET | Transaction detail with model prediction |
| `/network` | GET | Network graph data from a given account |
| `/accounts/:id` | GET | Account profile and summary |
| `/accounts/:id/transactions` | GET | Account transaction history |
| `/accounts/:id/counterparties` | GET | Account counterparty list |
| `/accounts/:id/timeline` | GET | Daily transaction amount timeline |
| `/alerts` | GET | Flagged transaction alerts |
| `/alerts/summary` | GET | Alert count summary by status |
| `/alerts/:id/status` | PATCH | Update alert status |
| `/transactions/:id/notes` | GET | Investigator notes for a transaction |
| `/transactions/:id/notes` | POST | Add a note to a transaction |
| `/analytics/heatmap` | GET | Day × hour fraud heatmap |
| `/analytics/currency-payment-matrix` | GET | Payment format × currency fraud rates |
| `/analytics/high-risk-banks` | GET | Top banks by fraud activity |
| `/analytics/feature-importances` | GET | Model feature importance scores |
| `/analytics/pattern-distribution` | GET | Fraud pattern type distribution |
| `/master/banks` | GET | Bank list |
| `/master/currencies` | GET | Currency list |
| `/master/payment-formats` | GET | Payment format list |
| `/accounts/search` | GET | Account ID autocomplete search |

## Project Structure

```
hackathon/
├── docker-compose.yml
├── data/                        # Transaction data & model inputs
├── spec/                        # Design documents
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # File paths and constants
│   │   ├── data_store.py        # Data loading, indexing, and queries
│   │   ├── prediction_service.py # Model loading and batch inference
│   │   ├── routers/             # API route handlers
│   │   ├── services/            # Business logic layer
│   │   └── schemas/             # Pydantic request/response models
│   ├── saved_model/             # Pre-trained XGBoost pipeline
│   └── tests/                   # pytest unit and E2E tests
└── frontend/
    ├── Dockerfile
    ├── src/
    │   ├── api/                 # Axios API client functions
    │   ├── components/          # React components (shadcn/ui + custom)
    │   ├── pages/               # Page-level components
    │   └── hooks/               # Custom React hooks
    └── public/
        └── loading.svg          # SVG loading animation
```

## Testing

```bash
cd backend

# Run all tests
pytest -v

# Service layer only
pytest tests/test_*_service.py -v

# Router E2E tests only
pytest tests/test_routers/ -v

# With coverage
pytest --cov=app --cov-report=term-missing -v
```

## Design

- Notion-style minimal and clean UI
- Color palette: white background, dark text (#37352F), red accent (#EB5757) for fraud detection, blue (#2F80ED) for secondary actions
- SVG pulse animation for loading states
- Skeleton screens during data fetching
- Minimum viewport width: 1280px (desktop workstation)
