"""FastAPI application entry-point with lifespan, CORS, rate-limiting, and error handlers."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api import router
from app.core import settings
from app.core.logging import generate_request_id, logger, request_id_var
from app.db import engine
from app.db.models import Base
from app.services.advice import advice_service
from app.services.inference import inference_service


# --- Lifespan: warm up model, DB, and advice KB once at startup ---
@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting Crop Disease API — loading model and advice KB...")
    Base.metadata.create_all(bind=engine)
    inference_service.load()
    advice_service.load()
    logger.info(
        "Startup complete: model_loaded=%s, classes=%d",
        inference_service.loaded,
        inference_service.num_classes,
    )
    yield
    logger.info("Shutting down Crop Disease API.")


# --- Application factory ---
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit])

app = FastAPI(
    title=settings.project_name,
    version="1.0.0",
    description=(
        "Upload a crop leaf, fruit, or pest photo and receive a calibrated disease diagnosis "
        "with Grad-CAM explainability and treatment advice."
    ),
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request-ID injection middleware ---
@app.middleware("http")
async def inject_request_id(request: Request, call_next):  # type: ignore[no-untyped-def]
    rid = request.headers.get("X-Request-ID") or generate_request_id()
    request_id_var.set(rid)
    response = await call_next(request)
    response.headers["X-Request-ID"] = rid
    return response


# --- Global exception handlers ---
@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    rid = request_id_var.get("-")
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal Server Error", "detail": str(exc), "request_id": rid},
    )


# --- Routes ---
app.include_router(router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.app_env == "development",
        log_level=settings.log_level.lower(),
    )

