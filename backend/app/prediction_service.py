import logging
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

from app.config import PIPELINE_PATH, FEATURE_COLUMNS_PATH, CAT_COLUMNS_PATH, BATCH_SIZE

logger = logging.getLogger(__name__)

COLUMN_MAPPING = {
    "from_bank": "From Bank",
    "from_account": "Account",
    "to_bank": "To Bank",
    "to_account": "Account.1",
    "amount_received": "Amount Received",
    "receiving_currency": "Receiving Currency",
    "amount_paid": "Amount Paid",
    "payment_currency": "Payment Currency",
    "payment_format": "Payment Format",
    "day_of_week": "Week",
}


class PredictionService:
    def __init__(self, model_dir: Path | None = None):
        pipeline_path = PIPELINE_PATH
        feature_path = FEATURE_COLUMNS_PATH
        cat_path = CAT_COLUMNS_PATH
        if model_dir:
            pipeline_path = model_dir / "aml_pipeline.joblib"
            feature_path = model_dir / "feature_columns.joblib"
            cat_path = model_dir / "cat_columns.joblib"

        logger.info("Loading model pipeline from %s", pipeline_path)
        self.pipeline = joblib.load(pipeline_path)
        self.feature_columns: list[str] = joblib.load(feature_path)
        self.cat_columns: list[str] = joblib.load(cat_path)
        self.feature_importances = self._extract_feature_importances()
        logger.info("Model loaded. Features: %d, Cat columns: %d",
                     len(self.feature_columns), len(self.cat_columns))

    def _extract_feature_importances(self) -> list[dict]:
        xgb_model = self.pipeline.named_steps["Estimator"]
        importances = xgb_model.feature_importances_

        ohe = self.pipeline.named_steps["Transformer"].transformers_[0][1].named_steps["Encoder"]
        encoded_feature_names = ohe.get_feature_names_out(self.cat_columns)

        num_columns = [c for c in self.feature_columns if c not in self.cat_columns]
        all_feature_names = list(encoded_feature_names) + num_columns

        return [
            {"feature": name, "importance": float(imp)}
            for name, imp in sorted(
                zip(all_feature_names, importances), key=lambda x: -x[1]
            )
        ]

    def _prepare_input(self, df: pd.DataFrame) -> pd.DataFrame:
        rename_map = {
            snake: model
            for snake, model in COLUMN_MAPPING.items()
            if snake in df.columns
        }
        input_df = df.rename(columns=rename_map)
        return input_df[self.feature_columns]

    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("Starting batch prediction on %d rows", len(df))
        all_predictions = []
        all_scores = []

        for i in range(0, len(df), BATCH_SIZE):
            chunk = df.iloc[i : i + BATCH_SIZE]
            input_chunk = self._prepare_input(chunk)
            all_predictions.append(self.pipeline.predict(input_chunk))
            all_scores.append(self.pipeline.predict_proba(input_chunk)[:, 1])
            if (i // BATCH_SIZE) % 10 == 0:
                logger.info("Processed %d / %d rows", min(i + BATCH_SIZE, len(df)), len(df))

        df = df.copy()
        df["prediction"] = np.concatenate(all_predictions).astype(int)
        df["fraud_score"] = np.concatenate(all_scores).astype(float)
        logger.info("Batch prediction complete. Flagged: %d", df["prediction"].sum())
        return df

    def predict_single(self, row: dict) -> dict:
        df = pd.DataFrame([row])
        input_df = self._prepare_input(df)
        prediction = int(self.pipeline.predict(input_df)[0])
        fraud_score = float(self.pipeline.predict_proba(input_df)[:, 1][0])
        return {"prediction": prediction, "fraud_score": fraud_score}

    def get_feature_importances(self) -> list[dict]:
        return self.feature_importances
