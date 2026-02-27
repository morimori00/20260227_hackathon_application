# API設計書

## 共通仕様

### ベースURL
```
http://localhost:8000/api/v1
```

### レスポンス形式
全エンドポイントJSON形式で返却する。

成功時:
```json
{
  "data": { ... },
  "meta": { "total": 100, "page": 1, "per_page": 20 }
}
```

エラー時:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### ページネーション
リスト系エンドポイントはクエリパラメータ `page`（デフォルト1）と `per_page`（デフォルト20、最大100）で制御する。

### 日時フォーマット
ISO 8601形式 `YYYY-MM-DDTHH:MM:SS`

### 不正判定について
取引データに不正ラベル（`Is Laundering`）は含まれない。全ての不正判定は起動時にXGBClassifierパイプライン（`saved_model/aml_pipeline.joblib`）によるバッチ推論で付与される。
- `prediction`: モデルの予測ラベル（0=正常, 1=不正）
- `fraud_score`: モデルの不正クラス確率（0.0〜1.0）

---

## エンドポイント一覧

### 1. 取引 (Transactions)

#### GET /transactions
取引一覧を取得する。

クエリパラメータ:
| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| page | int | No | ページ番号（デフォルト: 1） |
| per_page | int | No | 1ページあたり件数（デフォルト: 20） |
| from_bank | string | No | 送金元銀行IDでフィルタ |
| to_bank | string | No | 送金先銀行IDでフィルタ |
| account_id | string | No | 口座ID（送金元または送金先）でフィルタ |
| currency | string | No | 支払通貨でフィルタ |
| payment_format | string | No | 支払手段でフィルタ |
| min_amount | float | No | 最小金額 |
| max_amount | float | No | 最大金額 |
| start_date | string | No | 開始日時（ISO 8601） |
| end_date | string | No | 終了日時（ISO 8601） |
| prediction | int | No | モデル予測ラベル（0=正常, 1=不正） |
| sort_by | string | No | ソートカラム（デフォルト: timestamp） |
| sort_order | string | No | asc / desc（デフォルト: desc） |

レスポンス:
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
取引詳細を取得する。

レスポンス:
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

### 2. ネットワーク (Network)

#### GET /network
指定口座を起点としたネットワークグラフデータを取得する。

クエリパラメータ:
| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| account_id | string | Yes | 起点口座ID |
| hops | int | No | 探索ホップ数（デフォルト: 2、最大: 5） |
| start_date | string | No | 開始日時 |
| end_date | string | No | 終了日時 |

レスポンス:
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

### 3. 口座 (Accounts)

#### GET /accounts/:accountId
口座プロファイルを取得する。

レスポンス:
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
口座の取引履歴を取得する。

クエリパラメータ:
| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| page | int | No | ページ番号 |
| per_page | int | No | 1ページあたり件数 |
| direction | string | No | sent / received / all（デフォルト: all） |
| start_date | string | No | 開始日時 |
| end_date | string | No | 終了日時 |

レスポンスは GET /transactions と同じ形式。

#### GET /accounts/:accountId/counterparties
取引先口座一覧を取得する。

クエリパラメータ:
| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| direction | string | No | sent / received / all（デフォルト: all） |
| sort_by | string | No | transaction_count / total_amount / last_transaction（デフォルト: transaction_count） |
| sort_order | string | No | asc / desc（デフォルト: desc） |

レスポンス:
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
口座の日別取引金額推移を取得する。

クエリパラメータ:
| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| start_date | string | No | 開始日 |
| end_date | string | No | 終了日 |

レスポンス:
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

### 4. アラート (Alerts)

#### GET /alerts
モデルが不正と判定した取引（アラート）の一覧を取得する。

