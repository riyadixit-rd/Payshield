import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {

  const [user, setUser] = useState("");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");

  const [result, setResult] = useState("");
  const [risk, setRisk] = useState("");
  const [reasons, setReasons] = useState([]);
  const [stats, setStats] = useState({ allowed: 0, blocked: 0, otp: 0 });

  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [serverOtp, setServerOtp] = useState("");

  async function sendMoney() {
    const res = await fetch("http://127.0.0.1:8000/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, amount, merchant })
    });

    const data = await res.json();

    setResult(data.decision);
    setRisk(data.risk);
    setReasons(data.reasons || []);

    if (data.decision === "OTP_REQUIRED") {
      setShowOtp(true);
      setServerOtp(data.otp);
      updateStats("otp");
    } else if (data.decision === "BLOCK" || data.decision === "BANNED") {
      updateStats("blocked");
    } else if (data.decision === "ALLOW") {
      updateStats("allowed");
    }
  }

  function updateStats(type) {
    setStats(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
  }

  async function verifyOtp() {
    const res = await fetch("http://127.0.0.1:8000/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, otp })
    });

    const data = await res.json();
    alert(data.message);
    setShowOtp(false);
  }

  const chartData = {
    labels: ["Allowed", "Blocked", "OTP Required"],
    datasets: [
      {
        data: [stats.allowed, stats.blocked, stats.otp],
        backgroundColor: ["#4CAF50", "#F44336", "#FFC107"]
      }
    ]
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>PayShield AI Fraud Dashboard</h1>

      <div style={{ marginBottom: "20px" }}>
        <input placeholder="User" value={user} onChange={e => setUser(e.target.value)} />
        <input placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
        <input placeholder="Merchant" value={merchant} onChange={e => setMerchant(e.target.value)} />
        <button onClick={sendMoney}>Send</button>
      </div>

      <h2>{result}</h2>
      <p>Risk: {risk}%</p>

      <ul>
        {reasons.map((r, i) => <li key={i}>{r}</li>)}
      </ul>

      {showOtp && (
        <div>
          <h3>Enter OTP</h3>
          <p>(Demo OTP: {serverOtp})</p>
          <input value={otp} onChange={e => setOtp(e.target.value)} />
          <button onClick={verifyOtp}>Verify</button>
        </div>
      )}

      <hr />

      <h2>Fraud Analytics</h2>
      <div style={{ width: "300px" }}>
        <Pie data={chartData} />
      </div>
    </div>
  );
}

export default App;
