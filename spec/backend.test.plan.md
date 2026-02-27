# バックエンドテスト計画

## テスト方針

### テストレベル
1. **サービス層ユニットテスト** — 各サービスのビジネスロジックを検証
2. **ルーターE2Eテスト** — FastAPI TestClient でAPIエンドポイントの入出力を検証

### テストデータ
- 本番データ（500万件）はテストに使用しない
- テスト用のフィクスチャとして少量のサンプルデータ（100件程度）を conftest.py で定義
- サンプルデータには prediction=0（正常）と prediction=1（不正）の両方を含める（比率は50:50でテストしやすくする）
- PredictionService はモック化し、テスト用の固定 fraud_score / prediction を返すようにする

### テストフレームワーク
- pytest
- FastAPI TestClient（httpx ベース）
- conftest.py でテスト用 DataStore を fixtures として提供

---

## conftest.py フィクスチャ設計

```python
@pytest.fixture
def sample_transactions() -> pd.DataFrame:
    """100件のサンプル取引データ（50件正常 + 50件不正）"""

@pytest.fixture
def sample_accounts() -> dict:
    """10口座分のサンプル口座マスタ"""

@pytest.fixture
def sample_patterns() -> list:
    """3パターン分のサンプル不正パターン（CYCLE, FAN-OUT, BIPARTITE）"""

@pytest.fixture
def mock_prediction_service() -> PredictionService:
    """モック化したPredictionService（固定スコアを返す）"""

@pytest.fixture
def data_store(sample_transactions, sample_accounts, sample_patterns, mock_prediction_service) -> DataStore:
    """テスト用DataStoreインスタンス（prediction/fraud_score カラム付与済み）"""

@pytest.fixture
def app(data_store) -> FastAPI:
    """テスト用FastAPIアプリケーション（DI でDataStoreを差し替え）"""

@pytest.fixture
def client(app) -> TestClient:
    """テスト用HTTPクライアント"""
```

---

## サービス層テスト

### test_prediction_service.py
| テストケース | 検証内容 |
|---|---|
| test_load_model | aml_pipeline.joblib が正常にロードされる |
| test_load_feature_columns | feature_columns.joblib のカラムリストが期待通り |
| test_load_cat_columns | cat_columns.joblib のカラムリストが期待通り |
| test_predict_batch_adds_columns | predict_batch 後に prediction, fraud_score カラムが追加される |
| test_predict_batch_score_range | fraud_score が 0.0〜1.0 の範囲内 |
| test_predict_batch_labels | prediction が 0 または 1 のみ |
| test_predict_batch_chunked | 大量データでもチャンク分割で処理できる |
| test_predict_single | 1件の取引に対して予測結果が返る |
| test_get_feature_importances | 特徴量重要度リストが空でなく importance 降順 |
| test_column_name_mapping | スネークケース→モデル期待形式の変換が正しい |
| test_handle_unknown_categories | 未知のカテゴリ値でもエラーにならない |

### test_transaction_service.py
| テストケース | 検証内容 |
|---|---|
| test_get_transactions_default | デフォルトパラメータで取引一覧が返却される |
| test_get_transactions_filter_by_bank | from_bank フィルタが正しく動作する |
| test_get_transactions_filter_by_date_range | 日付範囲フィルタが正しく動作する |
| test_get_transactions_filter_by_amount | 金額範囲フィルタが正しく動作する |
| test_get_transactions_pagination | page と per_page が正しく機能する |
| test_get_transactions_sort | ソートカラム・順序が正しく動作する |
| test_get_transaction_detail | 取引IDで詳細が取得できる |
| test_get_transaction_detail_not_found | 存在しないIDで404が返る |
| test_get_transaction_detail_has_feature_importances | 特徴量重要度が含まれる |

### test_network_service.py
| テストケース | 検証内容 |
|---|---|
| test_get_network_single_hop | 1ホップでノードとエッジが返却される |
| test_get_network_multi_hop | 複数ホップで到達可能なノードが含まれる |
| test_get_network_with_date_filter | 日付フィルタが適用される |
| test_get_network_node_has_fraud_score | ノードに fraud_score が含まれる |
| test_get_network_origin_node_marked | 起点ノードに is_origin: true が設定される |
| test_get_network_patterns_included | 関連パターンが含まれる |
| test_get_network_node_limit | ノード数上限（200）を超えた場合に truncated: true が返る |

