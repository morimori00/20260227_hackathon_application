# Fraud Detection Dashboard Using a Trained Model

## Background

Leveraging an XGBClassifier model trained on IBM synthetic transaction data (HI-Small_Trans.csv, approximately 5 million records), build a dashboard that enables bank staff to efficiently detect and investigate transactions suspected of money laundering.

---

## Concept: Real-Time Alert Monitoring Dashboard

### Purpose
Detect transactions suspected of fraud in real time, allow deep-dive investigation into suspicious transactions, analyze related transaction patterns and networks, and support high-accuracy decision-making.

### Target Users
- Compliance department operators (daily monitoring tasks)
- AML (Anti-Money Laundering) team shift staff
- AML investigators (detailed investigation of individual cases)
- Internal audit team analysts

### Pages and Features

#### 1. Transaction Network Visualization Page
- Display fund flows between accounts as a node-edge graph
- Highlight paths with high fraud scores in red
- Explore related transactions within N hops from a specified account
- Auto-detect and display anomalous patterns on the network (circular transfers, fan-shaped transfers)

#### 1.1 Transaction Detail Page
- Display all column information for the selected transaction
- List of past transaction history for the same account
- Display model prediction probability and feature importance contributing to the decision
- Staff note recording field

#### 1.2 Account Profile Page
- Transaction summary for the specified account (total transactions, average amount, major counterparties)
- Time-series transaction amount trend graph
- Highlight display of fraud-flagged transactions related to the account
- List of sender/receiver accounts with their fraud scores


#### 2. Alert List Page
- Real-time list display of transactions flagged as "fraudulent" by the model
- Sorting by fraud probability score (prediction probability)
- Status management (Pending / Investigating / Resolved / False Positive)
- Filtering by sender bank, receiver bank, amount, currency, and payment method


#### 3. Pattern Analysis Page
- Heatmap of fraud transaction distribution by day of week and time of day
- Fraud rate table via cross-tabulation of payment method x currency
- High-risk bank ranking (based on fraud transaction count and amount)
- Model feature importance ranking display



## Technology Stack

docker compose

frontend: react+vite+shadcn
backend: python+fastapi

## /spec

- ui.md: User interface design — describes required elements per page in detail (not markdown UI mockups)
- directry.md: Directory structure
- backend-service/: Design per backend service
- backend.test.plan.md: Backend test plan
- api.md: API specification

Always refer to /spec when implementing.

# Design
Notion-style minimal and refined design
Display SVG animation for loading states
