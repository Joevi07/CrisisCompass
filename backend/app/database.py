from sqlalchemy import create_engine, Column, String, Float, DateTime, Boolean, Integer, Text, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBAlert(Base):
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    hazard_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    affected_location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    radius_km = Column(Float, nullable=True)
    issuing_authority = Column(String, nullable=False)
    source_url = Column(String, nullable=False)
    published_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    valid_until = Column(DateTime, nullable=True)
    verification_status = Column(String, nullable=False)
    data_origin = Column(String, nullable=False)
    recommended_action = Column(Text, nullable=False)

class DBFacility(Base):
    __tablename__ = "facilities"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    facility_type = Column(String, nullable=False) # shelter, hospital
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=False)
    contact_number = Column(String, nullable=True)
    capacity = Column(Integer, nullable=True)
    current_occupancy = Column(Integer, nullable=True)
    is_open = Column(Boolean, default=True)
    status_verified_at = Column(DateTime, default=datetime.utcnow)
    data_origin = Column(String, nullable=False)
    source_notes = Column(String, nullable=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