### test_account_service.py
| テストケース | 検証内容 |
|---|---|
| test_get_account_profile | 口座情報とサマリーが返却される |
| test_get_account_not_found | 存在しない口座IDで404 |
| test_get_account_transactions_all | 全取引が返却される |
| test_get_account_transactions_sent | 送金のみフィルタされる |
| test_get_account_transactions_received | 受取のみフィルタされる |
| test_get_account_counterparties | 取引先一覧が正しく集計される |
| test_get_account_counterparties_sort | ソートが正しく動作する |
| test_get_account_timeline | 日別集計が正しい |
| test_get_account_timeline_has_flagged | 不正取引日に has_flagged: true |

### test_alert_service.py
| テストケース | 検証内容 |
|---|---|
| test_get_alerts_default | 全アラートが fraud_score 降順で返却される |
| test_get_alerts_filter_by_status | ステータスフィルタが動作する |
| test_get_alerts_filter_by_score_range | スコア範囲フィルタが動作する |
| test_get_alerts_filter_by_bank | 銀行フィルタが動作する |
| test_get_alerts_pagination | ページネーションが動作する |
| test_get_alerts_summary | サマリー件数が正しい |
| test_update_alert_status | ステータス更新が反映される |
| test_update_alert_status_not_found | 存在しないIDで404 |
| test_update_alert_status_invalid | 不正なステータス値で422 |

### test_note_service.py
| テストケース | 検証内容 |
|---|---|
| test_create_note | メモが正常に作成される |
| test_create_note_transaction_not_found | 存在しない取引IDで404 |
| test_create_note_empty_content | 空のcontentで422 |
| test_create_note_content_too_long | 500文字超で422 |
| test_get_notes_empty | メモが無い場合に空配列 |
| test_get_notes_ordered | 新しいメモが先頭に来る |
| test_get_notes_multiple | 複数メモが正しく返却される |

### test_analytics_service.py
| テストケース | 検証内容 |
|---|---|
| test_heatmap_all_slots | 全曜日×時間帯のエントリが返却される（7×24=168件） |
| test_heatmap_with_date_filter | 日付フィルタで件数が変わる |
| test_currency_payment_matrix | 全組み合わせの不正率が0〜1の範囲 |
| test_high_risk_banks_by_count | 件数ベースで降順ソートされる |
| test_high_risk_banks_by_amount | 金額ベースで降順ソートされる |
| test_high_risk_banks_limit | limit パラメータが機能する |
| test_feature_importances | 特徴量リストが空でない |
| test_pattern_distribution | パターン種別ごとの件数が返却される |

### test_master_service.py
| テストケース | 検証内容 |
|---|---|
| test_get_banks | 銀行一覧が返却される |
| test_get_currencies | 通貨一覧が返却される |
| test_get_payment_formats | 支払手段一覧が返却される |
| test_search_accounts | 前方一致で口座が検索される |
| test_search_accounts_no_match | 一致なしで空配列 |
| test_search_accounts_limit | limit パラメータが機能する |

---

## ルーターE2Eテスト

各ルーターについて以下の共通パターンをテストする:

| 観点 | テスト内容 |
|---|---|
| 正常系 | 200レスポンスとレスポンス構造の検証 |
| ページネーション | meta.total, meta.page, meta.per_page の検証 |
| 404 | 存在しないリソースへのアクセス |
| 422 | 不正なパラメータ型の検証 |
| フィルター | クエリパラメータが正しく適用される |

### ルーターテストファイル一覧
- `test_routers/test_transactions.py`
- `test_routers/test_network.py`
- `test_routers/test_accounts.py`
- `test_routers/test_alerts.py`
- `test_routers/test_notes.py`
- `test_routers/test_analytics.py`
- `test_routers/test_master.py`

---

## テスト実行

```bash
# 全テスト実行
cd backend && pytest -v

# サービス層のみ
pytest tests/test_*_service.py -v

# ルーターのみ
pytest tests/test_routers/ -v

# カバレッジ付き
pytest --cov=app --cov-report=term-missing -v
```
