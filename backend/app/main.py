from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import FRONTEND_ORIGIN
from app.services.database import initialize_database
from app.services.knowledge import initialize_knowledge


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    initialize_knowledge()
    yield


app = FastAPI(
    title="SentinelRAG API",
    description="Defensive incident investigation and locally grounded RAG service.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
