# ディレクトリ構造

```
hackathon/
├── docker-compose.yml
├── data/
│   ├── HI-Small_Trans.csv.csv        # 取引データ
│   ├── HI-Small_accounts.csv         # 口座マスタ
│   └── HI-Small_Patterns.txt         # 不正パターン定義
├── spec/                              # 設計書（実装時参照用）
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
│   │   ├── main.py                    # FastAPIアプリケーションエントリーポイント
│   │   ├── config.py                  # 設定（ファイルパス、定数）
│   │   ├── data_store.py              # DataStore: データ読み込み・保持・クエリ
│   │   ├── prediction_service.py      # PredictionService: モデルロード・バッチ推論・特徴量重要度
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
│   │       ├── transaction.py         # Pydanticモデル: Transaction, TransactionDetail
│   │       ├── network.py             # Pydanticモデル: Node, Edge, NetworkResponse
│   │       ├── account.py             # Pydanticモデル: Account, Counterparty, Timeline
│   │       ├── alert.py               # Pydanticモデル: Alert, AlertSummary
│   │       ├── note.py                # Pydanticモデル: Note
│   │       ├── analytics.py           # Pydanticモデル: Heatmap, Matrix, etc.
│   │       └── common.py              # 共通: PaginatedResponse, ErrorResponse
│   ├── saved_model/
│   │   ├── aml_pipeline.joblib        # 学習済みXGBClassifierパイプライン
│   │   ├── feature_columns.joblib     # モデル入力特徴量カラム名リスト
│   │   └── cat_columns.joblib         # カテゴリカラム名リスト
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py                # pytest fixtures（テスト用DataStore等）
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
    │   └── loading.svg                # ローディングSVGアニメーション
    ├── src/
    │   ├── main.tsx                    # エントリーポイント
    │   ├── App.tsx                     # ルーティング設定
    │   ├── api/
    │   │   ├── client.ts              # axiosインスタンス（baseURL設定）
    │   │   ├── transactions.ts        # 取引API呼び出し関数
    │   │   ├── network.ts             # ネットワークAPI呼び出し関数
    │   │   ├── accounts.ts            # 口座API呼び出し関数
    │   │   ├── alerts.ts              # アラートAPI呼び出し関数
    │   │   ├── notes.ts               # メモAPI呼び出し関数
    │   │   ├── analytics.ts           # 分析API呼び出し関数
    │   │   └── master.ts              # マスタAPI呼び出し関数
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Sidebar.tsx        # サイドバーナビゲーション
    │   │   │   ├── MainLayout.tsx     # メインレイアウト（サイドバー+コンテンツ）
    │   │   │   └── Loading.tsx        # SVGローディングコンポーネント
    │   │   ├── ui/                    # shadcn/uiコンポーネント（自動生成）
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
    │   │   │   ├── NetworkGraph.tsx    # 力学モデルグラフ（D3.js or react-force-graph）
    │   │   │   └── PatternPanel.tsx   # パターン検出パネル
    │   │   ├── transactions/
    │   │   │   ├── TransactionCard.tsx # 取引情報カード
    │   │   │   ├── FraudScoreDisplay.tsx # 不正スコア表示
    │   │   │   └── FeatureImportanceChart.tsx # 特徴量重要度棒グラフ
    │   │   ├── accounts/
    │   │   │   ├── AccountHeader.tsx   # 口座情報ヘッダー
    │   │   │   ├── SummaryCards.tsx    # サマリーカード
    │   │   │   └── TimelineChart.tsx   # 取引金額推移グラフ
    │   │   ├── alerts/
    │   │   │   ├── AlertTable.tsx      # アラートテーブル
    │   │   │   ├── AlertFilters.tsx    # フィルターバー
    │   │   │   └── StatusBadge.tsx     # ステータスバッジ
    │   │   └── analytics/
    │   │       ├── Heatmap.tsx         # 曜日×時間帯ヒートマップ
    │   │       ├── CurrencyPaymentMatrix.tsx # クロス集計テーブル
    │   │       ├── HighRiskBanksChart.tsx    # 高リスク銀行棒グラフ
    │   │       ├── FeatureImportanceChart.tsx # 特徴量重要度棒グラフ
    │   │       └── PatternDistribution.tsx    # パターン種別ドーナツチャート
    │   ├── pages/
    │   │   ├── NetworkPage.tsx         # 取引ネットワーク可視化ページ
    │   │   ├── TransactionDetailPage.tsx # 取引詳細ページ
    │   │   ├── AccountProfilePage.tsx  # 口座プロファイルページ
    │   │   ├── AlertsPage.tsx          # アラート一覧ページ
    │   │   └── AnalyticsPage.tsx       # パターン分析ページ
    │   ├── hooks/
    │   │   ├── useTransactions.ts      # 取引データ取得hooks
    │   │   ├── useNetwork.ts           # ネットワークデータ取得hooks
    │   │   ├── useAccounts.ts          # 口座データ取得hooks
    │   │   ├── useAlerts.ts            # アラートデータ取得hooks
    │   │   └── useAnalytics.ts         # 分析データ取得hooks
    │   ├── lib/
    │   │   └── utils.ts               # ユーティリティ関数
    │   └── styles/
    │       └── globals.css            # グローバルCSS（Tailwind directives）
    └── components.json                # shadcn/ui設定
```

## 技術スタック詳細

### バックエンド
- Python 3.11
- FastAPI
- pandas（データ操作）
- XGBoost（モデル推論）
- uvicorn（ASGIサーバー）
- pytest（テスト）

### フロントエンド
- React 18
- TypeScript
- Vite（ビルドツール）
- Tailwind CSS
- shadcn/ui（UIコンポーネント）
- D3.js または react-force-graph（ネットワーク可視化）
- Recharts（チャート: 棒グラフ、折れ線、ドーナツ）
- axios（API通信）
- React Router v6（ルーティング）

### インフラ
- Docker Compose
  - `backend` サービス: Python + FastAPI（ポート8000）
  - `frontend` サービス: Node + Vite dev server（ポート5173）→ 本番はnginx（ポート80）
