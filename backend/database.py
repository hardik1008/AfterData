"""
AFTERDATA Database Layer
Initial implementation: SQLite (file or in-memory).
Designed for seamless drop-in replacement with PostgreSQL via SQLALCHEMY_DATABASE_URI.
"""
import os
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

# Database URL can be switched to PostgreSQL anytime via env var:
# Example: postgresql+psycopg2://user:password@localhost:5432/afterdata
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./afterdata.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class StoredDataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    row_count = Column(Integer, nullable=False)
    column_count = Column(Integer, nullable=False)
    schema_json = Column(JSON, nullable=False)
    raw_data_json = Column(Text, nullable=False)  # Serialized records
    created_at = Column(DateTime, default=datetime.utcnow)

class StoredInvestigation(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, index=True)
    dataset_id = Column(String, index=True, nullable=False)
    question = Column(Text, nullable=False)
    test_type = Column(String, nullable=False)
    result_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
