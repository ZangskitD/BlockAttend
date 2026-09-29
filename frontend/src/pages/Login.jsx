import { useState } from "react";
import { Navigate } from "react-router-dom";
import { ShieldCheck, LockKeyhole } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login(){
 const {user,login}=useAuth(); const [email,setEmail]=useState("student@blockattend.local");
 const [password,setPassword]=useState("Student@123"); const [error,setError]=useState("");
 if(user) return <Navigate to="/" replace/>;

 async function submit(e){e.preventDefault();setError("");try{await login(email,password)}catch(e){setError(e.response?.data?.message||"Login failed")}}

 return <div className="login-page">
  <div className="login-visual">
    <div className="network-art"><span/><span/><span/><span/><span/></div>
    <div><div className="eyebrow">BLOCKCHAIN ATTENDANCE VERIFICATION</div><h1>Attendance you can <em>prove.</em></h1><p>A hybrid MySQL + Ethereum verification layer that makes attendance history tamper-evident.</p></div>
    <div className="trust-pills"><span>SHA-256</span><span>Immutable proof</span><span>Role-based access</span></div>
  </div>
  <div className="login-card">
    <div className="brand centered"><div className="brand-icon"><ShieldCheck/></div><b>BlockAttend</b></div>
    <h2>Welcome back</h2><p className="muted">Sign in to your verification workspace.</p>
    <form onSubmit={submit}>
      <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email"/></label>
      <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password"/></label>
      {error&&<div className="error">{error}</div>}
      <button className="primary full"><LockKeyhole/> Sign in securely</button>
    </form>
    <div className="demo-box"><b>Demo credentials</b><br/>Student: student@blockattend.local / Student@123<br/>Faculty: faculty@blockattend.local / Faculty@123<br/>Admin: admin@blockattend.local / Admin@123</div>
  </div>
 </div>
}
