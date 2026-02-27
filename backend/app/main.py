import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.data_store import initialize_data_store
from app.routers import transactions, network, accounts, alerts, notes, analytics, master, upload, chatbot

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting data initialization...")
    initialize_data_store()
    logger.info("Data initialization complete.")
    yield


app = FastAPI(title="AML Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(master.router)
app.include_router(transactions.router)
app.include_router(accounts.router)
app.include_router(alerts.router)
app.include_router(notes.router)
app.include_router(analytics.router)
app.include_router(network.router)
app.include_router(upload.router)
app.include_router(chatbot.router)


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}
