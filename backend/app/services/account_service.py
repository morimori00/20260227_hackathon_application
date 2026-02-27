import pandas as pd
from typing import Optional

from app.data_store import DataStore


class AccountService:
    def __init__(self, data_store: DataStore):
        self.data_store = data_store

    def get_account_profile(self, account_id: str) -> Optional[dict]:
        info = self.data_store.account_lookup.get(account_id)
        if not info:
            return None

        df = self.data_store.transactions
        sent = df[df["from_account"] == account_id]
        received = df[df["to_account"] == account_id]

        all_txns = pd.concat([sent, received]).drop_duplicates(subset=["id"])
        flagged = all_txns[all_txns["prediction"] == 1]

        return {
            "account_id": account_id,
            "bank_id": info.bank_id,
            "bank_name": info.bank_name,
            "entity_id": info.entity_id,
            "entity_name": info.entity_name,
            "summary": {
                "total_transactions": len(all_txns),
                "total_sent": float(sent["amount_paid"].sum()),
                "total_received": float(received["amount_received"].sum()),
                "flagged_transactions": len(flagged),
            },
        }

    def get_account_transactions(
        self,
        account_id: str,
        direction: str = "all",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[dict], int]:
        df = self.data_store.transactions
        if direction == "sent":
            df = df[df["from_account"] == account_id]
        elif direction == "received":
            df = df[df["to_account"] == account_id]
        else:
            df = df[(df["from_account"] == account_id) | (df["to_account"] == account_id)]

        if start_date:
            df = df[df["timestamp"] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df["timestamp"] <= pd.to_datetime(end_date)]

        df = df.sort_values("timestamp", ascending=False)
        total = len(df)
        offset = (page - 1) * per_page
        page_df = df.iloc[offset : offset + per_page]

        bank_lookup = self.data_store.bank_lookup
        records = []
        for _, row in page_df.iterrows():
            records.append({
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
            })
        return records, total

    def get_counterparties(
        self,
        account_id: str,
        direction: str = "all",
        sort_by: str = "transaction_count",
        sort_order: str = "desc",
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[dict], int]:
        df = self.data_store.transactions
        bank_lookup = self.data_store.bank_lookup

        records = []
        if direction in ("sent", "all"):
            sent = df[df["from_account"] == account_id]
            for to_acc, group in sent.groupby("to_account"):
                records.append({
                    "account_id": str(to_acc),
                    "bank_id": str(group.iloc[0]["to_bank"]),
                    "bank_name": bank_lookup.get(str(group.iloc[0]["to_bank"]), str(group.iloc[0]["to_bank"])),
                    "transaction_count": len(group),
                    "total_amount": float(group["amount_paid"].sum()),
                    "last_transaction_date": group["timestamp"].max().isoformat(),
                    "has_flagged_transactions": bool((group["prediction"] == 1).any()),
                    "_direction": "sent",
                })

        if direction in ("received", "all"):
            received = df[df["to_account"] == account_id]
            for from_acc, group in received.groupby("from_account"):
                existing = next((r for r in records if r["account_id"] == str(from_acc)), None)
                if existing and direction == "all":
                    existing["transaction_count"] += len(group)
                    existing["total_amount"] += float(group["amount_paid"].sum())
                    last_date = group["timestamp"].max().isoformat()
                    if last_date > existing["last_transaction_date"]:
                        existing["last_transaction_date"] = last_date
                    if (group["prediction"] == 1).any():
                        existing["has_flagged_transactions"] = True
                else:
                    records.append({
                        "account_id": str(from_acc),
                        "bank_id": str(group.iloc[0]["from_bank"]),
                        "bank_name": bank_lookup.get(str(group.iloc[0]["from_bank"]), str(group.iloc[0]["from_bank"])),
                        "transaction_count": len(group),
                        "total_amount": float(group["amount_paid"].sum()),
                        "last_transaction_date": group["timestamp"].max().isoformat(),
                        "has_flagged_transactions": bool((group["prediction"] == 1).any()),
                        "_direction": "received",
                    })

        for r in records:
            r.pop("_direction", None)

        reverse = sort_order == "desc"
        records.sort(key=lambda x: x.get(sort_by, 0), reverse=reverse)

        total = len(records)
        offset = (page - 1) * per_page
        return records[offset : offset + per_page], total

    def get_timeline(
        self,
        account_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> list[dict]:
        df = self.data_store.transactions
        sent = df[df["from_account"] == account_id].copy()
        received = df[df["to_account"] == account_id].copy()

        if start_date:
            ts = pd.to_datetime(start_date)
            sent = sent[sent["timestamp"] >= ts]
            received = received[received["timestamp"] >= ts]
        if end_date:
            ts = pd.to_datetime(end_date)
            sent = sent[sent["timestamp"] <= ts]
            received = received[received["timestamp"] <= ts]

        sent["date"] = sent["timestamp"].dt.date
        received["date"] = received["timestamp"].dt.date

        all_dates = set()
        if not sent.empty:
            all_dates.update(sent["date"].unique())
        if not received.empty:
            all_dates.update(received["date"].unique())

        timeline = []
        for date in sorted(all_dates):
            day_sent = sent[sent["date"] == date]
            day_recv = received[received["date"] == date]
            all_day = pd.concat([day_sent, day_recv]).drop_duplicates(subset=["id"])
            timeline.append({
                "date": str(date),
                "sent_amount": float(day_sent["amount_paid"].sum()) if not day_sent.empty else 0.0,
                "received_amount": float(day_recv["amount_received"].sum()) if not day_recv.empty else 0.0,
                "sent_count": len(day_sent),
                "received_count": len(day_recv),
                "has_flagged": bool((all_day["prediction"] == 1).any()) if not all_day.empty else False,
            })

        return timeline
