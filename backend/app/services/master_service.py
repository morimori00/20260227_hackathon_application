import bisect

from app.data_store import DataStore


class MasterService:
    def __init__(self, data_store: DataStore):
        self.data_store = data_store
        self._banks_cache: list[dict] | None = None
        self._currencies_cache: list[str] | None = None
        self._payment_formats_cache: list[str] | None = None

    def get_banks(self) -> list[dict]:
        if self._banks_cache is None:
            self._banks_cache = sorted(
                [
                    {"bank_id": bid, "bank_name": bname}
                    for bid, bname in self.data_store.bank_lookup.items()
                ],
                key=lambda x: x["bank_name"],
            )
        return self._banks_cache

    def get_currencies(self) -> list[str]:
        if self._currencies_cache is None:
            self._currencies_cache = sorted(
                self.data_store.transactions["payment_currency"].unique().tolist()
            )
        return self._currencies_cache

    def get_payment_formats(self) -> list[str]:
        if self._payment_formats_cache is None:
            self._payment_formats_cache = sorted(
                self.data_store.transactions["payment_format"].unique().tolist()
            )
        return self._payment_formats_cache

    def search_accounts(self, q: str, limit: int = 10) -> list[dict]:
        ids = self.data_store.sorted_account_ids
        idx = bisect.bisect_left(ids, q)
        results = []
        while idx < len(ids) and len(results) < limit:
            if ids[idx].startswith(q):
                account_id = ids[idx]
                info = self.data_store.account_lookup.get(account_id)
                if info:
                    results.append({
                        "account_id": account_id,
                        "bank_id": info.bank_id,
                        "bank_name": info.bank_name,
                    })
                idx += 1
            else:
                break
        return results
