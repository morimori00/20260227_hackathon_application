# マスタデータサービス設計

## 責務
フロントエンドのフィルター用ドロップダウンに使用する銀行・通貨・支払手段の一覧と、口座検索のオートコンプリートを提供する。

## 依存
- DataStore（データローダーサービス）

## エンドポイント実装

### GET /api/v1/master/banks
1. DataStore.bank_lookup から全銀行を取得
2. bank_name の昇順でソート
3. `[{ "bank_id": str, "bank_name": str }]` の配列を返却

### GET /api/v1/master/currencies
1. DataStore.transactions の `payment_currency` カラムのユニーク値を取得
2. アルファベット順でソート
3. 文字列の配列を返却

### GET /api/v1/master/payment-formats
1. DataStore.transactions の `payment_format` カラムのユニーク値を取得
2. アルファベット順でソート
3. 文字列の配列を返却

### GET /api/v1/accounts/search
1. クエリ文字列 `q` を受け取る（最低1文字）
2. DataStore.account_lookup のキー（口座ID）に対して前方一致検索
3. 一致した口座について bank_id, bank_name を付与
4. 最大 `limit` 件を返却（デフォルト10件）
5. 結果が無い場合は空配列を返却

## パフォーマンス考慮事項
- banks, currencies, payment_formats は起動時に1回だけ計算してキャッシュする（リクエスト毎に再計算しない）
- accounts/search の前方一致検索は口座IDのソート済みリストに対して二分探索で高速化する
