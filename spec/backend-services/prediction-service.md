# 予測サービス設計

## 責務
保存済みXGBClassifierパイプラインをロードし、取引データに対してマネーロンダリング判定（予測ラベル・確率スコア）を付与する。

## 保存済みモデルファイル

| ファイル | 型 | 内容 |
|---|---|---|
| `saved_model/aml_pipeline.joblib` | sklearn.pipeline.Pipeline | OneHotEncoder + XGBClassifier のパイプライン |
| `saved_model/feature_columns.joblib` | list[str] | モデルが必要とする特徴量カラム名 |
| `saved_model/cat_columns.joblib` | list[str] | OneHotEncoding対象のカテゴリカラム名 |

### パイプライン構造
```
Pipeline(
  Step 1: "Transformer" -> ColumnTransformer(
    "One Hot Encoding" -> Pipeline(OneHotEncoder(drop='first', handle_unknown='ignore'))
    対象カラム: ['From Bank', 'Account', 'To Bank', 'Receiving Currency',
                 'Payment Currency', 'Payment Format', 'Week']
  )
  Step 2: "Estimator" -> XGBClassifier
)
```

### モデルが必要とする入力カラム（feature_columns）
```
['From Bank', 'Account', 'To Bank', 'Account.1',
 'Amount Received', 'Receiving Currency', 'Amount Paid',
 'Payment Currency', 'Payment Format', 'Week']
```

## 起動時処理

### 1. モデルロード
```python
import joblib

pipeline = joblib.load('saved_model/aml_pipeline.joblib')
feature_columns = joblib.load('saved_model/feature_columns.joblib')
cat_columns = joblib.load('saved_model/cat_columns.joblib')
```

### 2. 全取引データに対するバッチ推論

データローダーが取引データを読み込み・前処理した後、以下を実行する:

1. 取引DataFrameから `feature_columns` に該当するカラムを抽出
   - 注意: `Week` カラムは元データに存在しないため、`Timestamp` から曜日名を派生させて追加する必要がある
   - `Account.1` は元CSVの `to_account` に対応する
2. 入力DataFrameのカラム名をモデルの期待する形式に合わせる:
   - `from_bank` → `From Bank`
   - `from_account` → `Account`
   - `to_bank` → `To Bank`
   - `to_account` → `Account.1`
   - `amount_received` → `Amount Received`
   - `receiving_currency` → `Receiving Currency`
   - `amount_paid` → `Amount Paid`
   - `payment_currency` → `Payment Currency`
   - `payment_format` → `Payment Format`
   - `day_of_week` → `Week`
3. `pipeline.predict(input_df)` で予測ラベル（0 or 1）を取得
4. `pipeline.predict_proba(input_df)[:, 1]` で不正確率スコア（0.0〜1.0）を取得
5. 取引DataFrameに以下のカラムを追加:
   - `prediction`: 予測ラベル（0 = Normal, 1 = Laundering）
   - `fraud_score`: 不正確率スコア（float）

### 3. 特徴量重要度の抽出
```python
xgb_model = pipeline.named_steps['Estimator']
importances = xgb_model.feature_importances_

# OneHotEncoder後の特徴量名を取得
ohe = pipeline.named_steps['Transformer'].transformers_[0][1].named_steps['Encoder']
encoded_feature_names = ohe.get_feature_names_out(cat_columns)

# 数値カラムの特徴量名（OHE対象外）
num_columns = [c for c in feature_columns if c not in cat_columns]

all_feature_names = list(encoded_feature_names) + num_columns
feature_importance_list = [
    {"feature": name, "importance": float(imp)}
    for name, imp in sorted(zip(all_feature_names, importances), key=lambda x: -x[1])
]
```

## パフォーマンス考慮事項

### バッチ推論の最適化
- 500万件を一度に predict_proba すると メモリ不足の可能性がある
- チャンク分割で処理する（10万件ずつ）:
```python
chunk_size = 100_000
scores = []
predictions = []
for i in range(0, len(df), chunk_size):
    chunk = df.iloc[i:i+chunk_size]
    input_chunk = chunk[feature_columns]  # カラム名をモデル期待形式に変換済み
    predictions.append(pipeline.predict(input_chunk))
    scores.append(pipeline.predict_proba(input_chunk)[:, 1])
df['prediction'] = np.concatenate(predictions)
df['fraud_score'] = np.concatenate(scores)
```

### handle_unknown='ignore'
- 学習データに存在しなかった銀行ID・口座IDはOneHotEncoderが全て0ベクトルにエンコードする
- 警告が出るがエラーにはならない（パイプラインの設定済み）

## 公開インターフェース

```python
class PredictionService:
    pipeline: Pipeline
    feature_columns: list[str]
    cat_columns: list[str]
    feature_importances: list[dict]  # [{"feature": str, "importance": float}]

    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """DataFrameに prediction と fraud_score カラムを追加して返す"""

    def predict_single(self, row: dict) -> dict:
        """1件の取引に対する予測結果を返す"""
        # return {"prediction": int, "fraud_score": float}

    def get_feature_importances(self) -> list[dict]:
        """全特徴量の重要度リストを返す"""
```
