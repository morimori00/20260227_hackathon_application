# 分析サービス設計

## 責務
パターン分析ページ用の集計データを提供する。

## 依存
- DataStore（データローダーサービス）

## エンドポイント実装

### GET /api/v1/analytics/heatmap
曜日×時間帯の不正取引件数を集計する。

1. DataStore.transactions から `prediction == 1` のサブセットを抽出
2. 日付フィルター適用（start_date / end_date）
3. `day_of_week` と `hour` でグループ化し、件数をカウント
4. 全曜日（Monday〜Sunday）× 全時間帯（0〜23）の組み合わせを返却（件数0も含む）
5. 曜日は Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday の順

### GET /api/v1/analytics/currency-payment-matrix
支払手段×通貨のクロス集計を返却する。

1. 日付フィルター適用
2. `payment_format` と `payment_currency` でグループ化
3. 各組み合わせについて:
   - total_count: 全取引件数
   - fraud_count: prediction == 1 の件数
   - fraud_rate: fraud_count / total_count
4. total_count が 0 の組み合わせは除外

### GET /api/v1/analytics/high-risk-banks
不正取引の多い銀行ランキングを返却する。

1. prediction == 1 の取引を抽出
2. 日付フィルター適用
3. `from_bank` でグループ化（送金元として不正取引に関与した銀行）
4. metric パラメータに応じて:
   - `count`: 不正取引件数で降順ソート
   - `amount`: 不正取引の amount_paid 合計で降順ソート
5. bank_lookup で銀行名を付与
6. 上位 limit 件を返却

### GET /api/v1/analytics/feature-importances
DataStore.feature_importances をそのまま返却する。
importance 降順でソート済み。

### GET /api/v1/analytics/pattern-distribution
DataStore.patterns からパターン種別ごとの件数を集計する。

1. 日付フィルター適用（パターン内の取引の日付で判定）
2. pattern_type でグループ化
3. 各パターン種別について:
   - count: パターン数
   - total_amount: 関連取引の amount_paid 合計
4. count 降順でソート

## パフォーマンス考慮事項
- ヒートマップとクロス集計は起動時に事前計算してキャッシュ可能（日付フィルター無しの場合）
- 日付フィルター付きの場合はリクエスト毎に計算
