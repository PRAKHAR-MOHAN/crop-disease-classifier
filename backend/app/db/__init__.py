"""SQLAlchemy 2.0 engine and session factory (SQLite default, PostgreSQL via DATABASE_URL)."""

from __future__ import annotations

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.core import settings

_connect_args: dict = {}
if settings.database_url.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    echo=settings.app_env == "development",
    connect_args=_connect_args,
    pool_pre_ping=True,
)

# Enable WAL mode for SQLite concurrent reads
if settings.database_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, _connection_record):  # type: ignore[no-untyped-def]
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Session:  # type: ignore[misc]
    """FastAPI dependency yielding a scoped DB session with automatic cleanup."""
    db = SessionLocal()
    try:
        yield db  # type: ignore[misc]
    finally:
        db.close()

