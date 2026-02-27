# 取引サービス設計

## 責務
取引データの検索・取得・詳細表示を行う。

## 依存
- DataStore（データローダーサービス）

## エンドポイント実装

### GET /api/v1/transactions
DataStore.transactions に対して以下を行う:
1. クエリパラメータに応じたフィルタリング（pandas の条件式で絞り込み）
2. ソートカラム・ソート順の適用
3. ページネーション（offset / limit の計算）
4. bank_lookup を使って銀行名を付与
5. レスポンス形式に整形して返却

フィルタリングロジック:
- `from_bank`: `df[df['from_bank'] == value]`
- `to_bank`: `df[df['to_bank'] == value]`
- `account_id`: `df[(df['from_account'] == value) | (df['to_account'] == value)]`
- `currency`: `df[df['payment_currency'] == value]`
- `payment_format`: `df[df['payment_format'] == value]`
- `min_amount` / `max_amount`: `df[(df['amount_paid'] >= min) & (df['amount_paid'] <= max)]`
- `start_date` / `end_date`: `df[(df['timestamp'] >= start) & (df['timestamp'] <= end)]`
- `prediction`: `df[df['prediction'] == value]`

### GET /api/v1/transactions/:transactionId
1. DataStore.transactions から ID で1件取得
2. account_lookup を使って送金元・送金先のエンティティ情報を付与
3. モデルの個別取引に対する特徴量重要度を算出:
   - XGBClassifier の SHAP 値、またはグローバル feature_importances を返却
   - 上位5件の特徴量名と重要度を返却

## バリデーション
- transactionId が存在しない場合: 404
- 不正なクエリパラメータ型: 422
