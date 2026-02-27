import pandas as pd
from datetime import datetime
from typing import Optional

from app.data_store import DataStore


class AlertService:
    def __init__(self, data_store: DataStore):
        self.data_store = data_store
        self._alerts_df: pd.DataFrame = pd.DataFrame()
        self._status_map: dict[str, dict] = {}
        self._initialize_alerts()

    def _initialize_alerts(self):
        flagged = self.data_store.flagged_subset.copy()
        if flagged.empty:
            return

        flagged = flagged.sort_values("fraud_score", ascending=False).reset_index(drop=True)
        flagged["alert_id"] = [f"alert_{i+1:05d}" for i in range(len(flagged))]
        self._alerts_df = flagged

        now = datetime.utcnow().isoformat()
        for alert_id in flagged["alert_id"]:
            self._status_map[alert_id] = {
                "status": "pending",
                "updated_at": now,
            }

    def get_alerts(
        self,
        page: int = 1,
        per_page: int = 20,
        status: Optional[str] = None,
        from_bank: Optional[str] = None,
        to_bank: Optional[str] = None,
        currency: Optional[str] = None,
        payment_format: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        min_score: Optional[float] = None,
        max_score: Optional[float] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        sort_by: str = "fraud_score",
        sort_order: str = "desc",
    ) -> tuple[list[dict], int]:
        df = self._alerts_df.copy()
        if df.empty:
            return [], 0

        df["status"] = df["alert_id"].map(lambda x: self._status_map[x]["status"])

        if status:
            statuses = [s.strip() for s in status.split(",")]
            df = df[df["status"].isin(statuses)]
        if from_bank:
            df = df[df["from_bank"] == from_bank]
        if to_bank:
            df = df[df["to_bank"] == to_bank]
        if currency:
            df = df[df["payment_currency"] == currency]
        if payment_format:
            df = df[df["payment_format"] == payment_format]
        if min_amount is not None:
            df = df[df["amount_paid"] >= min_amount]
        if max_amount is not None:
            df = df[df["amount_paid"] <= max_amount]
        if min_score is not None:
            df = df[df["fraud_score"] >= min_score]
        if max_score is not None:
            df = df[df["fraud_score"] <= max_score]
        if start_date:
            df = df[df["timestamp"] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df["timestamp"] <= pd.to_datetime(end_date)]

        sort_col = sort_by if sort_by in df.columns else "fraud_score"
        df = df.sort_values(sort_col, ascending=(sort_order == "asc"))

        total = len(df)
        offset = (page - 1) * per_page
        page_df = df.iloc[offset : offset + per_page]

        bank_lookup = self.data_store.bank_lookup
        records = []
        for _, row in page_df.iterrows():
            records.append({
                "alert_id": row["alert_id"],
                "transaction_id": row["id"],
                "status": self._status_map[row["alert_id"]]["status"],
                "fraud_score": round(float(row["fraud_score"]), 4),
                "timestamp": row["timestamp"].isoformat() if hasattr(row["timestamp"], "isoformat") else str(row["timestamp"]),
                "from_bank_id": str(row["from_bank"]),
                "from_bank_name": bank_lookup.get(str(row["from_bank"]), str(row["from_bank"])),
                "from_account": str(row["from_account"]),
                "to_bank_id": str(row["to_bank"]),
                "to_bank_name": bank_lookup.get(str(row["to_bank"]), str(row["to_bank"])),
                "to_account": str(row["to_account"]),
                "amount_paid": float(row["amount_paid"]),
                "payment_currency": str(row["payment_currency"]),
                "payment_format": str(row["payment_format"]),
            })

        return records, total

    def get_alert_summary(self) -> dict:
        total = len(self._alerts_df)
        by_status = {"pending": 0, "investigating": 0, "resolved": 0, "false_positive": 0}
        for info in self._status_map.values():
            s = info["status"]
            if s in by_status:
                by_status[s] += 1

        max_date = self._alerts_df["timestamp"].max() if not self._alerts_df.empty else None
        today_new = 0
        if max_date is not None:
            today_new = int(
                (self._alerts_df["timestamp"].dt.date == max_date.date()).sum()
            )

        return {
            "total": total,
            "by_status": by_status,
            "today_new": today_new,
        }

    def add_new_alerts(self, new_flagged_df: pd.DataFrame) -> int:
        if new_flagged_df.empty:
            return 0

        new_flagged = new_flagged_df.copy()
        new_flagged = new_flagged.sort_values("fraud_score", ascending=False).reset_index(drop=True)

        start_idx = len(self._alerts_df)
        new_flagged["alert_id"] = [
            f"alert_{start_idx + i + 1:05d}" for i in range(len(new_flagged))
        ]

        now = datetime.utcnow().isoformat()
        for alert_id in new_flagged["alert_id"]:
            self._status_map[alert_id] = {
                "status": "pending",
                "updated_at": now,
            }

        self._alerts_df = pd.concat(
            [self._alerts_df, new_flagged], ignore_index=True
        )

        return len(new_flagged)

    def update_alert_status(self, alert_id: str, new_status: str) -> Optional[dict]:
        valid_statuses = {"pending", "investigating", "resolved", "false_positive"}
        if new_status not in valid_statuses:
            return None

        if alert_id not in self._status_map:
            return None

        now = datetime.utcnow().isoformat()
        self._status_map[alert_id] = {
            "status": new_status,
            "updated_at": now,
        }

        return {
            "alert_id": alert_id,
            "status": new_status,
            "updated_at": now,
        }
