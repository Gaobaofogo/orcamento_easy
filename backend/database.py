import os
from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

PG_USER = os.getenv("POSTGRES_USER")
PG_PASSWORD = quote_plus(os.getenv("POSTGRES_PASSWORD"))
PG_HOST = os.getenv("POSTGRES_HOST")
PG_PORT = os.getenv("POSTGRES_PORT")
PG_DB = os.getenv("POSTGRES_DB")
SQLALCHEMY_DATABASE_URL = (
    f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DB}"
)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    echo=True if os.getenv("APP_ENV", None) == "dev" else False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
