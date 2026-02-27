# メモサービス設計

## 責務
取引に対する担当者メモの追加・取得を行う。

## 依存
- DataStore（取引IDの存在確認に使用）

## データ構造

```python
@dataclass
class Note:
    note_id: str           # "note_001" 形式（自動採番）
    transaction_id: str    # 対象取引ID
    content: str           # メモ内容（最大500文字）
    author: str            # 担当者名
    created_at: datetime   # 作成日時
```

### ストレージ
- インメモリの辞書で管理: `transaction_id → list[Note]`
- アプリケーション再起動時にリセットされる（本プロトタイプではDB永続化しない）
- 自動採番カウンター: グローバルなインクリメント

## エンドポイント実装

### GET /api/v1/transactions/:transactionId/notes
1. transactionId が DataStore に存在するか確認（存在しなければ 404）
2. メモ辞書から該当取引のメモリストを取得
3. created_at 降順でソート（新しいメモが先頭）
4. リストを返却（メモが無い場合は空配列）

### POST /api/v1/transactions/:transactionId/notes
1. transactionId が DataStore に存在するか確認（存在しなければ 404）
2. リクエストボディのバリデーション:
   - content: 必須、1〜500文字
   - author: 必須、1〜100文字
3. Note オブジェクトを生成（note_id 自動採番、created_at は現在時刻）
4. メモ辞書に追加
5. 作成された Note を返却（201 Created）

## バリデーション
- transactionId が存在しない場合: 404
- content が空または500文字超: 422
- author が空: 422
