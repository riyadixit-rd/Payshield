from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    merchant = Column(String)
    amount = Column(Float)
    risk_score = Column(Float)
    decision = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
