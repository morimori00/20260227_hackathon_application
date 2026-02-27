import logging
from collections import defaultdict

import pandas as pd

from app.data_store import DataStore

logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = [
    "timestamp", "from_bank", "from_account", "to_bank", "to_account",
    "amount_received", "receiving_currency", "amount_paid",
    "payment_currency", "payment_format",
]

CSV_COLUMN_RENAME = {
    "Timestamp": "timestamp",
    "From Bank": "from_bank",
    "Account": "from_account",
    "To Bank": "to_bank",
    "Account.1": "to_account",
    "Amount Received": "amount_received",
    "Receiving Currency": "receiving_currency",
    "Amount Paid": "amount_paid",
    "Payment Currency": "payment_currency",
    "Payment Format": "payment_format",
    "Is Laundering": "is_laundering",
}


class UploadService:
    def __init__(self, data_store: DataStore):
        self.data_store = data_store

    def process_dataframe(self, df: pd.DataFrame) -> dict:
        # Rename columns if they come from original CSV headers
        if "Timestamp" in df.columns or "From Bank" in df.columns:
            df = df.rename(columns=CSV_COLUMN_RENAME)

        if "is_laundering" in df.columns:
            df = df.drop(columns=["is_laundering"])

        missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns: {', '.join(missing)}")

        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df["day_of_week"] = df["timestamp"].dt.day_name()
        df["hour"] = df["timestamp"].dt.hour

        df["from_bank"] = df["from_bank"].astype(str)
        df["to_bank"] = df["to_bank"].astype(str)
        df["from_account"] = df["from_account"].astype(str)
        df["to_account"] = df["to_account"].astype(str)
        df["amount_received"] = df["amount_received"].astype(float)
        df["amount_paid"] = df["amount_paid"].astype(float)

        # Generate sequential IDs continuing from current max
        current_max = len(self.data_store.transactions)
        df["id"] = [f"txn_{current_max + i + 1:08d}" for i in range(len(df))]

        # Run ML predictions
        df = self.data_store.prediction_service.predict_batch(df)

        total_rows = len(df)
        flagged = df[df["prediction"] == 1]
        flagged_count = len(flagged)
        transaction_ids = df["id"].tolist()

        # Append to main DataFrame
        self.data_store.transactions = pd.concat(
            [self.data_store.transactions, df], ignore_index=True
        )

        # Update indexes incrementally
        base_idx = current_max
        from_accounts = df["from_account"].values
        to_accounts = df["to_account"].values
        for i in range(len(df)):
            global_idx = base_idx + i
            fa = from_accounts[i]
            ta = to_accounts[i]
            if fa not in self.data_store.from_account_index:
                self.data_store.from_account_index[fa] = []
            self.data_store.from_account_index[fa].append(global_idx)
            if ta not in self.data_store.to_account_index:
                self.data_store.to_account_index[ta] = []
            self.data_store.to_account_index[ta].append(global_idx)

        # Update flagged subset
        if not flagged.empty:
            self.data_store.flagged_subset = pd.concat(
                [self.data_store.flagged_subset, flagged], ignore_index=True
            )

        logger.info(
            "Uploaded %d rows (%d flagged)", total_rows, flagged_count
        )

        return {
            "total_rows": total_rows,
            "flagged_count": flagged_count,
            "new_alerts_count": flagged_count,
            "transaction_ids": transaction_ids,
        }
