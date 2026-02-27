import pandas as pd
from typing import Optional
from collections import defaultdict

from app.data_store import DataStore
from app.config import MAX_NETWORK_NODES, MAX_NETWORK_EDGES


class NetworkService:
    def __init__(self, data_store: DataStore):
        self.data_store = data_store

    def get_network(
        self,
        account_id: str,
        hops: int = 2,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> dict:
        df = self.data_store.transactions
        if start_date:
            df = df[df["timestamp"] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df["timestamp"] <= pd.to_datetime(end_date)]

        visited = {account_id}
        queue = [account_id]
        edge_rows = []
        node_accounts = {account_id}

        for _hop in range(hops):
            next_queue = []
            for acc in queue:
                from_mask = df["from_account"] == acc
                to_mask = df["to_account"] == acc
                related = df[from_mask | to_mask]

                for _, row in related.iterrows():
                    edge_rows.append(row)
                    counterpart = (
                        str(row["to_account"])
                        if str(row["from_account"]) == acc
                        else str(row["from_account"])
                    )
                    node_accounts.add(counterpart)
                    if counterpart not in visited:
                        visited.add(counterpart)
                        next_queue.append(counterpart)

            queue = next_queue
            if not queue:
                break

        seen_edge_ids = set()
        unique_edges = []
        for row in edge_rows:
            eid = row["id"]
            if eid not in seen_edge_ids:
                seen_edge_ids.add(eid)
                unique_edges.append(row)

        node_stats: dict[str, dict] = defaultdict(
            lambda: {"total_amount": 0.0, "transaction_count": 0, "max_fraud_score": 0.0}
        )
        for row in unique_edges:
            fa = str(row["from_account"])
            ta = str(row["to_account"])
            amt = float(row["amount_paid"])
            fs = float(row["fraud_score"])
            node_stats[fa]["total_amount"] += amt
            node_stats[fa]["transaction_count"] += 1
            node_stats[fa]["max_fraud_score"] = max(node_stats[fa]["max_fraud_score"], fs)
            node_stats[ta]["total_amount"] += amt
            node_stats[ta]["transaction_count"] += 1
            node_stats[ta]["max_fraud_score"] = max(node_stats[ta]["max_fraud_score"], fs)

        truncated = False
        nodes_list = list(node_accounts)
        if len(nodes_list) > MAX_NETWORK_NODES:
            nodes_list.sort(key=lambda x: node_stats[x]["max_fraud_score"], reverse=True)
            nodes_list = nodes_list[:MAX_NETWORK_NODES]
            truncated = True

        node_set = set(nodes_list)
        filtered_edges = [e for e in unique_edges if str(e["from_account"]) in node_set and str(e["to_account"]) in node_set]

        if len(filtered_edges) > MAX_NETWORK_EDGES:
            filtered_edges.sort(key=lambda x: float(x["fraud_score"]), reverse=True)
            filtered_edges = filtered_edges[:MAX_NETWORK_EDGES]
            truncated = True

        bank_lookup = self.data_store.bank_lookup
        account_lookup = self.data_store.account_lookup

        nodes = []
        for acc_id in nodes_list:
            info = account_lookup.get(acc_id)
            stats = node_stats.get(acc_id, {"total_amount": 0, "transaction_count": 0, "max_fraud_score": 0})
            nodes.append({
                "id": acc_id,
                "bank_id": info.bank_id if info else "",
                "bank_name": info.bank_name if info else bank_lookup.get("", ""),
                "entity_name": info.entity_name if info else None,
                "total_amount": round(stats["total_amount"], 2),
                "transaction_count": stats["transaction_count"],
                "fraud_score": round(stats["max_fraud_score"], 4),
                "is_origin": acc_id == account_id,
            })

        edges = []
        for row in filtered_edges:
            edges.append({
                "id": str(row["id"]),
                "source": str(row["from_account"]),
                "target": str(row["to_account"]),
                "amount": float(row["amount_paid"]),
                "currency": str(row["payment_currency"]),
                "timestamp": row["timestamp"].isoformat() if hasattr(row["timestamp"], "isoformat") else str(row["timestamp"]),
                "payment_format": str(row["payment_format"]),
                "prediction": int(row["prediction"]),
                "fraud_score": round(float(row["fraud_score"]), 4),
            })

        edge_txn_ids = seen_edge_ids
        patterns = []
        for pattern in self.data_store.patterns:
            matching_ids = [tid for tid in pattern.transaction_ids if tid in edge_txn_ids]
            if matching_ids:
                patterns.append({
                    "type": pattern.pattern_type,
                    "detail": pattern.detail,
                    "transaction_ids": matching_ids,
                    "total_amount": round(pattern.total_amount, 2),
                })

        return {
            "nodes": nodes,
            "edges": edges,
            "patterns": patterns,
            "truncated": truncated,
        }
