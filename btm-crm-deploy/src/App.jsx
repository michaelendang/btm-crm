import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, X, Trash2, Edit3, Sun, Search, MessageCircle, AlertCircle, Clock,
         Users, LayoutGrid, CheckSquare, Download, Upload, RefreshCw, Zap,
         ChevronUp, ChevronDown, Send, TrendingUp, Wifi, WifiOff, Shield,
         LogOut, Eye, EyeOff, History, UserPlus, Briefcase, Lock, Archive,
         RotateCcw, Settings, Check, XCircle, FileText, Copy, Bell } from "lucide-react";

// ════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════
const STAGES = [
  { id:"prospek",   label:"Prospek",          color:"#64748B", weight:0.10 },
  { id:"survei",    label:"Survei Lapangan",   color:"#A78BFA", weight:0.25 },
  { id:"proposal",  label:"Proposal Terkirim", color:"#60A5FA", weight:0.40 },
  { id:"negosiasi", label:"Negosiasi",         color:"#FBBF24", weight:0.65 },
  { id:"po",        label:"PO Diterima",       color:"#34D399", weight:0.90 },
  { id:"menang",    label:"Menang",            color:"#22C55E", weight:1.00 },
  { id:"kalah",     label:"Kalah",             color:"#F87171", weight:0.00 },
];
const PRODUCTS_DEFAULT = ["Mobile Solar Lighting Tower","Mobile CCTV Tower","Visionify AI System"];
const PRI_LIST = ["Tinggi","Sedang","Rendah"];
const PRI = {
  Tinggi:{ text:"#FCA5A5",bg:"#2D1515",border:"#7F1D1D" },
  Sedang:{ text:"#FCD34D",bg:"#2A1F05",border:"#78350F" },
  Rendah:{ text:"#6EE7B7",bg:"#052015",border:"#064E3B" },
};
const WIN_R  = ["Harga kompetitif","Hubungan baik dengan klien","Demo produk sukses","Spesifikasi teknis sesuai","Referensi dari klien lain"];
const LOSS_R = ["Kalah harga dari kompetitor","Anggaran klien dipotong","Proyek ditunda","Tidak ada respons","Kompetitor menang tender"];
const RC = ["#F59E0B","#60A5FA","#A78BFA","#34D399","#F472B6","#FB923C","#A3E635","#38BDF8"];
const ROLES = {
  superadmin:{ label:"Super Admin", color:"#F59E0B", icon:"👑" },
  admin:     { label:"Manager",     color:"#A78BFA", icon:"🔷" },
  user:      { label:"Sales",       color:"#60A5FA", icon:"👤" },
};
const MANDATORY_FIELDS_OPTIONS = [
  { id:"value",           label:"Nilai Deal" },
  { id:"qty",             label:"Jumlah Unit" },
  { id:"proposalLink",    label:"Link Proposal" },
  { id:"nextActionDate",  label:"Tanggal Aksi Berikutnya" },
  { id:"nextAction",      label:"Aksi Berikutnya" },
  { id:"siteLocation",    label:"Lokasi Site" },
  { id:"lastContactedDate",label:"Terakhir Dihubungi" },
];
const DEFAULT_SETTINGS = {
  sessionTimeout: 60,
  approvalThreshold: 500000000,
  lockoutAttempts: 5,
  lockoutDuration: 15,
  mandatoryFields: {
    survei:    [],
    proposal:  ["value","qty"],
    negosiasi: ["value","proposalLink"],
    po:        ["value","proposalLink","nextActionDate"],
    menang:    ["value","winLossReason"],
    kalah:     ["winLossReason"],
  },
};
const DEAL_TEMPLATES = [
  { name:"Solar Lighting Tower — Tambang", product:"Mobile Solar Lighting Tower", qty:5, value:850000000, priority:"Tinggi", nextAction:"Jadwalkan survei lapangan", siteLocation:"" },
  { name:"CCTV Tower — Perimeter Security", product:"Mobile CCTV Tower", qty:2, value:320000000, priority:"Sedang", nextAction:"Kirim spesifikasi teknis", siteLocation:"" },
  { name:"Visionify AI — Safety Monitoring", product:"Visionify AI System", qty:1, value:280000000, priority:"Sedang", nextAction:"Jadwalkan demo on-site", siteLocation:"" },
];
const DEFAULT_TEAM = [
  { id:1, name:"Michael Endang", role:"superadmin", jobTitle:"Director",            pin:"3009", isDefaultPin:false, isArchived:false, target:0 },
  { id:2, name:"Nama Manager",   role:"admin",      jobTitle:"Sales Manager",       pin:"1234", isDefaultPin:true,  isArchived:false, target:5000000000 },
  { id:3, name:"Nama Sales 1",   role:"user",       jobTitle:"Sales Representative",pin:"1234", isDefaultPin:true,  isArchived:false, target:1000000000 },
  { id:4, name:"Nama Sales 2",   role:"user",       jobTitle:"Sales Representative",pin:"1234", isDefaultPin:true,  isArchived:false, target:1000000000 },
  { id:5, name:"Nama Sales 3",   role:"user",       jobTitle:"Sales Representative",pin:"1234", isDefaultPin:true,  isArchived:false, target:1000000000 },
  { id:6, name:"Nama Sales 4",   role:"user",       jobTitle:"Sales Representative",pin:"1234", isDefaultPin:true,  isArchived:false, target:1000000000 },
];
const DEFAULT_PIN    = "1234";
const DEFAULT_URL    = "https://script.google.com/macros/s/AKfycbwqxUagiWnRi8vhfljB1-Vrp01kayQzNeUOenUs16YaIhlVBkc-plQoBzs9ZE17KeTD6g/exec";
const LS_SESSION     = "btm_crm_session_v5";
const LS_LOCKOUT     = "btm_lockout_v5";
const LS_ATTEMPTS    = "btm_attempts_v5";

// ════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════
const fmtIDR    = v => { const n=Number(v); if(!n)return"IDR 0"; if(n>=1e9)return`IDR ${(n/1e9).toFixed(2)}B`; if(n>=1e6)return`IDR ${Math.round(n/1e6)}M`; return`IDR ${n.toLocaleString("id-ID")}`; };
const daysSince = d => d ? Math.floor((Date.now()-new Date(d).getTime())/86400000) : 0;
const fmtDate   = d => d ? new Date(d).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}) : "-";
const fmtDT     = d => d ? new Date(d).toLocaleString("id-ID",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}) : "-";
const today     = () => new Date().toISOString().split("T")[0];
const initials  = n => n ? n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "?";
const repColor  = (n,team) => { const i=(team||[]).findIndex(t=>t.name===n); return RC[i>=0?i%RC.length:0]; };
const stageOf   = id => STAGES.find(s=>s.id===id)||STAGES[0];
const isOD      = d => d ? new Date(d)<new Date(today()) : false;
const ageInfo   = d => { const days=daysSince(d); if(days>30)return{c:"#F87171",bg:"#2D1515",label:`${days}h`}; if(days>14)return{c:"#FBBF24",bg:"#2A1F05",label:`${days}h`}; return{c:"#6EE7B7",bg:"#052015",label:`${days}h`}; };
const hColor    = s => s>=70?"#22C55E":s>=40?"#FBBF24":"#F87171";

// Permissions
const isSA   = r => r==="superadmin";
const isAdm  = r => r==="superadmin"||r==="admin";
const canEdit= (r,deal,name) => isAdm(r)||deal.assignedTo===name;
const canDel = r => isAdm(r);
const needsApproval = (deal,settings,role) => !isAdm(role) && Number(deal.value)>=settings.approvalThreshold;

function health(deal) {
  if(deal.stage==="menang") return 100;
  if(deal.stage==="kalah")  return 0;
  let s=60;
  if(deal.priority==="Tinggi") s+=15; else if(deal.priority==="Rendah") s-=10;
  if(isOD(deal.nextActionDate)) s-=20;
  const dc=daysSince(deal.lastContactedDate); if(dc>30)s-=15; else if(dc>14)s-=8;
  const sa=daysSince(deal.stageEnteredAt);    if(sa>30)s-=15; else if(sa>14)s-=8;
  if(deal.stage==="po") s+=15;
  return Math.max(0,Math.min(100,s));
}

function waMsg(deal) {
  const c=deal.contacts?.[0]?.name||"Bapak/Ibu",r=deal.assignedTo,p=deal.product,site=deal.siteLocation||"lokasi tambang";
  const t={
    prospek:  `Selamat siang, ${c}. Perkenalkan saya ${r} dari BTM Energi Nusantara. Kami spesialis ${p} untuk operasional tambang. Ada waktu 10 menit untuk diskusi?`,
    survei:   `Selamat siang, ${c}. Saya ${r} dari BTM Energi. Ingin konfirmasi jadwal survei lapangan untuk ${p} di ${site}. Kapan waktu yang tepat?`,
    proposal: `Selamat siang, ${c}. Saya ${r} dari BTM Energi. Menindaklanjuti proposal ${p} yang sudah kami kirimkan. Ada yang perlu kami klarifikasi?`,
    negosiasi:`Selamat siang, ${c}. Saya ${r} dari BTM Energi. Melanjutkan diskusi ${p} untuk ${site}. Kami siap menyesuaikan penawaran. Ada waktu hari ini?`,
    po:       `Selamat siang, ${c}. Terima kasih atas kepercayaan kepada BTM Energi. Ingin konfirmasi detail pengiriman ${p} ke ${site}.`,
    menang:   `Selamat siang, ${c}. Terima kasih sudah bermitra dengan BTM Energi. Ingin memastikan semuanya berjalan lancar untuk ${p}.`,
    kalah:    `Selamat siang, ${c}. Saya ${r} dari BTM Energi. Terima kasih atas kesempatan sebelumnya. Semoga ada peluang kerja sama lagi ke depan.`,
  };
  return t[deal.stage]||t.prospek;
}
const waLink  = d => `https://wa.me/${d.contacts?.[0]?.phone||""}?text=${encodeURIComponent(waMsg(d))}`;
const migrate = d => ({...d, contacts:d.contacts||[{name:d.contact||"",role:"Procurement Manager",phone:d.phone||""}], stageHistory:d.stageHistory||[{stage:d.stage,date:d.createdAt||today(),movedBy:d.assignedTo}], versions:d.versions||[], isDeleted:d.isDeleted||false, approvalStatus:d.approvalStatus||null });

// Lockout helpers
const getLockout    = name => { try{ return JSON.parse(localStorage.getItem(LS_LOCKOUT)||"{}")[name]||null; }catch(e){return null;} };
const setLockoutExp = (name,ms) => { try{ const d=JSON.parse(localStorage.getItem(LS_LOCKOUT)||"{}"); d[name]=Date.now()+ms; localStorage.setItem(LS_LOCKOUT,JSON.stringify(d)); }catch(e){} };
const getAttempts   = name => { try{ return JSON.parse(localStorage.getItem(LS_ATTEMPTS)||"{}")[name]||0; }catch(e){return 0;} };
const setAttempts   = (name,n) => { try{ const d=JSON.parse(localStorage.getItem(LS_ATTEMPTS)||"{}"); d[name]=n; localStorage.setItem(LS_ATTEMPTS,JSON.stringify(d)); }catch(e){} };
const clearAttempts = name => { try{ const d=JSON.parse(localStorage.getItem(LS_ATTEMPTS)||"{}"); delete d[name]; localStorage.setItem(LS_ATTEMPTS,JSON.stringify(d)); }catch(e){} };

// API
async function sheetsGet(url) { const res=await fetch(url,{redirect:"follow"}); return res.json(); }
async function sheetsPost(url,data) { await fetch(url,{method:"POST",body:JSON.stringify(data),redirect:"follow"}); }

// Mandatory fields check
function getMissingFields(deal,stage,settings) {
  const required = settings.mandatoryFields?.[stage]||[];
  return required.filter(f => {
    if(f==="winLossReason") return ["menang","kalah"].includes(stage) && !deal[f];
    return !deal[f];
  });
}