クエリパラメータ:
| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| page | int | No | ページ番号 |
| per_page | int | No | 1ページあたり件数 |
| status | string | No | カンマ区切りで複数指定可（pending / investigating / resolved / false_positive） |
| from_bank | string | No | 送金元銀行ID |
| to_bank | string | No | 送金先銀行ID |
| currency | string | No | 通貨 |
| payment_format | string | No | 支払手段 |
| min_amount | float | No | 最小金額 |
| max_amount | float | No | 最大金額 |
| min_score | float | No | 最小不正スコア（0.0〜1.0） |
| max_score | float | No | 最大不正スコア（0.0〜1.0） |
| start_date | string | No | 開始日時 |
| end_date | string | No | 終了日時 |
| sort_by | string | No | fraud_score / timestamp / amount（デフォルト: fraud_score） |
| sort_order | string | No | asc / desc（デフォルト: desc） |

レスポンス:
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
アラートのサマリー統計を取得する。

レスポンス:
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
アラートのステータスを更新する。

リクエストボディ:
```json
{
  "status": "investigating"
}
```

レスポンス:
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

### 5. メモ (Notes)

#### GET /transactions/:transactionId/notes
取引に対する担当者メモ一覧を取得する。

レスポンス:
```json
{
  "data": [
    {
      "note_id": "note_001",
      "transaction_id": "txn_04742",
      "content": "関連パターンを調査中。FAN-OUTパターンの起点口座。",
      "author": "operator_01",
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

#### POST /transactions/:transactionId/notes
取引にメモを追加する。

リクエストボディ:
```json
{
  "content": "調査完了。正当な取引と判断。",
  "author": "operator_01"
}
```

レスポンス: 作成されたメモオブジェクト（201 Created）。

---

### 6. 分析 (Analytics)

#### GET /analytics/heatmap
曜日×時間帯の不正取引件数ヒートマップデータを取得する。

クエリパラメータ:
| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| start_date | string | No | 開始日 |
| end_date | string | No | 終了日 |

レスポンス:
```json
{
  "data": [
    { "day_of_week": "Monday", "hour": 0, "count": 5 },
    { "day_of_week": "Monday", "hour": 1, "count": 3 }
  ]
}
```

#### GET /analytics/currency-payment-matrix
支払手段×通貨の不正率クロス集計を取得する。

クエリパラメータ:
| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| start_date | string | No | 開始日 |
| end_date | string | No | 終了日 |

レスポンス:
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
高リスク銀行ランキングを取得する。

クエリパラメータ:
| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| metric | string | No | count / amount（デフォルト: count） |
| limit | int | No | 上位N件（デフォルト: 10） |
| start_date | string | No | 開始日 |
| end_date | string | No | 終了日 |

レスポンス:
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
モデルの特徴量重要度を取得する。

レスポンス:
```json
{
  "data": [
    { "feature": "Amount Paid", "importance": 0.35 },
    { "feature": "Payment Format_ACH", "importance": 0.22 }
  ]
}
```

#### GET /analytics/pattern-distribution
不正パターン種別分布を取得する。

クエリパラメータ:
| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| start_date | string | No | 開始日 |
| end_date | string | No | 終了日 |

レスポンス:
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

### 7. マスタデータ (Master)

#### GET /master/banks
銀行一覧を取得する（フィルター用ドロップダウンのデータソース）。

レスポンス:
```json
{
  "data": [
    { "bank_id": "10", "bank_name": "US Bank #10" },
    { "bank_id": "70", "bank_name": "Bank #70" }
  ]
}
```

#### GET /master/currencies
通貨一覧を取得する。

レスポンス:
```json
{
  "data": ["US Dollar", "Bitcoin", "Euro", "Australian Dollar", "Yuan", "Rupee", "Yen", "Mexican Peso", "UK Pound", "Ruble", "Canadian Dollar", "Swiss Franc", "Brazil Real", "Saudi Riyal", "Shekel"]
}
```

#### GET /master/payment-formats
支払手段一覧を取得する。

レスポンス:
```json
{
  "data": ["Reinvestment", "Cheque", "Credit Card", "ACH", "Cash", "Wire", "Bitcoin"]
}
```

#### GET /accounts/search
口座IDのオートコンプリート検索用。

クエリパラメータ:
| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| q | string | Yes | 検索文字列（前方一致） |
| limit | int | No | 最大件数（デフォルト: 10） |

レスポンス:
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
