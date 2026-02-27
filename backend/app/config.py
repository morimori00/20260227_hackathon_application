import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = Path(os.environ.get("DATA_DIR", "/app/data"))
MODEL_DIR = BASE_DIR / "saved_model"

TRANSACTION_CSV = DATA_DIR / "HI-Small_Trans.csv.csv"
ACCOUNTS_CSV = DATA_DIR / "HI-Small_accounts.csv"
PATTERNS_TXT = DATA_DIR / "HI-Small_Patterns.txt"

PIPELINE_PATH = MODEL_DIR / "aml_pipeline.joblib"
FEATURE_COLUMNS_PATH = MODEL_DIR / "feature_columns.joblib"
CAT_COLUMNS_PATH = MODEL_DIR / "cat_columns.joblib"

BATCH_SIZE = 100_000
MAX_NETWORK_NODES = 200
MAX_NETWORK_EDGES = 1000

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")
