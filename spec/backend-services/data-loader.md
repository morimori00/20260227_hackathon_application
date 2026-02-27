# データローダーサービス設計

## 責務
アプリケーション起動時にCSV/TXTファイルを読み込み、前処理を行い、PredictionServiceでモデル推論を実施した上で、他サービスがクエリ可能な状態にする。

## データソース
- `data/HI-Small_Trans.csv.csv` — 取引データ（約500万件、不正ラベルなし）
- `data/HI-Small_accounts.csv` — 口座マスタ（約51万件）
- `data/HI-Small_Patterns.txt` — 不正パターン定義（370パターン）

**重要**: 実際の取引データには `Is Laundering` カラムが存在しない。不正判定は PredictionService のモデル推論によって付与される。

## 起動時処理フロー

### 1. 取引データの読み込みと前処理
1. CSVを pandas DataFrame として読み込む
2. 重複行を削除
3. カラム名をスネークケースに正規化:
   - `Timestamp` → `timestamp`
   - `From Bank` → `from_bank`
   - `Account` → `from_account`
   - `To Bank` → `to_bank`
   - `Account.1` → `to_account`
   - `Amount Received` → `amount_received`
   - `Receiving Currency` → `receiving_currency`
   - `Amount Paid` → `amount_paid`
   - `Payment Currency` → `payment_currency`
   - `Payment Format` → `payment_format`
4. `timestamp` を datetime 型に変換
5. 派生カラムを追加:
   - `day_of_week`: 曜日名（Monday〜Sunday）
   - `hour`: 時間（0〜23）
6. 連番の取引ID `id` を付与（`txn_00000001` 形式）
7. 全カラムの型を文字列IDは str、金額は float に統一

### 2. 口座マスタの読み込み
1. CSVを読み込み
2. カラム名を正規化:
   - `Bank Name` → `bank_name`
   - `Bank ID` → `bank_id`
   - `Account Number` → `account_id`
   - `Entity ID` → `entity_id`
   - `Entity Name` → `entity_name`
3. `bank_id` を文字列型に統一
4. 銀行IDから銀行名への辞書（bank_lookup）を構築
5. 口座IDから口座情報への辞書（account_lookup）を構築

### 3. パターンデータの読み込み
1. テキストファイルを行単位で解析
2. `BEGIN LAUNDERING ATTEMPT` 〜 `END LAUNDERING ATTEMPT` のブロックを抽出
3. 各ブロックから以下を構造化:
   - `pattern_type`: パターン種別（FAN-OUT, FAN-IN, CYCLE, RANDOM, BIPARTITE, STACK, SCATTER-GATHER, GATHER-SCATTER）
   - `detail`: 詳細情報（例: "Max 16-degree Fan-Out"）
   - `transactions`: ブロック内のCSV行を取引データとしてパース（取引IDとの紐付け用に timestamp + from_account + to_account をキーとする）
4. パターンリストを構築

### 4. モデル推論による不正スコア付与（PredictionService に委譲）
1. PredictionService を初期化（モデルファイルをロード）
2. 取引DataFrameを PredictionService.predict_batch() に渡す
3. 返却されたDataFrameには以下のカラムが追加されている:
   - `prediction`: 予測ラベル（0 = Normal, 1 = Laundering）
   - `fraud_score`: 不正確率スコア（0.0〜1.0）
4. PredictionService.get_feature_importances() でモデルの特徴量重要度を取得・保存

## 公開インターフェース

```python
class DataStore:
    """全データを保持し、他サービスにクエリインターフェースを提供する"""

    # 取引データ（pandas DataFrame）
    # prediction, fraud_score カラムを含む
    transactions: pd.DataFrame

    # 口座マスタ
    account_lookup: dict[str, AccountInfo]
    bank_lookup: dict[str, str]  # bank_id → bank_name

    # パターンデータ
    patterns: list[PatternInfo]

    # モデル情報（PredictionServiceから取得）
    feature_importances: list[dict]  # [{"feature": str, "importance": float}]

    # PredictionService インスタンス（個別推論用に保持）
    prediction_service: PredictionService
```

## パフォーマンス考慮事項
- 500万件のDataFrameを全てメモリに保持する（推定メモリ使用量: 約500MB〜1GB）
- 起動時に1回だけ読み込み、以降は読み取り専用
- モデル推論は起動時にチャンク分割で実行（10万件ずつ、prediction-service.md 参照）
- 頻出クエリ用にインデックスを構築:
  - `from_account` でグループ化した辞書
  - `to_account` でグループ化した辞書
  - `prediction == 1` のサブセットを事前抽出
