# 口座サービス設計

## 責務
口座プロファイル情報の取得、口座に関連する取引履歴・取引先・タイムラインの提供。

## 依存
- DataStore（データローダーサービス）

## エンドポイント実装

### GET /api/v1/accounts/:accountId
1. account_lookup から口座情報を取得（bank_name, entity_id, entity_name）
2. transactions から当該口座が関わる取引を抽出（from_account or to_account）
3. サマリーを集計:
   - total_transactions: 送金+受取の件数
   - total_sent: from_account が一致する取引の amount_paid 合計
   - total_received: to_account が一致する取引の amount_received 合計
   - flagged_transactions: prediction == 1 の件数
4. 口座IDが account_lookup に存在しない場合: 404

### GET /api/v1/accounts/:accountId/transactions
1. transactions から当該口座の取引を抽出
2. direction パラメータに応じてフィルタ:
   - `sent`: from_account == accountId
   - `received`: to_account == accountId
   - `all`: いずれか一致
3. 日付フィルター適用
4. timestamp 降順でソート
5. ページネーション適用
6. bank_lookup で銀行名を付与

### GET /api/v1/accounts/:accountId/counterparties
1. 当該口座の取引を direction に応じて抽出
2. 相手口座ごとにグループ化して集計:
   - transaction_count: 取引回数
   - total_amount: 合計金額
   - last_transaction_date: 直近取引日時
   - has_flagged_transactions: 不正フラグ付き取引の有無
3. bank_lookup で相手銀行名を付与
4. sort_by / sort_order に応じてソート
5. ページネーション適用

### GET /api/v1/accounts/:accountId/timeline
1. 当該口座の取引を抽出
2. 日付ごとにグループ化
3. 各日について:
   - sent_amount: 送金合計
   - received_amount: 受取合計
   - sent_count: 送金件数
   - received_count: 受取件数
   - has_flagged: 不正フラグ付き取引の有無
4. 日付昇順でソート

## バリデーション
- accountId が存在しない場合: 404
- 不正なクエリパラメータ: 422
