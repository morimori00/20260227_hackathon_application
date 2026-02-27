import pandas as pd
from typing import Optional

from app.data_store import DataStore


class TransactionService:
    def __init__(self, data_store: DataStore):
        self.data_store = data_store

    def get_transactions(
        self,
        page: int = 1,
        per_page: int = 20,
        from_bank: Optional[str] = None,
        to_bank: Optional[str] = None,
        account_id: Optional[str] = None,
        currency: Optional[str] = None,
        payment_format: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        prediction: Optional[int] = None,
        sort_by: str = "timestamp",
        sort_order: str = "desc",
    ) -> tuple[list[dict], int]:
        df = self.data_store.transactions

        if from_bank:
            df = df[df["from_bank"] == from_bank]
        if to_bank:
            df = df[df["to_bank"] == to_bank]
        if account_id:
            df = df[(df["from_account"] == account_id) | (df["to_account"] == account_id)]
        if currency:
            df = df[df["payment_currency"] == currency]
        if payment_format:
            df = df[df["payment_format"] == payment_format]
        if min_amount is not None:
            df = df[df["amount_paid"] >= min_amount]
        if max_amount is not None:
            df = df[df["amount_paid"] <= max_amount]
        if start_date:
            df = df[df["timestamp"] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df["timestamp"] <= pd.to_datetime(end_date)]
        if prediction is not None:
            df = df[df["prediction"] == prediction]

        total = len(df)

        ascending = sort_order == "asc"
        if sort_by in df.columns:
            df = df.sort_values(sort_by, ascending=ascending)

        offset = (page - 1) * per_page
        page_df = df.iloc[offset : offset + per_page]

        records = self._format_transactions(page_df)
        return records, total

    def get_transaction_detail(self, transaction_id: str) -> Optional[dict]:
        df = self.data_store.transactions
        match = df[df["id"] == transaction_id]
        if match.empty:
            return None

        row = match.iloc[0]
        record = self._format_single_transaction(row)

        from_info = self.data_store.account_lookup.get(str(row["from_account"]))
        to_info = self.data_store.account_lookup.get(str(row["to_account"]))
        record["from_entity_name"] = from_info.entity_name if from_info else None
        record["to_entity_name"] = to_info.entity_name if to_info else None

        top_features = self.data_store.feature_importances[:5]
        record["feature_importances"] = top_features

        return record

    def _format_transactions(self, df: pd.DataFrame) -> list[dict]:
        records = []
        for _, row in df.iterrows():
            records.append(self._format_single_transaction(row))
        return records

    def _format_single_transaction(self, row) -> dict:
        bank_lookup = self.data_store.bank_lookup
        return {
            "id": row["id"],
            "timestamp": row["timestamp"].isoformat() if hasattr(row["timestamp"], "isoformat") else str(row["timestamp"]),
            "from_bank_id": str(row["from_bank"]),
            "from_bank_name": bank_lookup.get(str(row["from_bank"]), str(row["from_bank"])),
            "from_account": str(row["from_account"]),
            "to_bank_id": str(row["to_bank"]),
            "to_bank_name": bank_lookup.get(str(row["to_bank"]), str(row["to_bank"])),
            "to_account": str(row["to_account"]),
            "amount_received": float(row["amount_received"]),
            "receiving_currency": str(row["receiving_currency"]),
            "amount_paid": float(row["amount_paid"]),
            "payment_currency": str(row["payment_currency"]),
            "payment_format": str(row["payment_format"]),
            "prediction": int(row["prediction"]),
            "fraud_score": round(float(row["fraud_score"]), 4),
        }
