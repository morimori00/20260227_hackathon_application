import pandas as pd
from typing import Optional
from collections import defaultdict

from app.data_store import DataStore

DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class AnalyticsService:
    def __init__(self, data_store: DataStore):
        self.data_store = data_store

    def _filter_by_date(self, df: pd.DataFrame, start_date: Optional[str], end_date: Optional[str]) -> pd.DataFrame:
        if start_date:
            df = df[df["timestamp"] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df["timestamp"] <= pd.to_datetime(end_date)]
        return df

    def get_heatmap(
        self, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> list[dict]:
        flagged = self.data_store.flagged_subset.copy()
        flagged = self._filter_by_date(flagged, start_date, end_date)

        counts = defaultdict(int)
        if not flagged.empty:
            grouped = flagged.groupby(["day_of_week", "hour"]).size()
            for (day, hour), count in grouped.items():
                counts[(day, hour)] = int(count)

        result = []
        for day in DAYS_ORDER:
            for hour in range(24):
                result.append({
                    "day_of_week": day,
                    "hour": hour,
                    "count": counts.get((day, hour), 0),
                })
        return result

    def get_currency_payment_matrix(
        self, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> list[dict]:
        df = self.data_store.transactions.copy()
        df = self._filter_by_date(df, start_date, end_date)

        if df.empty:
            return []

        grouped = df.groupby(["payment_format", "payment_currency"]).agg(
            total_count=("id", "count"),
            fraud_count=("prediction", "sum"),
        ).reset_index()

        grouped["fraud_rate"] = grouped["fraud_count"] / grouped["total_count"]
        grouped = grouped[grouped["total_count"] > 0]

        return [
            {
                "payment_format": str(row["payment_format"]),
                "currency": str(row["payment_currency"]),
                "total_count": int(row["total_count"]),
                "fraud_count": int(row["fraud_count"]),
                "fraud_rate": round(float(row["fraud_rate"]), 4),
            }
            for _, row in grouped.iterrows()
        ]

    def get_high_risk_banks(
        self,
        metric: str = "count",
        limit: int = 10,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> list[dict]:
        flagged = self.data_store.flagged_subset.copy()
        flagged = self._filter_by_date(flagged, start_date, end_date)

        if flagged.empty:
            return []

        grouped = flagged.groupby("from_bank").agg(
            fraud_transaction_count=("id", "count"),
            fraud_total_amount=("amount_paid", "sum"),
        ).reset_index()

        sort_col = "fraud_transaction_count" if metric == "count" else "fraud_total_amount"
        grouped = grouped.sort_values(sort_col, ascending=False).head(limit)

        bank_lookup = self.data_store.bank_lookup
        return [
            {
                "bank_id": str(row["from_bank"]),
                "bank_name": bank_lookup.get(str(row["from_bank"]), str(row["from_bank"])),
                "fraud_transaction_count": int(row["fraud_transaction_count"]),
                "fraud_total_amount": round(float(row["fraud_total_amount"]), 2),
            }
            for _, row in grouped.iterrows()
        ]

    def get_feature_importances(self) -> list[dict]:
        return self.data_store.feature_importances

    def get_pattern_distribution(
        self, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> list[dict]:
        type_counts: dict[str, dict] = defaultdict(lambda: {"count": 0, "total_amount": 0.0})

        for pattern in self.data_store.patterns:
            type_counts[pattern.pattern_type]["count"] += 1
            type_counts[pattern.pattern_type]["total_amount"] += pattern.total_amount

        result = [
            {
                "pattern_type": ptype,
                "count": info["count"],
                "total_amount": round(info["total_amount"], 2),
            }
            for ptype, info in type_counts.items()
        ]
        result.sort(key=lambda x: x["count"], reverse=True)
        return result
