from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime


DATABASE_URL = "sqlite:///./hireflow.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=True)
    raw_text = Column(Text, nullable=False)
    analysis = Column(Text, nullable=True)


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    resume_text = Column(Text, nullable=False)
    profile = Column(Text, nullable=True)


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, nullable=False)
    job_id = Column(Integer, nullable=False)
    score = Column(Integer, nullable=True)
    tier = Column(String, nullable=True)
    result = Column(Text, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    action = Column(String, nullable=False)

    entity_type = Column(String, nullable=True)
    entity_id = Column(Integer, nullable=True)

    source = Column(String, nullable=True)

    details = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


Base.metadata.create_all(bind=engine)