from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from datetime import datetime
import random

# ---------------- APP ----------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATABASE ----------------

DATABASE_URL = "sqlite:///./payshield.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True)
    username = Column(String)
    amount = Column(Float)
    merchant = Column(String)
    risk_score = Column(Float)
    decision = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------- OTP STORE ----------------

otp_store = {}

# ---------------- REQUEST MODEL ----------------

class TransactionRequest(BaseModel):
    username: str
    amount: float
    merchant: str


class OTPRequest(BaseModel):
    username: str
    otp: int


# ---------------- OTP SEND ----------------

@app.post("/send-otp")
def send_otp(data: TransactionRequest):

    otp = random.randint(100000,999999)

    otp_store[data.username] = otp

    return {
        "status":"OTP_REQUIRED",
        "otp": otp
    }


# ---------------- OTP VERIFY ----------------

@app.post("/verify-otp")
def verify_otp(data: OTPRequest):

    real = otp_store.get(data.username)

    if real == data.otp:
        return {"status":"VERIFIED"}

    return {"status":"FAILED"}


# ---------------- CHECK ----------------

@app.post("/check")
def check_transaction(data: TransactionRequest, db: Session = Depends(get_db)):

    risk = 0

    if data.amount > 20000:
        risk += 40

    if data.amount > 100000:
        risk += 100

    if data.username.lower() == "scammer":
        risk += 100


    if risk >= 100:
        decision = "BANNED"
    elif risk >= 40:
        decision = "FLAGGED"
    else:
        decision = "SAFE"


    txn = Transaction(
        username=data.username,
        amount=data.amount,
        merchant=data.merchant,
        risk_score=risk,
        decision=decision,
        timestamp=datetime.utcnow()
    )

    db.add(txn)
    db.commit()

    return {
        "decision": decision,
        "risk_score": risk
    }


# ---------------- TRANSACTIONS ----------------

@app.get("/transactions")
def get_transactions(db: Session = Depends(get_db)):

    return db.query(Transaction).order_by(Transaction.id.desc()).all()


# ---------------- ANALYTICS ----------------

@app.get("/analytics")
def analytics(db: Session = Depends(get_db)):

    txns = db.query(Transaction).all()

    total = len(txns)

    fraud = len([t for t in txns if t.decision in ["FLAGGED","BANNED"]])

    safe = total - fraud

    percent = (fraud/total*100) if total else 0

    return {
        "total": total,
        "fraud": fraud,
        "safe": safe,
        "fraud_percent": percent
    }