// ════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════
const inp = {background:"#0D1120",border:"1px solid #252D42",borderRadius:8,padding:"8px 12px",color:"#CBD5E1",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none"};
const lbl = {fontSize:10,color:"#475569",marginBottom:5,display:"block",letterSpacing:"0.07em",fontWeight:600};
const btn = (bg="#1A2235",tc="#94A3B8",bc="#252D42") => ({background:bg,border:`1px solid ${bc}`,borderRadius:8,padding:"8px 14px",color:tc,cursor:"pointer",fontSize:12,fontWeight:600});
const modal = {position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:16};

// ════════════════════════════════════════════════════════
// PIN INPUT
// ════════════════════════════════════════════════════════
function PinInput({value,onChange,autoFocus=false}) {
  const [show,setShow]=useState(false);
  return (
    <div style={{position:"relative"}}>
      <input type={show?"text":"password"} value={value} onChange={e=>onChange(e.target.value.replace(/\D/g,"").slice(0,4))} style={{...inp,letterSpacing:"0.3em",fontSize:22,textAlign:"center",paddingRight:42}} placeholder="••••" inputMode="numeric" autoFocus={autoFocus} maxLength={4}/>
      <button onClick={()=>setShow(!show)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#374151"}}>{show?<EyeOff size={15}/>:<Eye size={15}/>}</button>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// FORCE PIN CHANGE
// ════════════════════════════════════════════════════════
function ForcePinChange({userName,onComplete}) {
  const [p1,setP1]=useState(""); const [p2,setP2]=useState(""); const [err,setErr]=useState("");
  const submit=()=>{
    if(p1.length<4){setErr("PIN harus 4 digit.");return;}
    if(p1===DEFAULT_PIN){setErr("PIN baru tidak boleh sama dengan PIN default (1234).");return;}
    if(p1!==p2){setErr("Konfirmasi PIN tidak cocok.");return;}
    onComplete(p1);
  };
  return (
    <div style={{...modal,zIndex:1000}}>
      <div style={{background:"#0D1120",border:"1px solid #F59E0B44",borderRadius:20,padding:"32px 28px",width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{width:52,height:52,background:"#F59E0B22",border:"1px solid #F59E0B44",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}><Lock size={24} color="#F59E0B"/></div>
        <div style={{fontSize:16,fontWeight:800,color:"#F1F5F9",marginBottom:6}}>Ganti PIN Anda</div>
        <div style={{fontSize:12,color:"#64748B",lineHeight:1.6,marginBottom:24}}>Halo <strong style={{color:"#F59E0B"}}>{userName}</strong>, ini pertama kali kamu login. Ganti PIN default demi keamanan akun kamu.</div>
        <div style={{marginBottom:12,textAlign:"left"}}><label style={lbl}>PIN BARU (4 DIGIT)</label><PinInput value={p1} onChange={setP1} autoFocus/></div>
        <div style={{marginBottom:16,textAlign:"left"}}><label style={lbl}>KONFIRMASI PIN BARU</label><PinInput value={p2} onChange={setP2}/></div>
        {err&&<div style={{padding:"8px 12px",background:"#2D1515",border:"1px solid #7F1D1D",borderRadius:8,fontSize:12,color:"#FCA5A5",marginBottom:14,textAlign:"left"}}>{err}</div>}
        <div style={{padding:"10px 14px",background:"#080D18",border:"1px solid #1A2235",borderRadius:8,marginBottom:16,textAlign:"left",fontSize:10,color:"#374151"}}>
          ✓ 4 digit angka &nbsp;·&nbsp; ✓ Tidak boleh 1234 &nbsp;·&nbsp; ✓ Jangan bagikan ke siapapun
        </div>
        <button onClick={submit} disabled={p1.length<4||p2.length<4} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),width:"100%",padding:"12px",fontSize:14,fontWeight:700,opacity:(p1.length<4||p2.length<4)?0.5:1}}>Simpan PIN & Masuk →</button>
        <div style={{marginTop:10,fontSize:10,color:"#1E2A40"}}>Modal ini tidak bisa di-skip.</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// LOGIN SCREEN
// ════════════════════════════════════════════════════════
function LoginScreen({team,settings,onLogin,onPinChanged}) {
  const [name,setName]=useState(""); const [pin,setPin]=useState(""); const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false); const [forceChange,setForceChange]=useState(null);
  const activeTeam = team.filter(t=>!t.isArchived);

  const submit=()=>{
    if(!name){setErr("Pilih nama dulu.");return;}
    if(pin.length<4){setErr("Masukkan PIN 4 digit.");return;}
    setLoading(true); setErr("");
    setTimeout(()=>{
      // Check lockout
      const lockUntil=getLockout(name);
      if(lockUntil&&Date.now()<lockUntil){ const mins=Math.ceil((lockUntil-Date.now())/60000); setErr(`Akun terkunci. Coba lagi dalam ${mins} menit.`); setLoading(false); return; }
      const member=team.find(t=>t.name===name&&!t.isArchived);
      if(!member){setErr("Nama tidak ditemukan.");setLoading(false);return;}
      if(member.pin!==pin){
        const attempts=getAttempts(name)+1;
        setAttempts(name,attempts);
        const max=settings.lockoutAttempts||5;
        if(attempts>=max){
          const dur=(settings.lockoutDuration||15)*60*1000;
          setLockoutExp(name,dur);
          setAttempts(name,0);
          setErr(`Terlalu banyak percobaan. Akun terkunci ${settings.lockoutDuration||15} menit.`);
        } else {
          setErr(`PIN salah. ${max-attempts} percobaan tersisa.`);
        }
        setPin(""); setLoading(false); return;
      }
      clearAttempts(name);
      if(member.isDefaultPin){setForceChange(member);setLoading(false);return;}
      onLogin(member); setLoading(false);
    },400);
  };

  const handleForceComplete=newPin=>{
    onPinChanged(forceChange,newPin);
    onLogin({...forceChange,pin:newPin,isDefaultPin:false});
    setForceChange(null);
  };

  const roleInfo=name?ROLES[team.find(t=>t.name===name)?.role||"user"]:null;

  return (
    <>
      {forceChange&&<ForcePinChange userName={forceChange.name} onComplete={handleForceComplete}/>}
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#070A12",padding:20}}>
        <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:20,padding:"32px 28px",width:"100%",maxWidth:380,textAlign:"center"}}>
          <div style={{width:52,height:52,background:"linear-gradient(135deg,#F59E0B,#D97706)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}><Sun size={26} color="#0A0D18"/></div>
          <div style={{fontSize:17,fontWeight:800,color:"#F1F5F9",marginBottom:3}}>BTM Energi Nusantara</div>
          <div style={{fontSize:10,color:"#374151",fontWeight:600,letterSpacing:"0.07em",marginBottom:26}}>SISTEM CRM PENJUALAN</div>
          <div style={{marginBottom:14,textAlign:"left"}}>
            <label style={lbl}>NAMA KAMU</label>
            <select value={name} onChange={e=>{setName(e.target.value);setPin("");setErr("");}} style={{...inp,fontSize:13}}>
              <option value="">-- Pilih nama --</option>
              {activeTeam.map(t=><option key={t.id} value={t.name}>{t.name} — {ROLES[t.role]?.icon} {ROLES[t.role]?.label}</option>)}
            </select>
          </div>
          {name&&roleInfo&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#080D18",border:`1px solid ${roleInfo.color}33`,borderRadius:8,marginBottom:14,textAlign:"left"}}><span style={{fontSize:14}}>{roleInfo.icon}</span><div><div style={{fontSize:11,fontWeight:700,color:roleInfo.color}}>{roleInfo.label}</div><div style={{fontSize:10,color:"#374151"}}>{team.find(t=>t.name===name)?.jobTitle}</div></div></div>}
          <div style={{marginBottom:16,textAlign:"left"}}><label style={lbl}>PIN (4 DIGIT)</label><PinInput value={pin} onChange={v=>{setPin(v);setErr("");}} autoFocus={!!name}/></div>
          {err&&<div style={{padding:"8px 12px",background:"#2D1515",border:"1px solid #7F1D1D",borderRadius:8,fontSize:12,color:"#FCA5A5",marginBottom:12,textAlign:"left"}}>{err}</div>}
          <button onClick={submit} disabled={!name||pin.length<4||loading} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),width:"100%",padding:"12px",fontSize:14,fontWeight:700,opacity:(!name||pin.length<4||loading)?0.5:1}}>{loading?"Memeriksa...":"Masuk →"}</button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════
// CHANGE OWN PIN
// ════════════════════════════════════════════════════════
function ChangeOwnPin({member,onSave,onClose}) {
  const [old,setOld]=useState(""); const [p1,setP1]=useState(""); const [p2,setP2]=useState(""); const [err,setErr]=useState("");
  const submit=()=>{
    if(old!==member.pin){setErr("PIN lama salah.");return;}
    if(p1.length<4){setErr("PIN baru harus 4 digit.");return;}
    if(p1===DEFAULT_PIN){setErr("PIN baru tidak boleh 1234.");return;}
    if(p1!==p2){setErr("Konfirmasi PIN tidak cocok.");return;}
    onSave(p1);
  };
  return (
    <div style={modal}>
      <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:16,padding:"24px",width:"100%",maxWidth:360}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{display:"flex",alignItems:"center",gap:9}}><Lock size={16} color="#F59E0B"/><span style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>Ganti PIN Saya</span></div><button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#374151"}}><X size={14}/></button></div>
        <div style={{marginBottom:12}}><label style={lbl}>PIN LAMA</label><PinInput value={old} onChange={setOld} autoFocus/></div>
        <div style={{marginBottom:12}}><label style={lbl}>PIN BARU</label><PinInput value={p1} onChange={setP1}/></div>
        <div style={{marginBottom:16}}><label style={lbl}>KONFIRMASI PIN BARU</label><PinInput value={p2} onChange={setP2}/></div>
        {err&&<div style={{padding:"8px 12px",background:"#2D1515",border:"1px solid #7F1D1D",borderRadius:8,fontSize:12,color:"#FCA5A5",marginBottom:12}}>{err}</div>}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={onClose} style={btn()}>Batal</button><button onClick={submit} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),fontWeight:700}}>Simpan PIN</button></div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SUPER ADMIN SETTINGS
// ════════════════════════════════════════════════════════
function SuperAdminSettings({settings,setSettings,auditLog,setAuditLog,onClose}) {
  const [local,setLocal]=useState({...settings});
  const [logConfirm,setLogConfirm]=useState(false);
  const [logPeriod,setLogPeriod]=useState("all");
  const save=()=>{setSettings(local);onClose();};
  const toggleMandatory=(stage,field)=>{
    setLocal(p=>{
      const cur=p.mandatoryFields?.[stage]||[];
      const next=cur.includes(field)?cur.filter(f=>f!==field):[...cur,field];
      return{...p,mandatoryFields:{...p.mandatoryFields,[stage]:next}};
    });
  };
  const deleteLog=()=>{
    if(logPeriod==="all") setAuditLog([]);
    else {
      const days=logPeriod==="30"?30:7;
      const cutoff=Date.now()-days*86400000;
      setAuditLog(p=>p.filter(l=>new Date(l.timestamp).getTime()>cutoff));
    }
    setLogConfirm(false);
  };
  return (
    <div style={modal}>
      <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:18,width:"100%",maxWidth:600,maxHeight:"92vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #151D30",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><Settings size={16} color="#F59E0B"/><div><div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>Super Admin Settings</div><div style={{fontSize:10,color:"#374151"}}>Konfigurasi sistem CRM</div></div></div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#374151"}}><X size={16}/></button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"18px 20px",display:"flex",flexDirection:"column",gap:20}}>

          {/* Session & Security */}
          <div style={{background:"#080D18",border:"1px solid #1A2235",borderRadius:12,padding:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#F59E0B",marginBottom:14,display:"flex",alignItems:"center",gap:6}}><Shield size={13}/>Keamanan</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={lbl}>SESSION TIMEOUT (MENIT)</label><input type="number" value={local.sessionTimeout} onChange={e=>setLocal(p=>({...p,sessionTimeout:Number(e.target.value)}))} style={inp} min={5} max={480}/></div>
              <div><label style={lbl}>LOCKOUT SETELAH (PERCOBAAN)</label><input type="number" value={local.lockoutAttempts} onChange={e=>setLocal(p=>({...p,lockoutAttempts:Number(e.target.value)}))} style={inp} min={3} max={10}/></div>
              <div><label style={lbl}>DURASI LOCKOUT (MENIT)</label><input type="number" value={local.lockoutDuration} onChange={e=>setLocal(p=>({...p,lockoutDuration:Number(e.target.value)}))} style={inp} min={5} max={60}/></div>
              <div><label style={lbl}>APPROVAL THRESHOLD (IDR)</label><input type="number" value={local.approvalThreshold} onChange={e=>setLocal(p=>({...p,approvalThreshold:Number(e.target.value)}))} style={inp} placeholder="500000000"/></div>
            </div>
            <div style={{marginTop:10,padding:"8px 10px",background:"#0D1120",borderRadius:8,fontSize:10,color:"#374151"}}>Approval threshold: deal di atas <strong style={{color:"#F59E0B"}}>{fmtIDR(local.approvalThreshold)}</strong> butuh persetujuan Admin atau Super Admin sebelum maju stage.</div>
          </div>

          {/* Mandatory Fields */}
          <div style={{background:"#080D18",border:"1px solid #1A2235",borderRadius:12,padding:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#60A5FA",marginBottom:14,display:"flex",alignItems:"center",gap:6}}><CheckSquare size={13}/>Field Wajib Per Stage</div>
            <div style={{fontSize:10,color:"#374151",marginBottom:12}}>Centang field yang wajib diisi sebelum deal bisa masuk ke stage tersebut.</div>
            {STAGES.filter(s=>!["prospek","menang","kalah"].includes(s.id)).map(stage=>(
              <div key={stage.id} style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,marginBottom:8,display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:stage.color}}/><span style={{color:stage.color}}>{stage.label}</span></div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {MANDATORY_FIELDS_OPTIONS.map(f=>{
                    const checked=(local.mandatoryFields?.[stage.id]||[]).includes(f.id);
                    return <button key={f.id} onClick={()=>toggleMandatory(stage.id,f.id)} style={{background:checked?stage.color+"22":"#0D1120",border:`1px solid ${checked?stage.color:"#252D42"}`,borderRadius:6,padding:"4px 10px",fontSize:10,color:checked?stage.color:"#475569",cursor:"pointer",fontWeight:checked?700:400}}>{checked?"✓ ":""}{f.label}</button>;
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Audit Log Management */}
          <div style={{background:"#080D18",border:"1px solid #1A2235",borderRadius:12,padding:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#F87171",marginBottom:14,display:"flex",alignItems:"center",gap:6}}><History size={13}/>Manajemen Audit Log</div>
            <div style={{fontSize:12,color:"#94A3B8",marginBottom:12}}>Total log: <strong style={{color:"#F1F5F9"}}>{auditLog.length}</strong> entri</div>
            {!logConfirm?<>
              <div style={{marginBottom:10}}><label style={lbl}>HAPUS LOG</label><select value={logPeriod} onChange={e=>setLogPeriod(e.target.value)} style={inp}><option value="7">7 hari terakhir</option><option value="30">30 hari terakhir</option><option value="all">Semua log</option></select></div>
              <button onClick={()=>setLogConfirm(true)} style={{...btn("#200D0D","#F87171","#3B1111"),display:"flex",alignItems:"center",gap:6}}><Trash2 size={12}/>Hapus Log</button>
            </>:<div style={{padding:"12px 14px",background:"#2D1515",border:"1px solid #7F1D1D",borderRadius:8}}>
              <div style={{fontSize:12,color:"#FCA5A5",marginBottom:10}}>⚠ Yakin ingin hapus {logPeriod==="all"?"semua":"log "+logPeriod+" hari terakhir"}? Tindakan ini tidak bisa dibatalkan.</div>
              <div style={{display:"flex",gap:8}}><button onClick={()=>setLogConfirm(false)} style={btn()}>Batal</button><button onClick={deleteLog} style={{...btn("#F87171","#fff","#F87171"),fontWeight:700}}>Ya, Hapus</button></div>
            </div>}
          </div>
        </div>
        <div style={{padding:"14px 20px",borderTop:"1px solid #151D30",display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={btn()}>Batal</button>
          <button onClick={save} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),fontWeight:700}}>Simpan Settings</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// ADMIN TOOLS (Team + Products)
// ════════════════════════════════════════════════════════
function AdminTools({team,setTeam,products,setProducts,auditLog,deals,currentUser,onClose}) {
  const [tab,setTab]=useState("team");
  const [editMember,setEditMember]=useState(null);
  const [nm,setNm]=useState({name:"",role:"user",jobTitle:"Sales Representative",target:1000000000});
  const [np,setNp]=useState("");
  const [archiveTarget,setArchiveTarget]=useState(null);
  const [reassignTo,setReassignTo]=useState("");
  const [resetTarget,setResetTarget]=useState(null);
  const [resetPin,setResetPin]=useState(""); const [resetMsg,setResetMsg]=useState("");
  const role=currentUser.role;
  const activeTeam=team.filter(t=>!t.isArchived);
  const archivedTeam=team.filter(t=>t.isArchived);

  const addMember=()=>{
    if(!nm.name.trim()) return;
    const newRole=!isSA(role)?"user":nm.role;
    setTeam(p=>[...p,{...nm,role:newRole,id:Date.now(),pin:DEFAULT_PIN,isDefaultPin:true,isArchived:false,target:nm.target}]);
    setNm({name:"",role:"user",jobTitle:"Sales Representative",target:1000000000});
  };
  const saveEdit=()=>{
    if(!editMember) return;
    setTeam(p=>p.map(t=>t.id===editMember.id?{...t,...editMember}:t));
    setEditMember(null);
  };
  const doArchive=()=>{
    if(!archiveTarget) return;
    // Reassign all active deals
    if(reassignTo) {
      // This triggers a deal update in parent — we use a callback via setTeam side effect
    }
    setTeam(p=>p.map(t=>t.id===archiveTarget.id?{...t,isArchived:true,archivedAt:today()}:t));
    setArchiveTarget(null); setReassignTo("");
  };
  const reactivate=id=>setTeam(p=>p.map(t=>t.id===id?{...t,isArchived:false,archivedAt:null}:t));
  const doResetPin=()=>{
    if(resetPin.length<4){setResetMsg("PIN harus 4 digit.");return;}
    setTeam(p=>p.map(t=>t.id===resetTarget.id?{...t,pin:resetPin,isDefaultPin:false}:t));
    setResetTarget(null);setResetPin("");setResetMsg("");
  };
  const addProd=()=>{if(!np.trim())return;setProducts(p=>[...p,np.trim()]);setNp("");};
  const delProd=i=>{if(window.confirm("Hapus produk ini?"))setProducts(p=>p.filter((_,j)=>j!==i));};

  const canManageRole=(targetRole)=> isSA(role)||(role==="admin"&&targetRole==="user");
  const canEditMember=(m)=> m.role!=="superadmin"&&canManageRole(m.role);

  const TABS=[{id:"team",label:"Tim Aktif",icon:Users},{id:"archived",label:"Diarsipkan",icon:Archive},{id:"products",label:"Produk",icon:Briefcase}];

  const MemberCard=({m,i})=>(
    <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"11px 13px",background:"#080D18",border:`1px solid ${RC[i%RC.length]}22`,borderRadius:10}}>
      <div style={{width:34,height:34,borderRadius:"50%",background:RC[i%RC.length]+"22",border:`1px solid ${RC[i%RC.length]}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:RC[i%RC.length],flexShrink:0}}>{initials(m.name)}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
          <span style={{fontSize:12,fontWeight:700,color:"#E2E8F0"}}>{m.name}</span>
          <span style={{background:ROLES[m.role]?.color+"22",color:ROLES[m.role]?.color,borderRadius:4,padding:"1px 6px",fontSize:9,fontWeight:700}}>{ROLES[m.role]?.icon} {ROLES[m.role]?.label}</span>
          {m.isDefaultPin&&<span style={{background:"#FBBF2422",color:"#FBBF24",borderRadius:4,padding:"1px 6px",fontSize:9,fontWeight:700}}>⚠ PIN Default</span>}
        </div>
        <div style={{fontSize:10,color:"#374151"}}>{m.jobTitle} · Target: {fmtIDR(m.target)} · {deals.filter(d=>d.assignedTo===m.name&&!["menang","kalah"].includes(d.stage)&&!d.isDeleted).length} deal aktif</div>
      </div>
      {canEditMember(m)&&<div style={{display:"flex",gap:5,flexShrink:0}}>
        <button onClick={()=>setEditMember({...m})} style={{...btn(),padding:"4px 8px",fontSize:10,display:"flex",alignItems:"center",gap:3}}><Edit3 size={10}/>Edit</button>
        {canManageRole(m.role)&&<button onClick={()=>setResetTarget(m)} style={{...btn("#0D1120","#60A5FA","#60A5FA44"),padding:"4px 8px",fontSize:10,display:"flex",alignItems:"center",gap:3}}><Lock size={10}/>PIN</button>}
        {canManageRole(m.role)&&<button onClick={()=>{setArchiveTarget(m);setReassignTo("");}} style={{...btn("#1A1A0A","#FBBF24","#78350F"),padding:"4px 8px",fontSize:10,display:"flex",alignItems:"center",gap:3}}><Archive size={10}/>Arsip</button>}
      </div>}
    </div>
  );

  return (
    <div style={modal}>
      <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:18,width:"100%",maxWidth:600,maxHeight:"92vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #151D30",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:30,height:30,background:"#F59E0B22",border:"1px solid #F59E0B44",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}><Shield size={14} color="#F59E0B"/></div><div><div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>Admin Tools</div><div style={{fontSize:10,color:"#374151"}}>Kelola tim dan produk</div></div></div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#374151"}}><X size={16}/></button>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid #151D30",paddingLeft:16}}>
          {TABS.map(t=>{const I=t.icon;const a=tab===t.id;return <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",borderBottom:a?"2px solid #F59E0B":"2px solid transparent",padding:"9px 14px",color:a?"#F59E0B":"#374151",cursor:"pointer",fontSize:11,fontWeight:a?700:400,display:"flex",alignItems:"center",gap:5,marginBottom:-1}}><I size={12}/>{t.label}</button>;})}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"18px 20px"}}>

          {/* Edit member inline */}
          {editMember&&<div style={{background:"#080D18",border:"1px solid #F59E0B44",borderRadius:12,padding:14,marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:"#F59E0B",marginBottom:12}}>Edit: {editMember.name}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div><label style={lbl}>NAMA</label><input value={editMember.name} onChange={e=>setEditMember(p=>({...p,name:e.target.value}))} style={inp}/></div>
              <div><label style={lbl}>JABATAN</label><input value={editMember.jobTitle} onChange={e=>setEditMember(p=>({...p,jobTitle:e.target.value}))} style={inp}/></div>
              {isSA(role)&&editMember.role!=="superadmin"&&<div><label style={lbl}>LEVEL AKSES</label><select value={editMember.role} onChange={e=>setEditMember(p=>({...p,role:e.target.value}))} style={inp}><option value="user">Sales (User)</option><option value="admin">Manager (Admin)</option></select></div>}
              <div><label style={lbl}>TARGET BULANAN (IDR)</label><input type="number" value={editMember.target} onChange={e=>setEditMember(p=>({...p,target:Number(e.target.value)}))} style={inp}/></div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setEditMember(null)} style={btn()}>Batal</button><button onClick={saveEdit} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),fontWeight:700}}>Simpan</button></div>
          </div>}

          {/* Reset PIN inline */}
          {resetTarget&&<div style={{background:"#080D18",border:"1px solid #60A5FA33",borderRadius:12,padding:14,marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:"#60A5FA",marginBottom:10}}>Reset PIN untuk {resetTarget.name}</div>
            <div style={{marginBottom:10}}><label style={lbl}>PIN BARU (4 DIGIT)</label><PinInput value={resetPin} onChange={setResetPin} autoFocus/></div>
            {resetMsg&&<div style={{fontSize:11,color:"#FCA5A5",marginBottom:8}}>{resetMsg}</div>}
            <div style={{display:"flex",gap:8}}><button onClick={()=>{setResetTarget(null);setResetPin("");}} style={btn()}>Batal</button><button onClick={doResetPin} disabled={resetPin.length<4} style={{...btn("#60A5FA","#0A0C14","#60A5FA"),fontWeight:700,opacity:resetPin.length<4?0.5:1}}>Simpan PIN</button></div>
          </div>}

          {/* Archive + Reassign modal */}
          {archiveTarget&&<div style={{background:"#080D18",border:"1px solid #FBBF2444",borderRadius:12,padding:14,marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:"#FBBF24",marginBottom:8}}>Arsipkan {archiveTarget.name}</div>
            <div style={{fontSize:11,color:"#64748B",marginBottom:12}}>Pilih siapa yang akan menerima semua deal aktif dari {archiveTarget.name}:</div>
            <div style={{marginBottom:12}}><label style={lbl}>PINDAHKAN DEAL AKTIF KE</label>
              <select value={reassignTo} onChange={e=>setReassignTo(e.target.value)} style={inp}>
                <option value="">-- Pilih sales --</option>
                {activeTeam.filter(t=>t.id!==archiveTarget.id).map(t=><option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            {!reassignTo&&<div style={{fontSize:10,color:"#F87171",marginBottom:10}}>⚠ Pilih siapa yang terima deal aktif, atau deal akan tetap atas nama yang diarsipkan.</div>}
            <div style={{display:"flex",gap:8}}><button onClick={()=>setArchiveTarget(null)} style={btn()}>Batal</button><button onClick={doArchive} style={{...btn("#1A1A0A","#FBBF24","#78350F"),fontWeight:700}}>Arsipkan</button></div>
          </div>}

          {tab==="team"&&<>
            <div style={{fontSize:10,color:"#374151",fontWeight:700,letterSpacing:"0.07em",marginBottom:11}}>TIM AKTIF ({activeTeam.length} orang)</div>
            <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:20}}>{activeTeam.map((m,i)=><MemberCard key={m.id} m={m} i={i}/>)}</div>
            <div style={{fontSize:10,color:"#374151",fontWeight:700,letterSpacing:"0.07em",marginBottom:10}}>TAMBAH ANGGOTA BARU</div>
            <div style={{background:"#080D18",border:"1px solid #1A2235",borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={lbl}>NAMA LENGKAP</label><input value={nm.name} onChange={e=>setNm(p=>({...p,name:e.target.value}))} style={inp} placeholder="Nama Lengkap"/></div>
                <div><label style={lbl}>JABATAN</label><input value={nm.jobTitle} onChange={e=>setNm(p=>({...p,jobTitle:e.target.value}))} style={inp} placeholder="Sales Representative"/></div>
                {isSA(role)&&<div><label style={lbl}>LEVEL AKSES</label><select value={nm.role} onChange={e=>setNm(p=>({...p,role:e.target.value}))} style={inp}><option value="user">Sales (User)</option><option value="admin">Manager (Admin)</option></select></div>}
                <div><label style={lbl}>TARGET BULANAN (IDR)</label><input type="number" value={nm.target} onChange={e=>setNm(p=>({...p,target:Number(e.target.value)}))} style={inp}/></div>
              </div>
              <div style={{padding:"8px 10px",background:"#0D1120",borderRadius:7,fontSize:10,color:"#374151"}}>📌 PIN default: <strong style={{color:"#FBBF24"}}>1234</strong> — wajib diganti saat pertama login.</div>
              <button onClick={addMember} disabled={!nm.name.trim()} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),fontWeight:700,display:"flex",alignItems:"center",gap:6,justifyContent:"center",opacity:nm.name.trim()?1:0.5}}><UserPlus size={13}/>Tambah Anggota</button>
            </div>
          </>}

          {tab==="archived"&&<>
            <div style={{fontSize:10,color:"#374151",fontWeight:700,letterSpacing:"0.07em",marginBottom:11}}>ANGGOTA DIARSIPKAN ({archivedTeam.length})</div>
            {archivedTeam.length===0&&<div style={{fontSize:12,color:"#1E2A40",textAlign:"center",padding:24}}>Belum ada anggota yang diarsipkan.</div>}
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {archivedTeam.map((m,i)=>(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 13px",background:"#080D18",border:"1px solid #1A2235",borderRadius:10,opacity:0.7}}>
                  <div style={{width:34,height:34,borderRadius:"50%",background:"#1A2235",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#374151",flexShrink:0}}>{initials(m.name)}</div>
                  <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"#475569"}}>{m.name}</div><div style={{fontSize:10,color:"#374151"}}>{m.jobTitle} · Diarsipkan {fmtDate(m.archivedAt)}</div></div>
                  {isSA(role)&&<button onClick={()=>reactivate(m.id)} style={{...btn("#052015","#6EE7B7","#064E3B"),padding:"4px 9px",fontSize:10,display:"flex",alignItems:"center",gap:4}}><RotateCcw size={10}/>Aktifkan</button>}
                </div>
              ))}
            </div>
          </>}

          {tab==="products"&&isSA(role)&&<>
            <div style={{fontSize:10,color:"#374151",fontWeight:700,letterSpacing:"0.07em",marginBottom:11}}>PRODUK AKTIF</div>
            <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:20}}>
              {products.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#080D18",border:"1px solid #1A2235",borderRadius:9}}><div style={{flex:1,fontSize:12,color:"#E2E8F0"}}>{p}</div><button onClick={()=>delProd(i)} style={{...btn("#200D0D","#F87171","#3B1111"),padding:"5px 7px"}}><Trash2 size={11}/></button></div>))}
            </div>
            <div style={{display:"flex",gap:8}}><input value={np} onChange={e=>setNp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addProd()} style={{...inp,flex:1}} placeholder="Nama produk baru"/><button onClick={addProd} disabled={!np.trim()} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),fontWeight:700,opacity:np.trim()?1:0.5}}><Plus size={13}/></button></div>
          </>}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// RECYCLE BIN
// ════════════════════════════════════════════════════════
function RecycleBin({deals,onRestore,onPermanentDelete,onClose}) {
  const deleted=deals.filter(d=>d.isDeleted).sort((a,b)=>b.deletedAt?.localeCompare(a.deletedAt||"")||0);
  return (
    <div style={modal}>
      <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:18,width:"100%",maxWidth:560,maxHeight:"88vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #151D30",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><Trash2 size={16} color="#F87171"/><div><div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>Recycle Bin</div><div style={{fontSize:10,color:"#374151"}}>{deleted.length} deal dihapus</div></div></div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#374151"}}><X size={16}/></button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:8}}>
          {deleted.length===0&&<div style={{fontSize:13,color:"#1E2A40",textAlign:"center",padding:32}}>Recycle bin kosong ✓</div>}
          {deleted.map(deal=>(
            <div key={deal.id} style={{background:"#080D18",border:"1px solid #1A2235",borderRadius:10,padding:"12px 14px",display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"#475569",marginBottom:3}}>{deal.company}</div>
                <div style={{fontSize:11,color:"#374151",marginBottom:3}}>{deal.product} · {fmtIDR(deal.value)} · {deal.assignedTo}</div>
                <div style={{fontSize:10,color:"#374151"}}>Dihapus: {fmtDT(deal.deletedAt)}</div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>onRestore(deal.id)} style={{...btn("#052015","#6EE7B7","#064E3B"),padding:"5px 9px",fontSize:10,display:"flex",alignItems:"center",gap:4}}><RotateCcw size={11}/>Restore</button>
                <button onClick={()=>{if(window.confirm("Hapus permanen? Tidak bisa di-restore."))onPermanentDelete(deal.id);}} style={{...btn("#200D0D","#F87171","#3B1111"),padding:"5px 7px"}}><Trash2 size={11}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// APPROVAL PANEL
// ════════════════════════════════════════════════════════
function ApprovalPanel({deals,onApprove,onReject,onClose,currentUser}) {
  const pending=deals.filter(d=>d.approvalStatus==="pending"&&!d.isDeleted);
  return (
    <div style={modal}>
      <div style={{background:"#0D1120",border:"1px solid #FBBF2444",borderRadius:18,width:"100%",maxWidth:560,maxHeight:"88vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #151D30",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><Bell size={16} color="#FBBF24"/><div><div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>Approval Deals</div><div style={{fontSize:10,color:"#374151"}}>{pending.length} deal menunggu persetujuan</div></div></div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#374151"}}><X size={16}/></button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:8}}>
          {pending.length===0&&<div style={{fontSize:13,color:"#1E2A40",textAlign:"center",padding:32}}>Tidak ada deal yang menunggu approval ✓</div>}
          {pending.map(deal=>{
            const toStage=stageOf(deal.pendingStage||deal.stage);
            return (
              <div key={deal.id} style={{background:"#080D18",border:"1px solid #FBBF2433",borderRadius:10,padding:"14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div><div style={{fontSize:13,fontWeight:700,color:"#E2E8F0",marginBottom:3}}>{deal.company}</div><div style={{fontSize:11,color:"#374151"}}>{deal.product} · {deal.assignedTo}</div></div>
                  <div style={{fontSize:14,fontWeight:800,color:"#F59E0B"}}>{fmtIDR(deal.value)}</div>
                </div>
                <div style={{padding:"8px 10px",background:"#0D1120",borderRadius:7,marginBottom:10,fontSize:11,color:"#94A3B8"}}>
                  Request pindah ke: <span style={{color:toStage.color,fontWeight:700}}>{toStage.label}</span><br/>
                  <span style={{fontSize:10,color:"#374151"}}>Oleh: {deal.approvalRequestedBy} · {fmtDT(deal.approvalRequestedAt)}</span>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>onReject(deal.id)} style={{...btn("#200D0D","#F87171","#3B1111"),flex:1,display:"flex",alignItems:"center",gap:5,justifyContent:"center"}}><XCircle size={13}/>Tolak</button>
                  <button onClick={()=>onApprove(deal.id)} style={{...btn("#052015","#6EE7B7","#064E3B"),flex:1,display:"flex",alignItems:"center",gap:5,justifyContent:"center"}}><Check size={13}/>Setuju</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// DEAL FORM
// ════════════════════════════════════════════════════════
function DealForm({form,setForm,onSave,onCancel,saveLabel="Simpan",quickMode=false,setQuickMode,team,products,deals=[],editingId=null}) {
  const [showTemplates,setShowTemplates]=useState(false);
  const [dupWarning,setDupWarning]=useState(null);
  const isClose=form.stage==="menang"||form.stage==="kalah";

  // Duplicate detection
  useEffect(()=>{
    if(!form.company||!form.product) return;
    const dup=deals.find(d=>!d.isDeleted&&d.id!==editingId&&d.company?.toLowerCase()===form.company?.toLowerCase()&&d.product===form.product&&!["menang","kalah"].includes(d.stage));
    setDupWarning(dup||null);
  },[form.company,form.product]);

  const applyTemplate=t=>{setForm(p=>({...p,...t,contacts:p.contacts}));setShowTemplates(false);};
  const fi=(label,key,extra)=>(<div style={{marginBottom:11}}><label style={lbl}>{label}</label>{extra?.opts?<select value={form[key]||""} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={inp}>{extra.opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select>:<input type={extra?.type||"text"} value={form[key]||""} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={inp} placeholder={extra?.ph}/>}</div>);
  const setPrimPhone=v=>setForm(p=>({...p,contacts:(p.contacts||[{name:"",role:"Procurement Manager",phone:""}]).map((c,i)=>i===0?{...c,phone:v}:c)}));
  const setPrimName=v=>setForm(p=>({...p,contacts:(p.contacts||[{name:"",role:"Procurement Manager",phone:""}]).map((c,i)=>i===0?{...c,name:v}:c)}));

  return (
    <div>
      {/* Templates */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {setQuickMode&&<div style={{display:"flex",alignItems:"center",gap:8,flex:1,padding:"8px 10px",background:"#080D18",borderRadius:8}}><Zap size={12} color="#FBBF24"/><span style={{fontSize:11,color:"#64748B",flex:1}}>Mode cepat</span><button onClick={()=>setQuickMode(!quickMode)} style={{background:quickMode?"#F59E0B22":"#1A2235",border:`1px solid ${quickMode?"#F59E0B":"#252D42"}`,borderRadius:6,padding:"3px 10px",fontSize:10,color:quickMode?"#F59E0B":"#64748B",cursor:"pointer",fontWeight:700}}>{quickMode?"AKTIF":"OFF"}</button></div>}
        <button onClick={()=>setShowTemplates(!showTemplates)} style={{...btn(),padding:"8px 12px",display:"flex",alignItems:"center",gap:5,fontSize:11}}><FileText size={12}/>Template</button>
      </div>

      {showTemplates&&<div style={{background:"#080D18",border:"1px solid #1A2235",borderRadius:10,padding:12,marginBottom:14}}>
        <div style={{fontSize:10,color:"#374151",fontWeight:700,marginBottom:8}}>PILIH TEMPLATE</div>
        {DEAL_TEMPLATES.map((t,i)=>(<button key={i} onClick={()=>applyTemplate(t)} style={{display:"block",width:"100%",textAlign:"left",background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,padding:"8px 12px",marginBottom:6,cursor:"pointer"}}><div style={{fontSize:12,color:"#E2E8F0",fontWeight:600}}>{t.name}</div><div style={{fontSize:10,color:"#374151"}}>{fmtIDR(t.value)} · {t.qty} unit · {t.priority}</div></button>))}
      </div>}

      {dupWarning&&<div style={{padding:"10px 12px",background:"#2A1F05",border:"1px solid #78350F",borderRadius:8,marginBottom:14,fontSize:11,color:"#FCD34D"}}>⚠ <strong>{dupWarning.company}</strong> sudah punya deal aktif untuk <strong>{dupWarning.product}</strong> (ditangani {dupWarning.assignedTo}, stage: {stageOf(dupWarning.stage).label}). Yakin ingin tambah lagi?</div>}

      {fi("NAMA PERUSAHAAN","company",{ph:"PT. Nama Perusahaan"})}
      <div style={{marginBottom:11}}><label style={lbl}>KONTAK UTAMA</label><input value={form.contacts?.[0]?.name||""} onChange={e=>setPrimName(e.target.value)} style={{...inp,marginBottom:6}} placeholder="Nama lengkap"/><input value={form.contacts?.[0]?.phone||""} onChange={e=>setPrimPhone(e.target.value)} style={inp} placeholder="628xxxxxxxxxx"/></div>
      {fi("PRODUK","product",{opts:products})}
      {fi("DITANGANI OLEH","assignedTo",{opts:team.filter(t=>!t.isArchived).map(t=>t.name)})}
      {!quickMode&&<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:11}}><div><label style={lbl}>JUMLAH UNIT</label><input type="number" value={form.qty||1} onChange={e=>setForm(p=>({...p,qty:e.target.value}))} style={inp} min={1}/></div><div><label style={lbl}>NILAI DEAL (IDR)</label><input type="number" value={form.value||""} onChange={e=>setForm(p=>({...p,value:e.target.value}))} style={inp} placeholder="500000000"/></div></div>
        {fi("STAGE","stage",{opts:STAGES.map(s=>({v:s.id,l:s.label}))})}
        {isClose&&fi(form.stage==="menang"?"ALASAN MENANG":"ALASAN KALAH","winLossReason",{opts:form.stage==="menang"?WIN_R:LOSS_R})}
        {fi("PRIORITAS","priority",{opts:PRI_LIST})}
        {fi("LOKASI TAMBANG / PROYEK","siteLocation",{ph:"Tambang Batu Bara, Kalimantan Timur"})}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:11}}><div><label style={lbl}>TGL AKSI BERIKUTNYA</label><input type="date" value={form.nextActionDate||""} onChange={e=>setForm(p=>({...p,nextActionDate:e.target.value}))} style={inp}/></div><div><label style={lbl}>TERAKHIR DIHUBUNGI</label><input type="date" value={form.lastContactedDate||""} onChange={e=>setForm(p=>({...p,lastContactedDate:e.target.value}))} style={inp}/></div></div>
        <div style={{marginBottom:11}}><label style={lbl}>AKSI BERIKUTNYA</label><input value={form.nextAction||""} onChange={e=>setForm(p=>({...p,nextAction:e.target.value}))} style={inp} placeholder="Apa yang perlu dilakukan?"/></div>
        <div style={{marginBottom:11}}><label style={lbl}>LINK PROPOSAL (Google Drive)</label><input value={form.proposalLink||""} onChange={e=>setForm(p=>({...p,proposalLink:e.target.value}))} style={inp} placeholder="https://drive.google.com/..."/></div>
        <div style={{marginBottom:16}}><label style={lbl}>CATATAN</label><textarea value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{...inp,minHeight:65,resize:"vertical"}} placeholder="Konteks, kebutuhan, decision maker..."/></div>
      </>}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={onCancel} style={btn()}>Batal</button><button onClick={onSave} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),fontWeight:700}}>{saveLabel}</button></div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// QUICK UPDATE
// ════════════════════════════════════════════════════════
function QuickUpdateModal({deal,onUpdate,onClose}) {
  const [done,setDone]=useState(""); const [next,setNext]=useState(deal.nextAction||""); const [date,setDate]=useState("");
  const submit=()=>{const nc=done.trim()?{text:`✓ ${done.trim()}`,author:deal.assignedTo,date:today()}:null;onUpdate({...deal,nextAction:next,nextActionDate:date,lastContactedDate:today(),comments:nc?[...(deal.comments||[]),nc]:deal.comments});onClose();};
  return (<div style={{...modal,zIndex:600}}><div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:14,padding:"20px",width:"100%",maxWidth:420}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div><div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>Update Cepat</div><div style={{fontSize:11,color:"#374151"}}>{deal.company}</div></div><button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#374151"}}><X size={14}/></button></div><div style={{marginBottom:11}}><label style={lbl}>APA YANG SUDAH DILAKUKAN?</label><textarea value={done} onChange={e=>setDone(e.target.value)} style={{...inp,minHeight:55,resize:"vertical"}} placeholder="Sudah telepon, kirim email, meeting..."/></div><div style={{marginBottom:11}}><label style={lbl}>AKSI BERIKUTNYA</label><input value={next} onChange={e=>setNext(e.target.value)} style={inp}/></div><div style={{marginBottom:16}}><label style={lbl}>TANGGAL AKSI BERIKUTNYA</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp}/></div><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={onClose} style={btn()}>Batal</button><button onClick={submit} style={{...btn("#22C55E","#0A0C14","#22C55E"),fontWeight:700}}>✓ Selesai + Simpan</button></div></div></div>);
}

// ════════════════════════════════════════════════════════
// MANDATORY FIELDS WARNING MODAL
// ════════════════════════════════════════════════════════
function MandatoryWarning({missing,targetStage,onClose}) {
  const fieldLabels={"value":"Nilai Deal","qty":"Jumlah Unit","proposalLink":"Link Proposal","nextActionDate":"Tanggal Aksi Berikutnya","nextAction":"Aksi Berikutnya","siteLocation":"Lokasi Site","lastContactedDate":"Terakhir Dihubungi","winLossReason":"Alasan Menang/Kalah"};
  return (<div style={{...modal,zIndex:600}}><div style={{background:"#0D1120",border:"1px solid #F87171",borderRadius:14,padding:"20px",width:"100%",maxWidth:380}}><div style={{fontSize:13,fontWeight:700,color:"#F1F5F9",marginBottom:6}}>Field Wajib Belum Diisi</div><div style={{fontSize:11,color:"#64748B",marginBottom:14}}>Untuk masuk ke stage <strong style={{color:stageOf(targetStage).color}}>{stageOf(targetStage).label}</strong>, field berikut wajib diisi:</div><div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>{missing.map(f=><div key={f} style={{padding:"8px 12px",background:"#2D1515",border:"1px solid #7F1D1D",borderRadius:7,fontSize:12,color:"#FCA5A5"}}>✗ {fieldLabels[f]||f}</div>)}</div><button onClick={onClose} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),width:"100%",fontWeight:700}}>OK, Isi Dulu</button></div></div>);
}

// ════════════════════════════════════════════════════════
// DEAL PANEL
// ════════════════════════════════════════════════════════
function DealPanel({deal,onUpdate,onSoftDelete,onClose,currentUser,team,products,settings}) {
  const [editing,setEditing]=useState(false); const [form,setForm]=useState({...deal});
  const [commentText,setComment]=useState(""); const [commenter,setCommenter]=useState(currentUser.name);
  const [showVersions,setShowVersions]=useState(false); const [mandatoryWarn,setMandatoryWarn]=useState(null);
  const role=currentUser.role; const userName=currentUser.name;
  const editable=canEdit(role,deal,userName); const deletable=canDel(role);
  useEffect(()=>{setForm({...deal});setEditing(false);},[deal.id]);
  const s=stageOf(deal.stage); const hs=health(deal); const age=ageInfo(deal.stageEnteredAt); const rc=repColor(deal.assignedTo,team);
  const contacts=deal.contacts||[{name:deal.contact||"",role:"",phone:deal.phone||""}];
  const versions=deal.versions||[];

  const save=()=>{
    const same=form.stage===deal.stage;
    const version={timestamp:new Date().toISOString(),changedBy:userName,changes:{}};
    ["company","value","stage","priority","assignedTo","nextAction"].forEach(k=>{ if(String(deal[k])!==String(form[k])) version.changes[k]={from:deal[k],to:form[k]}; });
    const newVersions=Object.keys(version.changes).length>0?[...versions,version]:versions;
    onUpdate({...form,value:Number(form.value),qty:Number(form.qty)||1,stageEnteredAt:same?deal.stageEnteredAt:today(),stageHistory:same?deal.stageHistory:[...(deal.stageHistory||[]),{stage:form.stage,date:today(),movedBy:userName}],versions:newVersions});
    setEditing(false);
  };

  const requestStageChange=sid=>{
    if(!editable) return;
    const missing=getMissingFields(deal,sid,settings);
    if(missing.length>0){setMandatoryWarn(sid);return;}
    const na=needsApproval({...deal,stage:sid},settings,role);
    if(na){
      onUpdate({...deal,pendingStage:sid,approvalStatus:"pending",approvalRequestedBy:userName,approvalRequestedAt:new Date().toISOString()});
    } else {
      onUpdate({...deal,stage:sid,stageEnteredAt:today(),stageHistory:[...(deal.stageHistory||[]),{stage:sid,date:today(),movedBy:userName}],approvalStatus:null,pendingStage:null});
    }
  };

  const addComment=()=>{if(!commentText.trim())return;onUpdate({...deal,comments:[...(deal.comments||[]),{text:commentText.trim(),author:commenter,date:today()}]});setComment("");};

  const approvalPending=deal.approvalStatus==="pending";
  const toStage=deal.pendingStage?stageOf(deal.pendingStage):null;

  return (
    <div style={{width:320,flexShrink:0,background:"#0A0D18",borderLeft:"1px solid #151D30",display:"flex",flexDirection:"column",overflowY:"auto"}}>
      {mandatoryWarn&&<MandatoryWarning missing={getMissingFields(deal,mandatoryWarn,settings)} targetStage={mandatoryWarn} onClose={()=>setMandatoryWarn(null)}/>}
      <div style={{padding:"13px 16px",borderBottom:"1px solid #151D30",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#0A0D18",zIndex:5}}>
        <span style={{fontSize:10,fontWeight:700,color:"#374151",letterSpacing:"0.07em"}}>DETAIL DEAL</span>
        <div style={{display:"flex",gap:5}}>
          {!editing&&editable&&<button onClick={()=>{setForm({...deal});setEditing(true)}} style={{...btn(),padding:"4px 7px"}}><Edit3 size={11}/></button>}
          {deletable&&<button onClick={()=>{if(window.confirm("Kirim ke Recycle Bin?"))onSoftDelete(deal.id);}} style={{...btn("#200D0D","#F87171","#3B1111"),padding:"4px 7px"}}><Trash2 size={11}/></button>}
          <button onClick={onClose} style={{...btn(),padding:"4px 7px"}}><X size={11}/></button>
        </div>
      </div>
      <div style={{padding:"14px 16px",flex:1}}>
        {editing?<DealForm form={form} setForm={setForm} onSave={save} onCancel={()=>setEditing(false)} saveLabel="Simpan Perubahan" team={team} products={products} deals={[]} editingId={deal.id}/>:<>
          {!editable&&<div style={{padding:"6px 10px",background:"#0D1120",border:"1px solid #374151",borderRadius:7,fontSize:10,color:"#475569",marginBottom:10}}>👁 Lihat saja — deal milik {deal.assignedTo}</div>}
          {approvalPending&&<div style={{padding:"10px 12px",background:"#2A1F05",border:"1px solid #FBBF24",borderRadius:8,marginBottom:10,fontSize:11,color:"#FBBF24"}}>⏳ Menunggu approval pindah ke <strong>{toStage?.label}</strong>. Diminta oleh {deal.approvalRequestedBy}.</div>}
          <div style={{marginBottom:12}}><div style={{fontSize:14,fontWeight:800,color:"#F1F5F9",lineHeight:1.3,marginBottom:7}}>{deal.company}</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}><span style={{background:s.color+"22",color:s.color,borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:700}}>{s.label}</span><span style={{background:PRI[deal.priority]?.bg,color:PRI[deal.priority]?.text,border:`1px solid ${PRI[deal.priority]?.border}`,borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:700}}>{deal.priority}</span><span style={{background:age.bg,color:age.c,borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:700}}>⏱{age.label}</span><span style={{background:hColor(hs)+"22",color:hColor(hs),borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:700}}>♥{hs}</span></div></div>
          <div style={{fontSize:24,fontWeight:800,color:"#F59E0B",marginBottom:14,letterSpacing:"-0.02em"}}>{fmtIDR(deal.value)}</div>
          <div style={{marginBottom:14}}><div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>KONTAK STAKEHOLDER</div>{contacts.map((c,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:9,marginBottom:6,padding:"8px 10px",background:"#0D1120",border:"1px solid #1A2235",borderRadius:8}}><div style={{width:28,height:28,borderRadius:"50%",background:rc+"22",border:`1px solid ${rc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:rc,flexShrink:0}}>{initials(c.name||"?")}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:700,color:"#E2E8F0"}}>{c.name||"-"}</div><div style={{fontSize:10,color:"#374151"}}>{c.role}</div></div>{c.phone&&<a href={`https://wa.me/${c.phone}?text=${encodeURIComponent(waMsg(deal))}`} target="_blank" rel="noopener noreferrer" style={{background:"#052015",border:"1px solid #064E3B",borderRadius:7,padding:"5px 8px",display:"flex",alignItems:"center",gap:4,textDecoration:"none"}}><MessageCircle size={11} color="#6EE7B7"/><span style={{fontSize:9,color:"#6EE7B7",fontWeight:700}}>WA</span></a>}</div>))}</div>
          {[["Produk",deal.product],["Jumlah",`${deal.qty} unit`],["Lokasi Site",deal.siteLocation||"-"],["Sales",deal.assignedTo],["Terakhir Dihubungi",fmtDate(deal.lastContactedDate)]].map(([k,v])=>(<div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #111928"}}><span style={{fontSize:11,color:"#374151",fontWeight:600}}>{k}</span><span style={{fontSize:11,color:"#94A3B8",textAlign:"right",maxWidth:175}}>{v}</span></div>))}
          {deal.winLossReason&&<div style={{marginTop:10,padding:"7px 10px",background:deal.stage==="menang"?"#052015":"#2D1515",border:`1px solid ${deal.stage==="menang"?"#064E3B":"#7F1D1D"}`,borderRadius:7,fontSize:11,color:deal.stage==="menang"?"#6EE7B7":"#FCA5A5"}}>{deal.stage==="menang"?"✓":"✗"} {deal.winLossReason}</div>}
          {deal.proposalLink&&<a href={deal.proposalLink} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:5,marginTop:10,padding:"7px 10px",background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,textDecoration:"none",fontSize:11,color:"#60A5FA"}}>📎 Lihat Proposal</a>}
          <div style={{marginTop:13}}><div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:6}}>AKSI BERIKUTNYA</div><div style={{background:"#0D1120",border:`1px solid ${isOD(deal.nextActionDate)?"#7F1D1D":"#1A2235"}`,borderRadius:7,padding:"9px 11px",fontSize:12,color:isOD(deal.nextActionDate)?"#FCA5A5":"#FBBF24",lineHeight:1.5}}>{isOD(deal.nextActionDate)&&<div style={{fontSize:9,color:"#F87171",fontWeight:700,marginBottom:3}}>⚠ TERLAMBAT — {fmtDate(deal.nextActionDate)}</div>}{!isOD(deal.nextActionDate)&&deal.nextActionDate&&<div style={{fontSize:9,color:"#374151",marginBottom:3}}>📅 {fmtDate(deal.nextActionDate)}</div>}{deal.nextAction}</div></div>
          {deal.notes&&<div style={{marginTop:10}}><div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:6}}>CATATAN</div><div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,padding:"9px 11px",fontSize:11,color:"#64748B",lineHeight:1.6}}>{deal.notes}</div></div>}

          {editable&&!approvalPending&&<div style={{marginTop:14}}>
            <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>PINDAH STAGE</div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {STAGES.map(st=>{
                const active=deal.stage===st.id;
                const missing=getMissingFields(deal,st.id,settings);
                const willNeedApproval=!isAdm(role)&&Number(deal.value)>=settings.approvalThreshold&&!["menang","kalah"].includes(st.id);
                return(<button key={st.id} onClick={()=>requestStageChange(st.id)} style={{background:active?st.color+"22":"#0D1120",border:`1px solid ${active?st.color+"88":"#1A2235"}`,borderRadius:6,padding:"6px 10px",fontSize:11,color:active?st.color:"#374151",cursor:"pointer",textAlign:"left",fontWeight:active?700:400,display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:st.color}}/>
                  {st.label}
                  {active&&<span style={{marginLeft:"auto",fontSize:9}}>SEKARANG</span>}
                  {!active&&missing.length>0&&<span style={{marginLeft:"auto",fontSize:9,color:"#F87171"}}>⚠{missing.length} field</span>}
                  {!active&&!missing.length&&willNeedApproval&&<span style={{marginLeft:"auto",fontSize:9,color:"#FBBF24"}}>⏳ approval</span>}
                </button>);
              })}
            </div>
            {!isAdm(role)&&Number(deal.value)>=settings.approvalThreshold&&<div style={{marginTop:8,padding:"6px 10px",background:"#2A1F05",border:"1px solid #78350F",borderRadius:6,fontSize:10,color:"#FBBF24"}}>Deal ini di atas threshold approval ({fmtIDR(settings.approvalThreshold)}). Pindah stage butuh persetujuan Manager/Super Admin.</div>}
          </div>}

          {(deal.stageHistory||[]).length>0&&<div style={{marginTop:14}}><div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>RIWAYAT STAGE</div>{[...(deal.stageHistory||[])].reverse().slice(0,4).map((h,i)=>{const st=stageOf(h.stage);return(<div key={i} style={{display:"flex",alignItems:"center",gap:7,fontSize:10,color:"#374151",marginBottom:4}}><div style={{width:5,height:5,borderRadius:"50%",background:st.color,flexShrink:0}}/><span style={{color:st.color,fontWeight:600}}>{st.label}</span><span style={{marginLeft:"auto"}}>{fmtDate(h.date)}</span></div>);})}</div>}

          {versions.length>0&&<div style={{marginTop:14}}>
            <button onClick={()=>setShowVersions(!showVersions)} style={{...btn(),width:"100%",display:"flex",alignItems:"center",gap:6,justifyContent:"center",fontSize:10}}><History size={11}/>{showVersions?"Sembunyikan":"Lihat"} Riwayat Perubahan ({versions.length})</button>
            {showVersions&&<div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
              {[...versions].reverse().map((v,i)=>(
                <div key={i} style={{background:"#080D18",border:"1px solid #1A2235",borderRadius:7,padding:"8px 10px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,fontWeight:700,color:repColor(v.changedBy,team)}}>{v.changedBy}</span><span style={{fontSize:9,color:"#374151"}}>{fmtDT(v.timestamp)}</span></div>
                  {Object.entries(v.changes||{}).map(([k,c])=>(<div key={k} style={{fontSize:10,color:"#475569"}}>{k}: <span style={{color:"#F87171"}}>{String(c.from).slice(0,20)}</span> → <span style={{color:"#6EE7B7"}}>{String(c.to).slice(0,20)}</span></div>))}
                </div>
              ))}
            </div>}
          </div>}

          <div style={{marginTop:14}}>
            <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:8}}>LOG AKTIVITAS</div>
            {(deal.comments||[]).length===0&&<div style={{fontSize:11,color:"#1E2A40",marginBottom:8}}>Belum ada catatan.</div>}
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:8}}>{(deal.comments||[]).map((c,i)=>(<div key={i} style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,padding:"8px 10px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:10,fontWeight:700,color:repColor(c.author,team)}}>{c.author}</span><span style={{fontSize:9,color:"#374151"}}>{fmtDate(c.date)}</span></div><div style={{fontSize:11,color:"#94A3B8",lineHeight:1.5}}>{c.text}</div></div>))}</div>
            <select value={commenter} onChange={e=>setCommenter(e.target.value)} style={{...inp,fontSize:11,padding:"5px 8px",marginBottom:6}}>{team.filter(t=>!t.isArchived).map(t=><option key={t.name}>{t.name}</option>)}</select>
            <div style={{display:"flex",gap:6}}><input value={commentText} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment()} placeholder="Tambah catatan aktivitas..." style={{...inp,flex:1,fontSize:12}}/><button onClick={addComment} style={{background:"#F59E0B",border:"none",borderRadius:8,padding:"0 11px",cursor:"pointer"}}><Send size={12} color="#0A0C14"/></button></div>
          </div>
        </>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TODAY TASKS
// ════════════════════════════════════════════════════════
function TodayTasks({deals,onSelect,onUpdate,currentUser}) {
  const [quickDeal,setQuickDeal]=useState(null);
  const t=today(); const active=deals.filter(d=>!d.isDeleted);
  const overdue=active.filter(d=>!["menang","kalah"].includes(d.stage)&&d.nextActionDate&&d.nextActionDate<=t).sort((a,b)=>Number(b.value)-Number(a.value));
  const reEngage=active.filter(d=>d.stage==="kalah"&&d.nextActionDate&&d.nextActionDate<=t).sort((a,b)=>Number(b.value)-Number(a.value));
  const upcoming=active.filter(d=>!["menang","kalah"].includes(d.stage)&&d.nextActionDate&&d.nextActionDate>t).sort((a,b)=>a.nextActionDate.localeCompare(b.nextActionDate)).slice(0,10);
  const canUpd=deal=>canEdit(currentUser.role,deal,currentUser.name);
  const Row=({deal,late,isRE})=>{const s=stageOf(deal.stage);return(<div style={{background:"#0D1120",border:`1px solid ${late?"#7F1D1D":"#1A2235"}`,borderRadius:10,padding:"11px 13px",display:"flex",gap:10,alignItems:"flex-start"}}><div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>onSelect(deal)}><div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:2}}><span style={{fontSize:12,fontWeight:700,color:"#E2E8F0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{deal.company}</span><span style={{fontSize:12,fontWeight:700,color:"#F59E0B",whiteSpace:"nowrap"}}>{fmtIDR(deal.value)}</span></div><div style={{fontSize:10,color:"#374151",marginBottom:3}}>{deal.assignedTo} · <span style={{color:s.color}}>{s.label}</span>{deal.siteLocation&&` · ${deal.siteLocation}`}</div><div style={{fontSize:11,color:late?"#FCA5A5":"#94A3B8",lineHeight:1.4}}>{late&&"⚠ "}{deal.nextAction}</div>{deal.nextActionDate&&<div style={{fontSize:9,color:late?"#F87171":"#374151",marginTop:2}}>{late?"Terlambat: ":isRE?"Re-engage: ":"📅 "}{fmtDate(deal.nextActionDate)}</div>}</div><div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}><a href={waLink(deal)} target="_blank" rel="noopener noreferrer" style={{background:"#052015",border:"1px solid #064E3B",borderRadius:7,padding:"5px 7px",display:"flex",alignItems:"center",gap:3,textDecoration:"none"}}><MessageCircle size={11} color="#6EE7B7"/><span style={{fontSize:9,color:"#6EE7B7",fontWeight:700}}>WA</span></a>{!isRE&&canUpd(deal)&&<button onClick={()=>setQuickDeal(deal)} style={{background:"#1A2235",border:"1px solid #22C55E44",borderRadius:7,padding:"5px 7px",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}><CheckSquare size={11} color="#22C55E"/><span style={{fontSize:9,color:"#22C55E",fontWeight:700}}>Update</span></button>}</div></div>);};
  const Section=({title,items,late,icon:Icon,color,isRE})=>(<div style={{marginBottom:20}}><div style={{fontSize:10,fontWeight:700,color,letterSpacing:"0.07em",marginBottom:9,display:"flex",alignItems:"center",gap:6}}><Icon size={12} color={color}/>{title} ({items.length})</div>{items.length===0?<div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:9,padding:16,textAlign:"center",color:"#1E2A40",fontSize:12}}>Tidak ada tugas ✓</div>:<div style={{display:"flex",flexDirection:"column",gap:7}}>{items.map(d=><Row key={d.id} deal={d} late={late} isRE={isRE}/>)}</div>}</div>);
  return (<div style={{padding:16,maxWidth:700,margin:"0 auto"}}>{quickDeal&&<QuickUpdateModal deal={quickDeal} onUpdate={d=>{onUpdate(d);setQuickDeal(null);}} onClose={()=>setQuickDeal(null)}/>}<Section title="TERLAMBAT / JATUH TEMPO" items={overdue} late icon={AlertCircle} color="#F87171"/>{reEngage.length>0&&<Section title="WAKTUNYA RE-ENGAGE" items={reEngage} isRE icon={RefreshCw} color="#A78BFA"/>}<Section title="AKAN DATANG" items={upcoming} icon={Clock} color="#60A5FA"/></div>);
}

// ════════════════════════════════════════════════════════
// TABLE VIEW
// ════════════════════════════════════════════════════════
function TableView({deals,onSelect,team}) {
  const [sort,setSort]=useState({col:"value",dir:"desc"}); const [filter,setFilter]=useState({stage:"Semua",rep:"Semua",pri:"Semua"});
  const toggle=col=>setSort(s=>s.col===col?{col,dir:s.dir==="desc"?"asc":"desc"}:{col,dir:"desc"});
  const active=deals.filter(d=>!d.isDeleted);
  const sorted=[...active].filter(d=>(filter.stage==="Semua"||d.stage===filter.stage)&&(filter.rep==="Semua"||d.assignedTo===filter.rep)&&(filter.pri==="Semua"||d.priority===filter.pri)).sort((a,b)=>{const fn={value:(a,b)=>Number(b.value)-Number(a.value),company:(a,b)=>a.company.localeCompare(b.company),assignedTo:(a,b)=>a.assignedTo.localeCompare(b.assignedTo),stage:(a,b)=>STAGES.findIndex(s=>s.id===a.stage)-STAGES.findIndex(s=>s.id===b.stage),health:(a,b)=>health(b)-health(a),nextActionDate:(a,b)=>(a.nextActionDate||"zz").localeCompare(b.nextActionDate||"zz")};const res=(fn[sort.col]||fn.value)(a,b);return sort.dir==="asc"?-res:res;});
  const Th=({label,col,w})=><th onClick={()=>toggle(col)} style={{padding:"8px 10px",fontSize:9,fontWeight:700,color:sort.col===col?"#F59E0B":"#374151",letterSpacing:"0.06em",textAlign:"left",cursor:"pointer",whiteSpace:"nowrap",width:w,background:"#0A0D18",position:"sticky",top:0}}>{label}{sort.col===col?(sort.dir==="desc"?<ChevronDown size={10}/>:<ChevronUp size={10}/>):null}</th>;
  return (<div style={{padding:"12px 14px",flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}><div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>{[{label:"Stage",key:"stage",opts:["Semua",...STAGES.map(s=>({v:s.id,l:s.label}))]},{label:"Sales",key:"rep",opts:["Semua",...team.filter(t=>!t.isArchived).map(t=>t.name)]},{label:"Prioritas",key:"pri",opts:["Semua",...PRI_LIST]}].map(({label,key,opts})=>(<div key={key} style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,color:"#374151",fontWeight:600}}>{label}:</span><select value={filter[key]} onChange={e=>setFilter(p=>({...p,[key]:e.target.value}))} style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,padding:"5px 8px",color:"#CBD5E1",fontSize:11,outline:"none"}}>{opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select></div>))}<span style={{fontSize:11,color:"#374151",marginLeft:"auto"}}>{sorted.length} deal</span></div><div style={{overflowX:"auto",overflowY:"auto",flex:1}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}><thead><tr style={{borderBottom:"1px solid #151D30"}}><Th label="PERUSAHAAN" col="company" w="18%"/><Th label="SALES" col="assignedTo" w="12%"/><Th label="PRODUK" col="product" w="16%"/><Th label="NILAI" col="value" w="11%"/><Th label="STAGE" col="stage" w="12%"/><Th label="PRI" col="priority" w="7%"/><Th label="SKOR" col="health" w="7%"/><Th label="AKSI BERIKUTNYA" col="nextActionDate" w="17%"/></tr></thead><tbody>{sorted.map(deal=>{const s=stageOf(deal.stage);const p=PRI[deal.priority]||PRI.Sedang;const hs=health(deal);const overdue=isOD(deal.nextActionDate);return <tr key={deal.id} onClick={()=>onSelect(deal)} style={{borderBottom:"1px solid #111928",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#0D1120"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"9px 10px"}}><div style={{fontSize:12,fontWeight:700,color:"#E2E8F0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:150}}>{deal.company}</div><div style={{fontSize:10,color:"#374151"}}>{deal.siteLocation}</div></td><td style={{padding:"9px 10px"}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:20,height:20,borderRadius:"50%",background:repColor(deal.assignedTo,team)+"22",border:`1px solid ${repColor(deal.assignedTo,team)}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:repColor(deal.assignedTo,team)}}>{initials(deal.assignedTo)}</div><span style={{fontSize:11,color:"#94A3B8"}}>{deal.assignedTo.split(" ")[0]}</span></div></td><td style={{padding:"9px 10px",fontSize:11,color:"#64748B"}}>{(deal.product||"").replace("Mobile ","").replace(" System","")}</td><td style={{padding:"9px 10px",fontSize:12,fontWeight:700,color:"#F59E0B",whiteSpace:"nowrap"}}>{fmtIDR(deal.value)}</td><td style={{padding:"9px 10px"}}><span style={{background:s.color+"22",color:s.color,borderRadius:4,padding:"2px 6px",fontSize:9,fontWeight:700}}>{s.label}</span>{deal.approvalStatus==="pending"&&<span style={{background:"#FBBF2422",color:"#FBBF24",borderRadius:4,padding:"1px 5px",fontSize:8,fontWeight:700,marginLeft:4}}>⏳</span>}</td><td style={{padding:"9px 10px"}}><span style={{background:p.bg,color:p.text,borderRadius:4,padding:"2px 5px",fontSize:9,fontWeight:700}}>{deal.priority}</span></td><td style={{padding:"9px 10px"}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{flex:1,height:5,background:"#111928",borderRadius:3,overflow:"hidden",minWidth:30}}><div style={{width:`${hs}%`,height:"100%",background:hColor(hs),borderRadius:3}}/></div><span style={{fontSize:9,fontWeight:700,color:hColor(hs)}}>{hs}</span></div></td><td style={{padding:"9px 10px"}}><div style={{fontSize:11,color:overdue?"#FCA5A5":"#64748B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{overdue&&"⚠ "}{deal.nextAction}</div>{deal.nextActionDate&&<div style={{fontSize:9,color:overdue?"#F87171":"#374151"}}>{fmtDate(deal.nextActionDate)}</div>}</td></tr>;})}</tbody></table></div></div>);
}

// ════════════════════════════════════════════════════════
// TEAM VIEW
// ════════════════════════════════════════════════════════
function TeamView({deals,team,targets,setTargets,currentUser}) {
  const active=deals.filter(d=>!d.isDeleted);
  const canSetTarget=isAdm(currentUser.role);
  const totalPipeline=active.filter(d=>!["kalah"].includes(d.stage)).reduce((a,d)=>a+Number(d.value),0);
  const weightedTotal=active.filter(d=>d.stage!=="kalah").reduce((a,d)=>a+Number(d.value)*(stageOf(d.stage).weight||0),0);
  const repStats=team.filter(t=>!t.isArchived).map((m,i)=>{const rep=m.name;const rd=active.filter(d=>d.assignedTo===rep);const act=rd.filter(d=>!["menang","kalah"].includes(d.stage));const won=rd.filter(d=>d.stage==="menang");const pipeline=act.reduce((a,d)=>a+Number(d.value),0);const weighted=act.reduce((a,d)=>a+Number(d.value)*(stageOf(d.stage).weight||0),0);const wonVal=won.reduce((a,d)=>a+Number(d.value),0);const tgt=targets[rep]||m.target||1000000000;const pct=Math.min(Math.round(wonVal/tgt*100),100);const stale=act.filter(d=>daysSince(d.stageEnteredAt)>14).length;const overdue=act.filter(d=>isOD(d.nextActionDate)).length;const roleInfo=ROLES[m.role]||ROLES.user;return{rep,pipeline,weighted,wonVal,activeCount:act.length,wonCount:won.length,lostCount:rd.filter(d=>d.stage==="kalah").length,stale,overdue,tgt,pct,color:RC[i%RC.length],roleInfo};});
  return (<div style={{padding:"14px 16px",overflowY:"auto"}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:11,marginBottom:20}}>{repStats.map(s=>(<div key={s.rep} style={{background:"#0D1120",border:`1px solid ${s.color}33`,borderRadius:12,padding:14}}><div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}><div style={{width:36,height:36,borderRadius:"50%",background:s.color+"22",border:`1px solid ${s.color}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:s.color}}>{initials(s.rep)}</div><div><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{fontSize:12,fontWeight:700,color:"#F1F5F9"}}>{s.rep}</div><span style={{fontSize:11}}>{s.roleInfo.icon}</span></div><div style={{fontSize:10,color:"#374151"}}>{s.activeCount} deal aktif · {totalPipeline>0?Math.round(s.pipeline/totalPipeline*100):0}%</div></div></div><div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,color:"#374151",fontWeight:600}}>TARGET BULANAN (IDR)</span><span style={{fontSize:10,color:s.pct>=100?"#22C55E":s.pct>=60?"#FBBF24":"#F87171",fontWeight:700}}>{s.pct}%</span></div>{canSetTarget?<input type="number" value={s.tgt} onChange={e=>setTargets(p=>({...p,[s.rep]:Number(e.target.value)}))} style={{...inp,fontSize:11,padding:"5px 8px",marginBottom:5,color:"#F59E0B"}}/>:<div style={{fontSize:12,fontWeight:700,color:"#F59E0B",marginBottom:5}}>{fmtIDR(s.tgt)}</div>}<div style={{height:6,background:"#111928",borderRadius:3,overflow:"hidden"}}><div style={{width:`${s.pct}%`,height:"100%",background:s.pct>=100?"#22C55E":s.pct>=60?"#FBBF24":"#F87171",borderRadius:3}}/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>{[["Pipeline",fmtIDR(s.pipeline),"#F59E0B"],["Terbobot",fmtIDR(s.weighted),"#60A5FA"]].map(([l,v,c])=>(<div key={l} style={{background:"#080D18",borderRadius:7,padding:"7px 9px"}}><div style={{fontSize:9,color:"#374151",fontWeight:600,marginBottom:2}}>{l.toUpperCase()}</div><div style={{fontSize:12,fontWeight:700,color:c}}>{v}</div></div>))}</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{s.overdue>0&&<span style={{background:"#2D1515",color:"#FCA5A5",border:"1px solid #7F1D1D",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:700}}>⚠{s.overdue} terlambat</span>}{s.stale>0&&<span style={{background:"#2A1F05",color:"#FCD34D",border:"1px solid #78350F",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:700}}>⏱{s.stale} stagnan</span>}{s.overdue===0&&s.stale===0&&<span style={{background:"#052015",color:"#6EE7B7",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:700}}>✓ On track</span>}</div></div>))}</div><div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:12,padding:14}}><div style={{fontSize:10,fontWeight:700,color:"#374151",letterSpacing:"0.07em",marginBottom:12}}>FUNNEL PIPELINE</div>{STAGES.filter(s=>s.id!=="kalah").map(stage=>{const sd=active.filter(d=>d.stage===stage.id);const sv=sd.reduce((a,d)=>a+Number(d.value),0);const wv=sv*stage.weight;const pct=totalPipeline>0?Math.min(sv/totalPipeline*100,100):0;return <div key={stage.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><div style={{width:6,height:6,borderRadius:"50%",background:stage.color,flexShrink:0}}/><div style={{width:110,fontSize:10,color:"#64748B",flexShrink:0}}>{stage.label}</div><div style={{flex:1,height:8,background:"#111928",borderRadius:4,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:stage.color,borderRadius:4}}/></div><div style={{width:80,fontSize:10,color:"#94A3B8",textAlign:"right",flexShrink:0}}>{fmtIDR(wv)}</div><div style={{width:22,fontSize:9,color:stage.color,fontWeight:700,textAlign:"right"}}>{sd.length}</div></div>;})} <div style={{marginTop:11,padding:"9px 11px",background:"#080D18",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:"#64748B"}}>Total Pipeline Terbobot</span><span style={{fontSize:14,fontWeight:800,color:"#F59E0B"}}>{fmtIDR(weightedTotal)}</span></div></div></div>);
}

// ════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════
export default function App() {
  const [currentUser,setCurrentUser]   = useState(null);
  const [deals,setDeals]               = useState([]);
  const [team,setTeam]                 = useState(DEFAULT_TEAM);
  const [products,setProducts]         = useState(PRODUCTS_DEFAULT);
  const [targets,setTargets]           = useState({});
  const [settings,setSettings]         = useState(DEFAULT_SETTINGS);
  const [auditLog,setAuditLog]         = useState([]);
  const [selected,setSelected]         = useState(null);
  const [showAdd,setShowAdd]           = useState(false);
  const [showAdmin,setShowAdmin]       = useState(false);
  const [showSASettings,setShowSASettings] = useState(false);
  const [showBin,setShowBin]           = useState(false);
  const [showApproval,setShowApproval] = useState(false);
  const [showChangePinModal,setShowChangePinModal] = useState(false);
  const [quickMode,setQuickMode]       = useState(false);
  const [dragId,setDragId]             = useState(null);
  const [dragOver,setDragOver]         = useState(null);
  const [search,setSearch]             = useState("");
  const [repFilter,setRepFilter]       = useState("Semua");
  const [tab,setTab]                   = useState("papan");
  const [loading,setLoading]           = useState(false);
  const [syncing,setSyncing]           = useState(false);
  const [online,setOnline]             = useState(true);
  const [lastSaved,setLastSaved]       = useState("");
  const [isMobile,setIsMobile]         = useState(window.innerWidth<768);
  const nextId    = useRef(100);
  const importRef = useRef(null);
  const saveTimer = useRef(null);
  const lastActivity = useRef(Date.now());

  const role     = currentUser?.role||"";
  const userName = currentUser?.name||"";

  // Mobile detection
  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h);
  },[]);

  // Session timeout
  useEffect(()=>{
    if(!currentUser) return;
    const updateActivity=()=>{ lastActivity.current=Date.now(); };
    window.addEventListener("click",updateActivity);
    window.addEventListener("keydown",updateActivity);
    const interval=setInterval(()=>{
      const timeout=(settings.sessionTimeout||60)*60*1000;
      if(Date.now()-lastActivity.current>timeout){
        sessionStorage.removeItem(LS_SESSION);
        setCurrentUser(null); setSelected(null);
        alert("Sesi kamu sudah habis karena tidak aktif. Silakan login kembali.");
      }
    },60000);
    return()=>{ window.removeEventListener("click",updateActivity); window.removeEventListener("keydown",updateActivity); clearInterval(interval); };
  },[currentUser,settings.sessionTimeout]);

  const emptyForm=useCallback(()=>({company:"",contacts:[{name:"",role:"Procurement Manager",phone:""}],product:products[0]||"",qty:1,value:"",stage:"prospek",priority:"Sedang",assignedTo:userName,nextAction:"",nextActionDate:"",lastContactedDate:"",siteLocation:"",proposalLink:"",notes:"",stageEnteredAt:today(),winLossReason:"",stageHistory:[],comments:[],versions:[],createdAt:today(),isDeleted:false,approvalStatus:null}),[products,userName]);
  const [form,setForm]=useState(()=>emptyForm());

  const addAudit=useCallback((action,detail="")=>{
    if(!currentUser) return;
    setAuditLog(p=>[...p,{action,detail,role:currentUser.role,userName:currentUser.name,timestamp:new Date().toISOString()}]);
  },[currentUser]);

  // Restore session
  useEffect(()=>{
    const saved=sessionStorage.getItem(LS_SESSION);
    if(saved){try{const u=JSON.parse(saved);setCurrentUser(u);}catch(e){}}
  },[]);

  const handleLogin=member=>{
    setCurrentUser(member);
    sessionStorage.setItem(LS_SESSION,JSON.stringify(member));
    lastActivity.current=Date.now();
  };
  const handleLogout=()=>{
    addAudit("Logout");
    sessionStorage.removeItem(LS_SESSION);
    setCurrentUser(null); setSelected(null);
  };
  const handlePinChanged=(member,newPin)=>{
    setTeam(p=>p.map(t=>t.id===member.id?{...t,pin:newPin,isDefaultPin:false}:t));
  };
  const handleOwnPinSaved=newPin=>{
    const updated={...currentUser,pin:newPin,isDefaultPin:false};
    setCurrentUser(updated);
    sessionStorage.setItem(LS_SESSION,JSON.stringify(updated));
    setTeam(p=>p.map(t=>t.id===currentUser.id?{...t,pin:newPin,isDefaultPin:false}:t));
    setShowChangePinModal(false);
    addAudit("Ganti PIN sendiri");
  };

  // Load from Sheets
  const loadData=useCallback(async()=>{
    setLoading(true);
    try {
      const data=await sheetsGet(DEFAULT_URL);
      if(data.error) throw new Error(data.error);
      if(data.deals?.length>0){setDeals(data.deals.map(migrate));nextId.current=Math.max(...data.deals.map(d=>d.id))+1;}
      if(data.team?.length>0)     setTeam(data.team);
      if(data.products?.length>0) setProducts(data.products);
      if(data.targets)            setTargets(data.targets);
      if(data.settings)           setSettings({...DEFAULT_SETTINGS,...data.settings});
      if(data.auditLog)           setAuditLog(data.auditLog.slice(-300));
      setOnline(true);
    } catch(e){console.error(e);setOnline(false);}
    setLoading(false);
  },[]);

  useEffect(()=>{if(currentUser) loadData();},[currentUser?.name]);

  const saveData=useCallback(async(d,t,p,tgt,s,al)=>{
    setSyncing(true);
    try{await sheetsPost(DEFAULT_URL,{deals:d,team:t,products:p,targets:tgt,settings:s,auditLog:al});setLastSaved(new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}));setOnline(true);}
    catch(e){setOnline(false);}
    setSyncing(false);
  },[]);

  useEffect(()=>{
    if(loading||!currentUser) return;
    clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(()=>saveData(deals,team,products,targets,settings,auditLog),800);
    return()=>clearTimeout(saveTimer.current);
  },[deals,team,products,targets,settings,auditLog]);

  // Deal handlers
  const updateDeal=d=>{setDeals(p=>p.map(x=>x.id===d.id?d:x));setSelected(d);addAudit(`Update deal: ${d.company}`);};
  const softDelete=id=>{const deal=deals.find(d=>d.id===id);setDeals(p=>p.map(x=>x.id===id?{...x,isDeleted:true,deletedAt:new Date().toISOString()}:x));setSelected(null);addAudit(`Kirim ke recycle bin: ${deal?.company||id}`);};
  const restoreDeal=id=>{setDeals(p=>p.map(x=>x.id===id?{...x,isDeleted:false,deletedAt:null}:x));addAudit(`Restore deal: ${deals.find(d=>d.id===id)?.company||id}`);};
  const permanentDelete=id=>{setDeals(p=>p.filter(x=>x.id!==id));addAudit(`Hapus permanen: ${deals.find(d=>d.id===id)?.company||id}`);};

  const approveDeal=id=>{
    const deal=deals.find(d=>d.id===id);
    if(!deal) return;
    const updated={...deal,stage:deal.pendingStage||deal.stage,stageEnteredAt:today(),stageHistory:[...(deal.stageHistory||[]),{stage:deal.pendingStage||deal.stage,date:today(),movedBy:userName}],approvalStatus:"approved",pendingStage:null,approvalBy:userName,approvalAt:new Date().toISOString()};
    setDeals(p=>p.map(x=>x.id===id?updated:x));
    if(selected?.id===id) setSelected(updated);
    addAudit(`Approve deal: ${deal.company}`,`→ ${stageOf(deal.pendingStage||deal.stage).label}`);
  };
  const rejectDeal=id=>{
    const deal=deals.find(d=>d.id===id);
    if(!deal) return;
    const updated={...deal,approvalStatus:"rejected",pendingStage:null};
    setDeals(p=>p.map(x=>x.id===id?updated:x));
    if(selected?.id===id) setSelected(updated);
    addAudit(`Tolak approval deal: ${deal.company}`);
  };

  // Reassign deals when archiving
  const handleTeamUpdate=newTeam=>{
    setTeam(newTeam);
    addAudit("Update data tim");
  };

  const addDeal=()=>{
    const id=nextId.current++;
    const d={...form,id,value:Number(form.value)||0,qty:Number(form.qty)||1,stageHistory:[{stage:form.stage,date:today(),movedBy:userName}],comments:[],versions:[],createdAt:today(),isDeleted:false,approvalStatus:null};
    setDeals(p=>[...p,d]);setForm(emptyForm());setShowAdd(false);addAudit(`Tambah deal: ${d.company}`,`Nilai: ${fmtIDR(d.value)}`);
  };

  const onDragStart=id=>setDragId(id);
  const onDragOver=(sid,e)=>{e.preventDefault();setDragOver(sid);};
  const onDrop=sid=>{
    if(dragId!=null){
      const deal=deals.find(d=>d.id===dragId);
      if(deal&&canEdit(role,deal,userName)&&!deal.isDeleted){
        const missing=getMissingFields(deal,sid,settings);
        if(missing.length>0){setDragId(null);setDragOver(null);return;}
        const na=needsApproval({...deal},settings,role);
        let u;
        if(na&&!["menang","kalah"].includes(sid)){
          u={...deal,pendingStage:sid,approvalStatus:"pending",approvalRequestedBy:userName,approvalRequestedAt:new Date().toISOString()};
        } else {
          u={...deal,stage:sid,stageEnteredAt:today(),stageHistory:[...(deal.stageHistory||[]),{stage:sid,date:today(),movedBy:userName}],approvalStatus:null,pendingStage:null};
        }
        setDeals(p=>p.map(d=>d.id===dragId?u:d));
        if(selected?.id===dragId) setSelected(u);
        addAudit(`Pindah deal: ${deal.company}`,`→ ${stageOf(sid).label}`);
      }
    }
    setDragId(null);setDragOver(null);
  };

  const exportJSON=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({deals,team,products,targets,settings,version:"5.0",exportedAt:new Date().toISOString()},null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download=`btm-crm-${today()}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);addAudit("Export data JSON");};
  const importJSON=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(d.deals)setDeals(d.deals.map(migrate));if(d.team)setTeam(d.team);if(d.products)setProducts(d.products);if(d.targets)setTargets(d.targets);if(d.settings)setSettings({...DEFAULT_SETTINGS,...d.settings});addAudit("Import data JSON");}catch(e){alert("File tidak valid");}};r.readAsText(file);e.target.value="";};

  if(!currentUser) return <LoginScreen team={team} settings={settings} onLogin={handleLogin} onPinChanged={handlePinChanged}/>;
  if(loading) return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#070A12",flexDirection:"column",gap:16}}><div style={{width:42,height:42,background:"linear-gradient(135deg,#F59E0B,#D97706)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}><Sun size={22} color="#0A0D18"/></div><div style={{fontSize:13,color:"#374151"}}>Memuat data untuk {userName}...</div></div>);

  const activeDeal=d=>!d.isDeleted;
  const visible=deals.filter(d=>activeDeal(d)&&(repFilter==="Semua"||d.assignedTo===repFilter)&&[d.company,d.contacts?.[0]?.name||"",d.product,d.notes,d.siteLocation].some(s=>s?.toLowerCase().includes(search.toLowerCase())));
  const byStage=id=>visible.filter(d=>d.stage===id);
  const pipelineVal=deals.filter(d=>activeDeal(d)&&!["menang","kalah"].includes(d.stage)).reduce((a,d)=>a+Number(d.value),0);
  const weightedVal=deals.filter(d=>activeDeal(d)&&d.stage!=="kalah").reduce((a,d)=>a+Number(d.value)*(stageOf(d.stage).weight||0),0);
  const wonVal=deals.filter(d=>activeDeal(d)&&d.stage==="menang").reduce((a,d)=>a+Number(d.value),0);
  const overdueCount=deals.filter(d=>activeDeal(d)&&!["menang","kalah"].includes(d.stage)&&isOD(d.nextActionDate)).length;
  const pendingApproval=deals.filter(d=>activeDeal(d)&&d.approvalStatus==="pending").length;
  const deletedCount=deals.filter(d=>d.isDeleted).length;
  const roleInfo=ROLES[role]||ROLES.user;

  const TABS=[
    {id:"papan",  label:"Papan",  icon:LayoutGrid},
    {id:"tugas",  label:"Tugas",  icon:CheckSquare, badge:overdueCount},
    {id:"tabel",  label:"Tabel",  icon:TrendingUp},
    {id:"tim",    label:"Tim",    icon:Users},
  ];

  const MainContent=()=><div style={{display:"flex",flex:1,overflow:"hidden"}}>
    {tab==="papan"&&<>
      <div style={{flex:1,overflowX:"auto",padding:"10px 11px",display:"flex",gap:8,alignItems:"flex-start"}}>
        {STAGES.map(stage=>{
          const cards=byStage(stage.id);const total=cards.reduce((a,d)=>a+Number(d.value),0);const over=dragOver===stage.id;
          return(<div key={stage.id} onDragOver={e=>onDragOver(stage.id,e)} onDrop={()=>onDrop(stage.id)} style={{minWidth:205,maxWidth:205,background:over?"#111928":"#0D1120",border:`1px solid ${over?stage.color+"66":"#151D30"}`,borderRadius:12,display:"flex",flexDirection:"column",transition:"border-color 0.12s"}}>
            <div style={{padding:"9px 11px 7px",borderBottom:"1px solid #151D30"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:stage.color}}/><span style={{fontSize:9,fontWeight:700,color:"#64748B",letterSpacing:"0.07em"}}>{stage.label.toUpperCase()}</span></div><span style={{background:"#151D30",color:"#475569",borderRadius:20,padding:"1px 6px",fontSize:9,fontWeight:700}}>{cards.length}</span></div>{cards.length>0&&<div style={{fontSize:10,color:stage.color,fontWeight:700,marginTop:2}}>{fmtIDR(total)}</div>}</div>
            <div style={{overflowY:"auto",maxHeight:480,padding:7,display:"flex",flexDirection:"column",gap:6}}>
              {cards.map(deal=>{
                const p=PRI[deal.priority]||PRI.Sedang;const rc=repColor(deal.assignedTo,team);const age=ageInfo(deal.stageEnteredAt);const overdue=isOD(deal.nextActionDate);const hs=health(deal);const isSel=selected?.id===deal.id;const editable=canEdit(role,deal,userName);const isPending=deal.approvalStatus==="pending";
                return(<div key={deal.id} draggable={editable&&!isPending} onDragStart={()=>editable&&!isPending&&onDragStart(deal.id)} onClick={()=>setSelected(deal)} style={{background:isSel?"#131B30":"#0F1525",border:`1px solid ${isPending?"#FBBF2444":isSel?stage.color+"99":overdue?"#7F1D1D44":"#1A2235"}`,borderRadius:9,padding:"9px 10px",cursor:"pointer",opacity:dragId===deal.id?0.4:1,transition:"all 0.12s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:5,marginBottom:4}}><span style={{fontSize:11,fontWeight:700,color:"#E2E8F0",lineHeight:1.3}}>{deal.company}</span><span style={{background:p.bg,color:p.text,border:`1px solid ${p.border}`,borderRadius:4,padding:"1px 5px",fontSize:8,fontWeight:700,whiteSpace:"nowrap"}}>{deal.priority}</span></div>
                  <div style={{fontSize:9,color:"#374151",marginBottom:3}}>{(deal.product||"").replace("Mobile ","")} · {deal.qty}u</div>
                  <div style={{fontSize:12,fontWeight:700,color:"#F59E0B",marginBottom:6}}>{fmtIDR(deal.value)}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{width:20,height:20,borderRadius:"50%",background:rc+"22",border:`1px solid ${rc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:rc}}>{initials(deal.assignedTo)}</div>
                    <div style={{display:"flex",gap:4,alignItems:"center"}}>
                      {overdue&&<AlertCircle size={10} color="#F87171"/>}
                      {isPending&&<span title="Menunggu approval" style={{fontSize:9}}>⏳</span>}
                      <span style={{background:age.bg,color:age.c,borderRadius:4,padding:"1px 4px",fontSize:8,fontWeight:700}}>{age.label}</span>
                      <span style={{background:hColor(hs)+"22",color:hColor(hs),borderRadius:4,padding:"1px 4px",fontSize:8,fontWeight:700}}>♥{hs}</span>
                    </div>
                  </div>
                  {overdue&&<div style={{marginTop:5,fontSize:9,color:"#F87171",fontWeight:600,lineHeight:1.3}}>⚠ {(deal.nextAction||"").slice(0,38)}…</div>}
                </div>);
              })}
              {cards.length===0&&<div style={{padding:"20px 0",textAlign:"center",color:"#1E2A40",fontSize:10}}>Seret deal ke sini</div>}
            </div>
          </div>);
        })}
      </div>
      {selected&&<DealPanel key={selected.id} deal={selected} onUpdate={updateDeal} onSoftDelete={softDelete} onClose={()=>setSelected(null)} currentUser={currentUser} team={team} products={products} settings={settings}/>}
    </>}
    {tab==="tugas"&&<div style={{flex:1,overflowY:"auto"}}><TodayTasks deals={visible} onSelect={d=>{setSelected(d);setTab("papan");}} onUpdate={updateDeal} currentUser={currentUser}/></div>}
    {tab==="tabel"&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}><TableView deals={visible} onSelect={d=>{setSelected(d);setTab("papan");}} team={team}/></div>}
    {tab==="tim"&&<div style={{flex:1,overflowY:"auto"}}><TeamView deals={deals} team={team} targets={targets} setTargets={setTargets} currentUser={currentUser}/></div>}
  </div>;

  return (
    <div style={{background:"#070A12",minHeight:"100vh",color:"#CBD5E1",fontFamily:"ui-sans-serif,system-ui,sans-serif",display:"flex",flexDirection:"column"}}>

      {/* HEADER */}
      <div style={{padding:"10px 14px",borderBottom:"1px solid #151D30",background:"#0A0D18",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,background:"linear-gradient(135deg,#F59E0B,#D97706)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}><Sun size={15} color="#0A0D18"/></div><div><div style={{fontSize:12,fontWeight:700,color:"#F1F5F9"}}>BTM Energi Nusantara</div><div style={{fontSize:9,color:"#374151",letterSpacing:"0.07em",fontWeight:700}}>CRM PENJUALAN</div></div></div>
        <div style={{flex:1}}/>
        {!isMobile&&[["PIPELINE",fmtIDR(pipelineVal),"#F59E0B"],["EST. REVENUE",fmtIDR(weightedVal),"#60A5FA"],["MENANG",fmtIDR(wonVal),"#22C55E"]].map(([l,v,c])=>(<div key={l} style={{textAlign:"right"}}><div style={{fontSize:9,color:"#374151",letterSpacing:"0.06em",fontWeight:700}}>{l}</div><div style={{fontSize:12,fontWeight:800,color:c}}>{v}</div></div>))}
        {!isMobile&&<div style={{position:"relative"}}><Search size={12} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#374151"}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari..." style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,padding:"6px 8px 6px 24px",color:"#CBD5E1",fontSize:11,width:120,outline:"none"}}/></div>}
        {!isMobile&&<select value={repFilter} onChange={e=>setRepFilter(e.target.value)} style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,padding:"6px 8px",color:"#CBD5E1",fontSize:11,outline:"none"}}><option>Semua</option>{team.filter(t=>!t.isArchived).map(t=><option key={t.name}>{t.name}</option>)}</select>}
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {online?<Wifi size={13} color="#22C55E"/>:<WifiOff size={13} color="#F87171"/>}
          <button onClick={loadData} style={{...btn(),padding:"6px 8px"}}><RefreshCw size={12} style={{animation:syncing?"spin 1s linear infinite":"none"}}/></button>
          {isAdm(role)&&<>
            {pendingApproval>0&&<button onClick={()=>setShowApproval(true)} style={{...btn("#2A1F05","#FBBF24","#78350F"),padding:"6px 10px",display:"flex",alignItems:"center",gap:5,fontWeight:700}}><Bell size={12}/>{pendingApproval}</button>}
            <button onClick={exportJSON} style={{...btn(),padding:"6px 8px"}}><Download size={12}/></button>
            <button onClick={()=>importRef.current?.click()} style={{...btn(),padding:"6px 8px"}}><Upload size={12}/></button>
            <input ref={importRef} type="file" accept=".json" onChange={importJSON} style={{display:"none"}}/>
            {deletedCount>0&&<button onClick={()=>setShowBin(true)} style={{...btn("#200D0D","#F87171","#3B1111"),padding:"6px 8px",display:"flex",alignItems:"center",gap:4}}><Trash2 size={12}/>{deletedCount}</button>}
            <button onClick={()=>setShowAdmin(true)} style={{...btn("#F59E0B22","#F59E0B","#F59E0B44"),padding:"6px 10px",display:"flex",alignItems:"center",gap:5,fontWeight:700}}><Shield size={12}/>Admin</button>
            {isSA(role)&&<button onClick={()=>setShowSASettings(true)} style={{...btn(),padding:"6px 8px"}}><Settings size={12}/></button>}
          </>}
          <button onClick={()=>{setForm(emptyForm());setShowAdd(true)}} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),display:"flex",alignItems:"center",gap:5,padding:"6px 11px",fontWeight:700}}><Plus size={12}/>{!isMobile&&"Tambah"}</button>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 9px",background:"#0D1120",border:`1px solid ${roleInfo.color}33`,borderRadius:8}}>
            <span style={{fontSize:13}}>{roleInfo.icon}</span>
            <div><div style={{fontSize:10,fontWeight:700,color:roleInfo.color}}>{userName.split(" ")[0]}</div></div>
            <button onClick={()=>setShowChangePinModal(true)} title="Ganti PIN" style={{background:"none",border:"none",cursor:"pointer",color:"#374151",padding:"2px"}}><Lock size={11}/></button>
            <button onClick={handleLogout} title="Logout" style={{background:"none",border:"none",cursor:"pointer",color:"#374151",padding:"2px"}}><LogOut size={11}/></button>
          </div>
        </div>
        {lastSaved&&!isMobile&&<span style={{fontSize:9,color:"#1E2A40",whiteSpace:"nowrap"}}>✓ {lastSaved}</span>}
      </div>

      {/* MOBILE SEARCH BAR */}
      {isMobile&&<div style={{padding:"8px 12px",background:"#0A0D18",borderBottom:"1px solid #151D30",display:"flex",gap:8}}>
        <div style={{position:"relative",flex:1}}><Search size={12} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#374151"}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari deal..." style={{...inp,paddingLeft:28,fontSize:12}}/></div>
        <select value={repFilter} onChange={e=>setRepFilter(e.target.value)} style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,padding:"6px 8px",color:"#CBD5E1",fontSize:11,outline:"none"}}><option>Semua</option>{team.filter(t=>!t.isArchived).map(t=><option key={t.name}>{t.name.split(" ")[0]}</option>)}</select>
      </div>}

      {/* DESKTOP TABS */}
      {!isMobile&&<div style={{display:"flex",borderBottom:"1px solid #151D30",background:"#0A0D18",paddingLeft:12}}>
        {TABS.map(t=>{const Icon=t.icon;const active=tab===t.id;return(<button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",borderBottom:active?"2px solid #F59E0B":"2px solid transparent",padding:"8px 12px",color:active?"#F59E0B":"#374151",cursor:"pointer",fontSize:11,fontWeight:active?700:400,display:"flex",alignItems:"center",gap:5,marginBottom:-1,whiteSpace:"nowrap"}}><Icon size={12}/>{t.label}{t.badge>0&&<span style={{background:"#F87171",color:"#fff",borderRadius:10,padding:"1px 5px",fontSize:8,fontWeight:700}}>{t.badge}</span>}</button>);})}
      </div>}

      {/* CONTENT */}
      <MainContent/>

      {/* MOBILE BOTTOM NAV */}
      {isMobile&&<div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0A0D18",borderTop:"1px solid #151D30",display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {TABS.map(t=>{const Icon=t.icon;const active=tab===t.id;return(<button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:"none",border:"none",padding:"10px 0 8px",color:active?"#F59E0B":"#374151",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative"}}>
          <Icon size={20}/><span style={{fontSize:9,fontWeight:active?700:400}}>{t.label}</span>
          {t.badge>0&&<span style={{position:"absolute",top:6,right:"50%",marginRight:-16,background:"#F87171",color:"#fff",borderRadius:10,padding:"1px 5px",fontSize:8,fontWeight:700}}>{t.badge}</span>}
        </button>);})}
      </div>}

      {/* MODALS */}
      {showAdd&&<div style={modal}><div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:16,padding:"20px",width:"100%",maxWidth:450,maxHeight:"92vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,background:"#F59E0B22",border:"1px solid #F59E0B44",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={12} color="#F59E0B"/></div><span style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>Tambah Deal Baru</span></div><button onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#374151"}}><X size={14}/></button></div><DealForm form={form} setForm={setForm} onSave={addDeal} onCancel={()=>setShowAdd(false)} saveLabel="Buat Deal" quickMode={quickMode} setQuickMode={setQuickMode} team={team} products={products} deals={deals}/></div></div>}
      {showAdmin&&isAdm(role)&&<AdminTools team={team} setTeam={handleTeamUpdate} products={products} setProducts={p=>{setProducts(p);addAudit("Update produk");}} auditLog={auditLog} deals={deals} currentUser={currentUser} onClose={()=>setShowAdmin(false)}/>}
      {showSASettings&&isSA(role)&&<SuperAdminSettings settings={settings} setSettings={s=>{setSettings(s);addAudit("Update settings");}} auditLog={auditLog} setAuditLog={al=>{setAuditLog(al);addAudit("Hapus audit log");}} onClose={()=>setShowSASettings(false)}/>}
      {showBin&&isAdm(role)&&<RecycleBin deals={deals} onRestore={restoreDeal} onPermanentDelete={permanentDelete} onClose={()=>setShowBin(false)}/>}
      {showApproval&&isAdm(role)&&<ApprovalPanel deals={deals} onApprove={approveDeal} onReject={rejectDeal} onClose={()=>setShowApproval(false)} currentUser={currentUser}/>}
      {showChangePinModal&&<ChangeOwnPin member={currentUser} onSave={handleOwnPinSaved} onClose={()=>setShowChangePinModal(false)}/>}
    </div>
  );
}
