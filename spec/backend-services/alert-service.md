# アラートサービス設計

## 責務
モデルが不正と判定した取引のアラート管理（一覧取得、ステータス変更）。

## 依存
- DataStore（データローダーサービス）

## データ構造

### アラートデータの初期化
アプリケーション起動時に DataStore.transactions から `prediction == 1`（モデルが不正と判定した取引）を抽出し、アラートリストを生成する。

各アラートは以下の構造を持つ:
```python
@dataclass
class Alert:
    alert_id: str          # "alert_00001" 形式
    transaction_id: str    # 対応する取引ID
    status: str            # "pending" | "investigating" | "resolved" | "false_positive"
    fraud_score: float     # モデルの予測確率
    created_at: datetime   # アラート生成日時（= 取引日時）
    updated_at: datetime   # ステータス最終更新日時
```

初期状態では全アラートの status は `pending` とする。

### ステータス管理
- ステータスはインメモリの辞書で管理する（alert_id → status, updated_at）
- アプリケーション再起動時にリセットされる（本プロトタイプではDB永続化しない）

## エンドポイント実装

### GET /api/v1/alerts
1. アラートリストを取得
2. フィルタリング:
   - status: カンマ区切りを分割し、いずれかに一致するアラートを抽出
   - from_bank, to_bank, currency, payment_format: 対応する取引データのカラムでフィルタ
   - min_amount / max_amount: amount_paid でフィルタ
   - min_score / max_score: fraud_score でフィルタ
   - start_date / end_date: timestamp でフィルタ
3. sort_by / sort_order でソート
4. ページネーション適用
5. bank_lookup で銀行名を付与

### GET /api/v1/alerts/summary
1. アラートの総件数を取得
2. ステータス別の件数を集計
3. today_new: 本日日付の取引に紐づくアラート件数（デモデータなので全期間中の最新日をtodayとみなす）

### PATCH /api/v1/alerts/:alertId/status
1. alertId でアラートを検索（存在しなければ 404）
2. リクエストボディの status を検証（許可値: pending, investigating, resolved, false_positive）
3. ステータスと updated_at を更新
4. 更新後のアラートを返却

## バリデーション
- alertId が存在しない場合: 404
- status に不正な値が指定された場合: 422
