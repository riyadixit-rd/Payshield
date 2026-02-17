import React, { useState, useEffect } from "react";

function App() {

const API="https://payshield-backend.onrender.com";

const [username,setUsername]=useState("")
const [amount,setAmount]=useState("")
const [merchant,setMerchant]=useState("")

const [decision,setDecision]=useState("")
const [risk,setRisk]=useState(0)

const [otp,setOtp]=useState("")
const [otpRequired,setOtpRequired]=useState(false)

const [transactions,setTransactions]=useState([])
const [analytics,setAnalytics]=useState({})


useEffect(()=>{

loadTransactions()
loadAnalytics()

},[])



const loadTransactions=async()=>{

const res=await fetch(API+"/transactions")
const data=await res.json()
setTransactions(data)

}



const loadAnalytics=async()=>{

const res=await fetch(API+"/analytics")
const data=await res.json()
setAnalytics(data)

}




const analyze=async()=>{

if(amount>20000){

const res=await fetch(API+"/send-otp",{

method:"POST",

headers:{"Content-Type":"application/json"},

body:JSON.stringify({username,amount,merchant})

})

const data=await res.json()

alert("Demo OTP: "+data.otp)

setOtpRequired(true)

return

}

processTransaction()

}



const verifyOtp=async()=>{

const res=await fetch(API+"/verify-otp",{

method:"POST",

headers:{"Content-Type":"application/json"},

body:JSON.stringify({username,otp:Number(otp)})

})

const data=await res.json()

if(data.status==="VERIFIED"){

setOtpRequired(false)
processTransaction()

}
else{

alert("Wrong OTP")

}

}



const processTransaction=async()=>{

const res=await fetch(API+"/check",{

method:"POST",

headers:{"Content-Type":"application/json"},

body:JSON.stringify({

username,
amount:Number(amount),
merchant

})

})

const data=await res.json()

setDecision(data.decision)
setRisk(data.risk_score)

loadTransactions()
loadAnalytics()

}



return(

<div style={styles.page}>


<h1 style={styles.title}>
🛡 PayShield Fraud Detection
</h1>



<div style={styles.card}>


<input style={styles.input}
placeholder="Username"
onChange={e=>setUsername(e.target.value)}
/>


<input style={styles.input}
placeholder="Amount"
onChange={e=>setAmount(e.target.value)}
/>


<input style={styles.input}
placeholder="Merchant"
onChange={e=>setMerchant(e.target.value)}
/>



<button style={styles.button}
onClick={analyze}>
Analyze Transaction
</button>



{otpRequired && (

<div style={{marginTop:15}}>

<input style={styles.input}
placeholder="Enter OTP"
onChange={e=>setOtp(e.target.value)}
/>


<button style={styles.button}
onClick={verifyOtp}>
Verify OTP
</button>


</div>

)}



</div>



<div style={{marginTop:20}}>

<h2>Decision:
<span style={decisionColor(decision)}>
{decision}
</span>
</h2>


<h3>Risk Score: {risk}%</h3>


<div style={styles.riskBarBg}>

<div style={{

...styles.riskBarFill,

width:risk+"%"

}}/>

</div>


</div>




<div style={styles.analyticsRow}>


<Card title="Total"
value={analytics.total}
color="#4f46e5"/>


<Card title="Fraud"
value={analytics.fraud}
color="#dc2626"/>


<Card title="Safe"
value={analytics.safe}
color="#16a34a"/>


<Card title="Fraud %"
value={analytics.fraud_percent ? analytics.fraud_percent.toFixed(2)+"%" : "0%"}
color="#ea580c"/>


</div>



<h2 style={{marginTop:30}}>
Transaction History
</h2>



<table style={styles.table}>

<tr>

<th>ID</th>
<th>User</th>
<th>Amount</th>
<th>Merchant</th>
<th>Risk</th>
<th>Decision</th>
<th>Time</th>

</tr>


{transactions.map(t=>(

<tr key={t.id}>

<td>{t.id}</td>
<td>{t.username}</td>
<td>{t.amount}</td>
<td>{t.merchant}</td>
<td>{t.risk_score}%</td>
<td>{t.decision}</td>
<td>{t.timestamp}</td>

</tr>

))}

</table>



</div>

)

}



function Card({title,value,color}){

return(

<div style={{
...styles.analyticsCard,
background:color
}}>

<h3>{title}</h3>

<h2>{value}</h2>

</div>

)

}



const decisionColor=(decision)=>{

if(decision==="SAFE") return {color:"#22c55e",marginLeft:10}
if(decision==="FLAGGED") return {color:"#f59e0b",marginLeft:10}
if(decision==="BANNED") return {color:"#ef4444",marginLeft:10}

}



const styles={

page:{

background:"#020617",
minHeight:"100vh",
padding:"40px",
color:"white",
fontFamily:"Segoe UI"

},


title:{

color:"#22c55e"

},


card:{

background:"rgba(255,255,255,0.05)",

padding:"30px",

width:"320px",

borderRadius:"12px",

backdropFilter:"blur(10px)"

},


input:{

display:"block",
marginTop:"15px",
padding:"12px",
width:"100%",
borderRadius:"8px",
border:"none",

color:"#000000",
caretColor:"#000000"

},


button:{

marginTop:"15px",

padding:"12px",

width:"100%",

background:"#22c55e",

border:"none",

borderRadius:"8px",

color:"white",

fontWeight:"bold",

cursor:"pointer"

},


riskBarBg:{

height:"12px",

background:"#1e293b",

borderRadius:"10px",

marginTop:"10px"

},


riskBarFill:{

height:"100%",

background:"#ef4444",

borderRadius:"10px"

},


analyticsRow:{

display:"flex",

gap:"20px",

marginTop:"30px"

},


analyticsCard:{

padding:"20px",

borderRadius:"10px",

width:"140px"

},


table:{

marginTop:"20px",

width:"100%",

borderCollapse:"collapse"

}

}



export default App
