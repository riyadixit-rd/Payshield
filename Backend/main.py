from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import joblib
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ML model
model_path = os.path.join(os.path.dirname(__file__), "..", "ml", "model.pkl")
model = joblib.load(model_path)

users = {
    "riya": {"risk": 10, "blocks": 0, "banned": False},
    "ashish": {"risk": 5, "blocks": 0, "banned": False},
    "scammer": {"risk": 80, "blocks": 2, "banned": False}
}

transactions = []
pending_otps = {}

class Transaction(BaseModel):
    user: str
    amount: float
    merchant: str

class OTPVerify(BaseModel):
    user: str
    otp: str

@app.post("/check")
def check(txn: Transaction):

    user = txn.user.lower()

    if user not in users:
        users[user] = {"risk": 20, "blocks": 0, "banned": False}

    if users[user]["banned"]:
        return {
            "decision": "BANNED",
            "risk": 100,
            "reasons": ["User permanently banned due to fraud"]
        }

    base_risk = users[user]["risk"]

    unknown_merchant = 0 if "shop" in txn.merchant.lower() else 1
    blocked_before = 1 if users[user]["blocks"] > 0 else 0

    # ML prediction
    prediction = model.predict([[txn.amount, unknown_merchant, blocked_before]])[0]

    risk = base_risk + (30 if prediction == 1 else 0)
    reasons = []

    if prediction == 1:
        reasons.append("ML detected fraud pattern")

    if txn.amount > 5000:
        risk += 20
        reasons.append("High amount")

    # Decision
    if risk > 90:
        decision = "BLOCK"
        users[user]["blocks"] += 1
        users[user]["risk"] += 10

        if users[user]["blocks"] >= 3:
            users[user]["banned"] = True
            decision = "BANNED"

    elif risk > 40:
        decision = "OTP_REQUIRED"
        otp = str(random.randint(1000, 9999))
        pending_otps[user] = otp
        return {
            "decision": "OTP_REQUIRED",
            "otp": otp,
            "risk": risk,
            "reasons": reasons
        }

    else:
        decision = "ALLOW"

    transactions.append({
        "user": user,
        "amount": txn.amount,
        "merchant": txn.merchant,
        "risk": risk,
        "decision": decision
    })

    return {
        "decision": decision,
        "risk": risk,
        "reasons": reasons,
        "ml_prediction": int(prediction)
    }

@app.post("/verify-otp")
def verify(data: OTPVerify):
    user = data.user.lower()
    otp = data.otp

    if user in pending_otps and pending_otps[user] == otp:
        del pending_otps[user]
        return {"status": "SUCCESS", "message": "Payment verified"}
    else:
        users[user]["blocks"] += 1
        if users[user]["blocks"] >= 3:
            users[user]["banned"] = True
        return {"status": "FAILED", "message": "Invalid OTP"}
