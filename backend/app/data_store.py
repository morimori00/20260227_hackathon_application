import logging
import re
from dataclasses import dataclass, field
from datetime import datetime

import pandas as pd

from app.config import TRANSACTION_CSV, ACCOUNTS_CSV, PATTERNS_TXT
from app.prediction_service import PredictionService

logger = logging.getLogger(__name__)

TRANSACTION_COLUMN_RENAME = {
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

ACCOUNT_COLUMN_RENAME = {
    "Bank Name": "bank_name",
    "Bank ID": "bank_id",
    "Account Number": "account_id",
    "Entity ID": "entity_id",
    "Entity Name": "entity_name",
}


@dataclass
class AccountInfo:
    account_id: str
    bank_id: str
    bank_name: str
    entity_id: str
    entity_name: str


@dataclass
class PatternInfo:
    pattern_type: str
    detail: str
    transactions: list[dict] = field(default_factory=list)
    transaction_ids: list[str] = field(default_factory=list)
    total_amount: float = 0.0


class DataStore:
    def __init__(self):
        self.transactions: pd.DataFrame = pd.DataFrame()
        self.account_lookup: dict[str, AccountInfo] = {}
        self.bank_lookup: dict[str, str] = {}
        self.patterns: list[PatternInfo] = []
        self.feature_importances: list[dict] = []
        self.prediction_service: PredictionService | None = None

        self.from_account_index: dict[str, list[int]] = {}
        self.to_account_index: dict[str, list[int]] = {}
        self.flagged_subset: pd.DataFrame = pd.DataFrame()

        self.sorted_account_ids: list[str] = []

    def initialize(self):
        logger.info("Initializing DataStore...")
        self.prediction_service = PredictionService()
        self._load_transactions()
        self._load_accounts()
        self._load_patterns()
        self._run_predictions()
        self._build_indexes()
        logger.info("DataStore initialization complete.")

    def _load_transactions(self):
        logger.info("Loading transactions from %s", TRANSACTION_CSV)
        df = pd.read_csv(TRANSACTION_CSV)
        df = df.rename(columns=TRANSACTION_COLUMN_RENAME)

        if "is_laundering" in df.columns:
            df = df.drop(columns=["is_laundering"])

        df = df.drop_duplicates()
        df["timestamp"] = pd.to_datetime(df["timestamp"], format="%Y/%m/%d %H:%M")
        df["day_of_week"] = df["timestamp"].dt.day_name()
        df["hour"] = df["timestamp"].dt.hour
        df["id"] = [f"txn_{i+1:08d}" for i in range(len(df))]

        df["from_bank"] = df["from_bank"].astype(str)
        df["to_bank"] = df["to_bank"].astype(str)
        df["from_account"] = df["from_account"].astype(str)
        df["to_account"] = df["to_account"].astype(str)
        df["amount_received"] = df["amount_received"].astype(float)
        df["amount_paid"] = df["amount_paid"].astype(float)

        self.transactions = df
        logger.info("Loaded %d transactions", len(df))

    def _load_accounts(self):
        logger.info("Loading accounts from %s", ACCOUNTS_CSV)
        df = pd.read_csv(ACCOUNTS_CSV)
        df = df.rename(columns=ACCOUNT_COLUMN_RENAME)
        df["bank_id"] = df["bank_id"].astype(str)

        bank_ids = df["bank_id"].values
        account_ids = df["account_id"].values
        bank_names = df["bank_name"].values
        entity_ids = df["entity_id"].values
        entity_names = df["entity_name"].values
        for i in range(len(df)):
            bid = str(bank_ids[i])
            aid = str(account_ids[i])
            self.bank_lookup[bid] = str(bank_names[i])
            self.account_lookup[aid] = AccountInfo(
                account_id=aid,
                bank_id=bid,
                bank_name=str(bank_names[i]),
                entity_id=str(entity_ids[i]),
                entity_name=str(entity_names[i]),
            )

        self.sorted_account_ids = sorted(self.account_lookup.keys())
        logger.info("Loaded %d accounts, %d banks",
                     len(self.account_lookup), len(self.bank_lookup))

    def _load_patterns(self):
        logger.info("Loading patterns from %s", PATTERNS_TXT)
        with open(PATTERNS_TXT, "r") as f:
            lines = f.readlines()

        current_pattern = None
        for line in lines:
            line = line.strip()
            if not line:
                continue

            begin_match = re.match(
                r"BEGIN LAUNDERING ATTEMPT - ([A-Z\-]+):\s*(.*)", line
            )
            if begin_match:
                current_pattern = PatternInfo(
                    pattern_type=begin_match.group(1),
                    detail=begin_match.group(2).strip(),
                )
                continue

            end_match = re.match(r"END LAUNDERING ATTEMPT", line)
            if end_match:
                if current_pattern:
                    self.patterns.append(current_pattern)
                current_pattern = None
                continue

            if current_pattern and "," in line:
                parts = line.split(",")
                if len(parts) >= 9:
                    try:
                        amount = float(parts[5])
                    except (ValueError, IndexError):
                        amount = 0.0
                    current_pattern.total_amount += amount
                    current_pattern.transactions.append({
                        "timestamp": parts[0].strip(),
                        "from_bank": parts[1].strip(),
                        "from_account": parts[2].strip(),
                        "to_bank": parts[3].strip(),
                        "to_account": parts[4].strip(),
                        "amount": amount,
                    })

        logger.info("Loaded %d patterns", len(self.patterns))

    def _run_predictions(self):
        logger.info("Running model predictions...")
        self.transactions = self.prediction_service.predict_batch(self.transactions)
        self.feature_importances = self.prediction_service.get_feature_importances()
        logger.info("Predictions complete.")

    def _build_indexes(self):
        logger.info("Building indexes...")
        from collections import defaultdict

        self.from_account_index = defaultdict(list)
        self.to_account_index = defaultdict(list)

        from_accounts = self.transactions["from_account"].values
        to_accounts = self.transactions["to_account"].values
        for i in range(len(self.transactions)):
            self.from_account_index[from_accounts[i]].append(i)
            self.to_account_index[to_accounts[i]].append(i)

        self.from_account_index = dict(self.from_account_index)
        self.to_account_index = dict(self.to_account_index)

        self.flagged_subset = self.transactions[
            self.transactions["prediction"] == 1
        ].copy()

        logger.info(
            "Indexes built. From accounts: %d, To accounts: %d, Flagged: %d",
            len(self.from_account_index),
            len(self.to_account_index),
            len(self.flagged_subset),
        )
        self._link_patterns_to_transactions()

    def _link_patterns_to_transactions(self):
        logger.info("Linking patterns to transactions...")
        txn_key_to_id = {}
        ts_vals = self.transactions["timestamp"].values
        fa_vals = self.transactions["from_account"].values
        ta_vals = self.transactions["to_account"].values
        id_vals = self.transactions["id"].values
        for i in range(len(self.transactions)):
            key = (str(ts_vals[i]), fa_vals[i], ta_vals[i])
            txn_key_to_id[key] = id_vals[i]

        for pattern in self.patterns:
            pattern.transaction_ids = []
            for ptxn in pattern.transactions:
                try:
                    ts = pd.to_datetime(ptxn["timestamp"], format="%Y/%m/%d %H:%M")
                    key = (str(ts), ptxn["from_account"], ptxn["to_account"])
                    tid = txn_key_to_id.get(key)
                    if tid:
                        pattern.transaction_ids.append(tid)
                except Exception:
                    continue
        logger.info("Pattern linking complete.")


_data_store: DataStore | None = None


def get_data_store() -> DataStore:
    global _data_store
    if _data_store is None:
        _data_store = DataStore()
        _data_store.initialize()
    return _data_store


def initialize_data_store() -> DataStore:
    global _data_store
    _data_store = DataStore()
    _data_store.initialize()
    return _data_store
