import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, X, Trash2, Edit3, Sun, Search, MessageCircle, AlertCircle, Clock,
         Users, LayoutGrid, CheckSquare, Download, Upload, RefreshCw, Zap,
         ChevronUp, ChevronDown, Send, TrendingUp, Wifi, WifiOff,
         Shield, UserPlus, UserMinus, LogOut, Key, History, Package } from "lucide-react";

// ═══ CONSTANTS ═══
const STAGES = [
  { id:"prospek",   label:"Prospek",          color:"#64748B", weight:0.10 },
  { id:"survei",    label:"Survei Lapangan",   color:"#A78BFA", weight:0.25 },
  { id:"proposal",  label:"Proposal Terkirim", color:"#60A5FA", weight:0.40 },
  { id:"negosiasi", label:"Negosiasi",         color:"#FBBF24", weight:0.65 },
  { id:"po",        label:"PO Diterima",       color:"#34D399", weight:0.90 },
  { id:"menang",    label:"Menang",            color:"#22C55E", weight:1.00 },
  { id:"kalah",     label:"Kalah",             color:"#F87171", weight:0.00 },
];
const DEF_PRODUCTS = ["Mobile Solar Lighting Tower","Mobile CCTV Tower","Visionify AI System"];
const PRI_LIST     = ["Tinggi","Sedang","Rendah"];
const PRI          = { Tinggi:{text:"#FCA5A5",bg:"#2D1515",border:"#7F1D1D"}, Sedang:{text:"#FCD34D",bg:"#2A1F05",border:"#78350F"}, Rendah:{text:"#6EE7B7",bg:"#052015",border:"#064E3B"} };
const WIN_R        = ["Harga kompetitif","Hubungan baik dengan klien","Demo produk sukses","Spesifikasi teknis sesuai","Referensi dari klien lain"];
const LOSS_R       = ["Kalah harga dari kompetitor","Anggaran klien dipotong","Proyek ditunda","Tidak ada respons","Kompetitor menang tender"];
const RC           = ["#F59E0B","#60A5FA","#A78BFA","#34D399","#F472B6","#38BDF8","#A3E635","#FB923C"];
const LS_SESSION   = "btm_crm_session";
const SHEETS_URL   = "https://script.google.com/macros/s/AKfycbwqxUagiWnRi8vhfljB1-Vrp01kayQzNeUOenUs16YaIhlVBkc-plQoBzs9ZE17KeTD6g/exec";
const DEF_SETTINGS = { adminPin:"1234", team:[], products:DEF_PRODUCTS, targets:{} };

// ═══ HELPERS ═══
const fmtIDR    = v => { const n=Number(v); if(!n)return"IDR 0"; if(n>=1e9)return`IDR ${(n/1e9).toFixed(2)}B`; if(n>=1e6)return`IDR ${Math.round(n/1e6)}M`; return`IDR ${n.toLocaleString("id-ID")}`; };
const daysSince = d => d ? Math.floor((Date.now()-new Date(d).getTime())/86400000) : 0;
const fmtDate   = d => d ? new Date(d).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}) : "-";
const fmtDT     = d => d ? new Date(d).toLocaleString("id-ID",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "-";
const today     = () => new Date().toISOString().split("T")[0];
const initials  = n => (n||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const repColor  = (n,team) => { const i=(team||[]).findIndex(t=>t.name===n); return RC[i>=0?i%RC.length:0]; };
const stageOf   = id => STAGES.find(s=>s.id===id)||STAGES[0];
const isOD      = d => d ? new Date(d) < new Date(today()) : false;
const ageInfo   = d => { const days=daysSince(d); if(days>30)return{c:"#F87171",bg:"#2D1515",label:`${days}h`}; if(days>14)return{c:"#FBBF24",bg:"#2A1F05",label:`${days}h`}; return{c:"#6EE7B7",bg:"#052015",label:`${days}h`}; };

function health(deal) {
  if(deal.stage==="menang") return 100;
  if(deal.stage==="kalah")  return 0;
  let s=60;
  if(deal.priority==="Tinggi") s+=15; else if(deal.priority==="Rendah") s-=10;
  if(isOD(deal.nextActionDate)) s-=20;
  const dc=daysSince(deal.lastContactedDate); if(dc>30) s-=15; else if(dc>14) s-=8;
  const sa=daysSince(deal.stageEnteredAt);    if(sa>30) s-=15; else if(sa>14) s-=8;
  if(deal.stage==="po") s+=15;
  return Math.max(0,Math.min(100,s));
}
const hColor = s => s>=70?"#22C55E":s>=40?"#FBBF24":"#F87171";

function waMsg(deal) {
  const c=deal.contacts?.[0]?.name||"Bapak/Ibu",r=deal.assignedTo,p=deal.product,site=deal.siteLocation||"lokasi tambang";
  const t={prospek:`Selamat siang, ${c}. Perkenalkan saya ${r} dari BTM Energi Nusantara. Kami spesialis ${p} untuk operasional tambang. Ada waktu 10 menit untuk diskusi?`,survei:`Selamat siang, ${c}. Saya ${r} dari BTM Energi. Ingin mengkonfirmasi jadwal survei lapangan untuk ${p} di ${site}.`,proposal:`Selamat siang, ${c}. Saya ${r} dari BTM Energi. Menindaklanjuti proposal ${p} yang sudah kami kirimkan.`,negosiasi:`Selamat siang, ${c}. Saya ${r} dari BTM Energi. Melanjutkan diskusi ${p} untuk ${site}. Kami siap menyesuaikan penawaran.`,po:`Selamat siang, ${c}. Terima kasih atas kepercayaan kepada BTM Energi. Ingin konfirmasi detail pengiriman ${p} ke ${site}.`,menang:`Selamat siang, ${c}. Terima kasih sudah bermitra dengan BTM Energi.`,kalah:`Selamat siang, ${c}. Saya ${r} dari BTM Energi. Terima kasih atas kesempatan sebelumnya. Semoga ada peluang ke depan.`};
  return t[deal.stage]||t.prospek;
}
const waLink  = d => `https://wa.me/${d.contacts?.[0]?.phone||""}?text=${encodeURIComponent(waMsg(d))}`;
const migrate = d => ({...d,contacts:d.contacts||[{name:d.contact||"",role:"Procurement Manager",phone:d.phone||""}],stageHistory:d.stageHistory||[{stage:d.stage,date:d.createdAt||today(),movedBy:d.assignedTo}]});

async function sheetsGet() { const res=await fetch(SHEETS_URL,{redirect:"follow"}); return res.json(); }
async function sheetsPost(data) { await fetch(SHEETS_URL,{method:"POST",body:JSON.stringify(data),redirect:"follow"}); }

// ═══ STYLES ═══
const inp = {background:"#0D1120",border:"1px solid #252D42",borderRadius:8,padding:"8px 12px",color:"#CBD5E1",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none"};
const lbl = {fontSize:10,color:"#475569",marginBottom:5,display:"block",letterSpacing:"0.07em",fontWeight:600};
const btn = (bg="#1A2235",tc="#94A3B8",bc="#252D42") => ({background:bg,border:`1px solid ${bc}`,borderRadius:8,padding:"8px 14px",color:tc,cursor:"pointer",fontSize:12,fontWeight:600});

// ═══ LOGIN ═══
function LoginScreen({ settings, onLogin }) {
  const [role,setRole]         = useState(null);
  const [name,setName]         = useState("");
  const [err,setErr]           = useState("");
  const [pinDigits,setPinDigits] = useState(["","","",""]);
  const refs = [useRef(),useRef(),useRef(),useRef()];

  const handlePinDigit = (i,v) => {
    if(!/^\d?$/.test(v)) return;
    const d=[...pinDigits]; d[i]=v; setPinDigits(d);
    if(v&&i<3) refs[i+1].current?.focus();
    if(d.every(x=>x)) {
      const full=d.join("");
      if(full===(settings.adminPin||"1234")) { onLogin("admin","Admin"); }
      else { setErr("PIN salah"); setPinDigits(["","","",""]); setTimeout(()=>refs[0].current?.focus(),100); }
    }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#070A12",padding:20}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:56,height:56,background:"linear-gradient(135deg,#F59E0B,#D97706)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Sun size={28} color="#0A0D18"/></div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9",marginBottom:4}}>BTM Energi Nusantara</div>
          <div style={{fontSize:11,color:"#374151",fontWeight:600,letterSpacing:"0.07em"}}>SISTEM CRM PENJUALAN</div>
        </div>

        {!role&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{fontSize:12,color:"#475569",textAlign:"center",marginBottom:4}}>Masuk sebagai:</div>
            <button onClick={()=>setRole("admin")} style={{background:"#0D1120",border:"1px solid #F59E0B44",borderRadius:12,padding:"18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left"}}>
              <div style={{width:42,height:42,background:"#F59E0B22",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Shield size={20} color="#F59E0B"/></div>
              <div><div style={{fontSize:14,fontWeight:700,color:"#F59E0B",marginBottom:3}}>Admin</div><div style={{fontSize:11,color:"#374151"}}>Tambah, hapus deal & kelola tim</div></div>
            </button>
            <button onClick={()=>setRole("user")} style={{background:"#0D1120",border:"1px solid #60A5FA44",borderRadius:12,padding:"18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left"}}>
              <div style={{width:42,height:42,background:"#60A5FA22",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Users size={20} color="#60A5FA"/></div>
              <div><div style={{fontSize:14,fontWeight:700,color:"#60A5FA",marginBottom:3}}>Sales</div><div style={{fontSize:11,color:"#374151"}}>Edit dan update deal</div></div>
            </button>
          </div>
        )}

        {role==="admin"&&(
          <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:14,padding:"24px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <button onClick={()=>{setRole(null);setErr("");setPinDigits(["","","",""]);}} style={{background:"none",border:"none",cursor:"pointer",color:"#374151"}}><X size={14}/></button>
              <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>Masuk sebagai Admin</div>
            </div>
            <div style={{fontSize:11,color:"#475569",textAlign:"center",marginBottom:16}}>Masukkan PIN Admin (4 digit)</div>
            <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:14}}>
              {pinDigits.map((d,i)=>(
                <input key={i} ref={refs[i]} type="password" inputMode="numeric" maxLength={1} value={d}
                  onChange={e=>handlePinDigit(i,e.target.value)}
                  onKeyDown={e=>{if(e.key==="Backspace"&&!d&&i>0){refs[i-1].current?.focus();const nd=[...pinDigits];nd[i-1]="";setPinDigits(nd);}}}
                  style={{width:52,height:52,background:"#080D18",border:`1px solid ${err?"#7F1D1D":"#252D42"}`,borderRadius:10,color:"#F1F5F9",fontSize:24,textAlign:"center",outline:"none"}}/>
              ))}
            </div>
            {err&&<div style={{textAlign:"center",fontSize:12,color:"#F87171",marginBottom:8}}>{err}</div>}
            <div style={{textAlign:"center",fontSize:10,color:"#1E2A40"}}>PIN default: 1234 — ubah di Admin Panel setelah masuk</div>
          </div>
        )}

        {role==="user"&&(
          <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:14,padding:"24px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <button onClick={()=>{setRole(null);setErr("");setName("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#374151"}}><X size={14}/></button>
              <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>Masuk sebagai Sales</div>
            </div>
            {(settings.team||[]).length===0?(
              <div style={{textAlign:"center",padding:"20px 0",color:"#374151",fontSize:12}}>Belum ada anggota tim.<br/>Minta Admin untuk menambahkan namamu dulu.</div>
            ):(
              <>
                <div style={{fontSize:11,color:"#475569",marginBottom:12}}>Pilih namamu:</div>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                  {(settings.team||[]).map((m,i)=>(
                    <button key={i} onClick={()=>setName(m.name)} style={{background:name===m.name?"#60A5FA22":"#080D18",border:`1px solid ${name===m.name?"#60A5FA":"#1A2235"}`,borderRadius:9,padding:"11px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                      <div style={{width:30,height:30,borderRadius:"50%",background:RC[i%RC.length]+"22",border:`1px solid ${RC[i%RC.length]}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:RC[i%RC.length]}}>{initials(m.name)}</div>
                      <div><div style={{fontSize:12,fontWeight:700,color:"#E2E8F0"}}>{m.name}</div><div style={{fontSize:10,color:"#374151"}}>{m.role||"Sales"}</div></div>
                      {name===m.name&&<div style={{marginLeft:"auto",color:"#60A5FA",fontSize:16}}>✓</div>}
                    </button>
                  ))}
                </div>
                {err&&<div style={{fontSize:12,color:"#F87171",marginBottom:8}}>{err}</div>}
                <button onClick={()=>{if(!name){setErr("Pilih namamu dulu");return;}onLogin("user",name);}} style={{...btn("#60A5FA","#0A0C14","#60A5FA"),width:"100%",fontWeight:700,padding:"11px"}}>Masuk</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ ADMIN PANEL ═══
function AdminPanel({ settings, setSettings, auditLog, onAddLog, onClose }) {
  const [activeTab,setActiveTab] = useState("team");
  const [newMember,setNewMember] = useState({name:"",role:"Sales"});
  const [newProduct,setNewProduct] = useState("");
  const [newPin,setNewPin]       = useState("");
  const [confirmPin,setConfirmPin] = useState("");
  const [pinMsg,setPinMsg]       = useState("");

  const addMember = () => {
    if(!newMember.name.trim()) return;
    setSettings(s=>({...s,team:[...s.team,{name:newMember.name.trim(),role:newMember.role}],targets:{...s.targets,[newMember.name.trim()]:1000000000}}));
    onAddLog({action:"Tambah anggota tim",detail:newMember.name.trim(),by:"Admin"});
    setNewMember({name:"",role:"Sales"});
  };
  const removeMember = name => {
    if(!window.confirm(`Hapus ${name} dari tim?`)) return;
    setSettings(s=>({...s,team:s.team.filter(m=>m.name!==name)}));
    onAddLog({action:"Hapus anggota tim",detail:name,by:"Admin"});
  };
  const addProduct = () => {
    if(!newProduct.trim()) return;
    setSettings(s=>({...s,products:[...(s.products||[]),newProduct.trim()]}));
    onAddLog({action:"Tambah produk",detail:newProduct.trim(),by:"Admin"});
    setNewProduct("");
  };
  const removeProduct = p => {
    setSettings(s=>({...s,products:(s.products||[]).filter(x=>x!==p)}));
    onAddLog({action:"Hapus produk",detail:p,by:"Admin"});
  };
  const changePin = () => {
    if(newPin.length<4){setPinMsg("PIN minimal 4 digit");return;}
    if(newPin!==confirmPin){setPinMsg("PIN tidak cocok");return;}
    setSettings(s=>({...s,adminPin:newPin}));
    onAddLog({action:"PIN Admin diubah",detail:"",by:"Admin"});
    setNewPin("");setConfirmPin("");setPinMsg("✓ PIN berhasil diubah");
    setTimeout(()=>setPinMsg(""),3000);
  };

  const TABS=[{id:"team",label:"Anggota Tim",icon:Users},{id:"products",label:"Produk",icon:Package},{id:"targets",label:"Target",icon:TrendingUp},{id:"security",label:"Keamanan",icon:Key},{id:"audit",label:"Riwayat",icon:History}];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:16}}>
      <div style={{background:"#0A0D18",border:"1px solid #1A2235",borderRadius:16,width:"100%",maxWidth:600,maxHeight:"92vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"15px 20px",borderBottom:"1px solid #151D30",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,background:"#F59E0B22",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}><Shield size={14} color="#F59E0B"/></div>
          <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9",flex:1}}>Admin Panel</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#374151"}}><X size={15}/></button>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid #151D30",overflowX:"auto"}}>
          {TABS.map(t=>{const Icon=t.icon;const active=activeTab===t.id;return(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{background:"none",border:"none",borderBottom:active?"2px solid #F59E0B":"2px solid transparent",padding:"9px 13px",color:active?"#F59E0B":"#374151",cursor:"pointer",fontSize:11,fontWeight:active?700:400,display:"flex",alignItems:"center",gap:5,marginBottom:-1,whiteSpace:"nowrap"}}>
              <Icon size={12}/>{t.label}
            </button>
          );})}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"18px 20px"}}>

          {activeTab==="team"&&<>
            <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:12}}>ANGGOTA TIM ({(settings.team||[]).length})</div>
            {(settings.team||[]).length===0&&<div style={{background:"#080D18",borderRadius:8,padding:"14px",textAlign:"center",color:"#1E2A40",fontSize:12,marginBottom:16}}>Belum ada anggota. Tambah di bawah.</div>}
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
              {(settings.team||[]).map((m,i)=>(
                <div key={i} style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:9,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:RC[i%RC.length]+"22",border:`1px solid ${RC[i%RC.length]}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:RC[i%RC.length]}}>{initials(m.name)}</div>
                  <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"#E2E8F0"}}>{m.name}</div><div style={{fontSize:10,color:"#374151"}}>{m.role}</div></div>
                  <button onClick={()=>removeMember(m.name)} style={{background:"#200D0D",border:"1px solid #3B1111",borderRadius:6,padding:"5px 8px",cursor:"pointer",color:"#F87171",display:"flex",alignItems:"center",gap:4,fontSize:11}}><UserMinus size={11}/>Hapus</button>
                </div>
              ))}
            </div>
            <div style={{background:"#080D18",border:"1px solid #1A2235",borderRadius:10,padding:"14px"}}>
              <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:10}}>TAMBAH ANGGOTA BARU</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><label style={lbl}>NAMA LENGKAP</label><input value={newMember.name} onChange={e=>setNewMember(p=>({...p,name:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addMember()} style={inp} placeholder="Nama Sales"/></div>
                <div><label style={lbl}>JABATAN</label><input value={newMember.role} onChange={e=>setNewMember(p=>({...p,role:e.target.value}))} style={inp} placeholder="Sales"/></div>
              </div>
              <button onClick={addMember} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),display:"flex",alignItems:"center",gap:6,fontWeight:700}}><UserPlus size={13}/>Tambah Anggota</button>
            </div>
          </>}

          {activeTab==="products"&&<>
            <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:12}}>PRODUK ({(settings.products||[]).length})</div>
            <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:18}}>
              {(settings.products||[]).map((p,i)=>(
                <div key={i} style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:8,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,color:"#E2E8F0"}}>{p}</span>
                  <button onClick={()=>removeProduct(p)} style={{background:"#200D0D",border:"1px solid #3B1111",borderRadius:6,padding:"4px 8px",cursor:"pointer",color:"#F87171",fontSize:11}}>Hapus</button>
                </div>
              ))}
            </div>
            <div style={{background:"#080D18",border:"1px solid #1A2235",borderRadius:10,padding:"14px"}}>
              <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:10}}>TAMBAH PRODUK BARU</div>
              <div style={{display:"flex",gap:8}}>
                <input value={newProduct} onChange={e=>setNewProduct(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addProduct()} style={{...inp,flex:1}} placeholder="Nama produk baru"/>
                <button onClick={addProduct} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),fontWeight:700,whiteSpace:"nowrap"}}>+ Tambah</button>
              </div>
            </div>
          </>}

          {activeTab==="targets"&&<>
            <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:12}}>TARGET BULANAN PER SALES (IDR)</div>
            {(settings.team||[]).length===0&&<div style={{color:"#374151",fontSize:12}}>Tambah anggota tim dulu.</div>}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {(settings.team||[]).map((m,i)=>(
                <div key={i} style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:9,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:RC[i%RC.length]+"22",border:`1px solid ${RC[i%RC.length]}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:RC[i%RC.length]}}>{initials(m.name)}</div>
                  <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"#E2E8F0",marginBottom:5}}>{m.name}</div>
                    <input type="number" value={settings.targets?.[m.name]||1000000000} onChange={e=>setSettings(s=>({...s,targets:{...s.targets,[m.name]:Number(e.target.value)}}))} style={{...inp,fontSize:12,padding:"6px 10px",color:"#F59E0B"}}/>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:10,color:"#374151"}}>Target</div><div style={{fontSize:12,fontWeight:700,color:"#F59E0B"}}>{fmtIDR(settings.targets?.[m.name]||1000000000)}</div></div>
                </div>
              ))}
            </div>
          </>}

          {activeTab==="security"&&<>
            <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:10,padding:"16px",marginBottom:14}}>
              <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:14}}>UBAH PIN ADMIN</div>
              <div style={{marginBottom:10}}><label style={lbl}>PIN BARU (min. 4 digit)</label><input type="password" value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,""))} style={inp} placeholder="xxxx" maxLength={8}/></div>
              <div style={{marginBottom:14}}><label style={lbl}>KONFIRMASI PIN BARU</label><input type="password" value={confirmPin} onChange={e=>setConfirmPin(e.target.value.replace(/\D/g,""))} style={inp} placeholder="xxxx" maxLength={8}/></div>
              {pinMsg&&<div style={{fontSize:12,color:pinMsg.startsWith("✓")?"#6EE7B7":"#F87171",marginBottom:10}}>{pinMsg}</div>}
              <button onClick={changePin} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),fontWeight:700}}>Simpan PIN Baru</button>
            </div>
            <div style={{background:"#080D18",borderRadius:8,padding:"12px",border:"1px solid #1A2235",fontSize:11,color:"#374151",lineHeight:1.7}}>⚠️ Simpan PIN di tempat aman. Kalau PIN lupa, hubungi developer untuk reset.</div>
          </>}

          {activeTab==="audit"&&<>
            <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:12}}>RIWAYAT AKTIVITAS ({auditLog.length})</div>
            {auditLog.length===0&&<div style={{color:"#1E2A40",fontSize:12,textAlign:"center",padding:"20px"}}>Belum ada aktivitas.</div>}
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {[...auditLog].reverse().map((log,i)=>(
                <div key={i} style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:8,padding:"10px 12px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:3}}>
                    <span style={{fontSize:12,fontWeight:700,color:"#E2E8F0"}}>{log.action}</span>
                    <span style={{fontSize:10,color:"#374151",whiteSpace:"nowrap"}}>{fmtDT(log.timestamp)}</span>
                  </div>
                  {log.detail&&<div style={{fontSize:11,color:"#64748B"}}>{log.detail}</div>}
                  <div style={{fontSize:10,color:"#374151",marginTop:3}}>oleh: <span style={{color:"#F59E0B"}}>{log.by}</span></div>
                </div>
              ))}
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

// ═══ DEAL FORM ═══
function DealForm({form,setForm,onSave,onCancel,saveLabel="Simpan",quickMode=false,setQuickMode,products,team}) {
  const isClose=form.stage==="menang"||form.stage==="kalah";
  const fi=(label,key,extra)=>(
    <div style={{marginBottom:11}}>
      <label style={lbl}>{label}</label>
      {extra?.opts?<select value={form[key]||""} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={inp}>{extra.opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select>
        :<input type={extra?.type||"text"} value={form[key]||""} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={inp} placeholder={extra?.ph}/>}
    </div>
  );
  const setPrimPhone=v=>setForm(p=>({...p,contacts:(p.contacts||[{name:"",role:"Procurement Manager",phone:""}]).map((c,i)=>i===0?{...c,phone:v}:c)}));
  const setPrimName=v=>setForm(p=>({...p,contacts:(p.contacts||[{name:"",role:"Procurement Manager",phone:""}]).map((c,i)=>i===0?{...c,name:v}:c)}));
  return (
    <div>
      {setQuickMode&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"8px 10px",background:"#080D18",borderRadius:8}}>
        <Zap size={12} color="#FBBF24"/><span style={{fontSize:11,color:"#64748B",flex:1}}>Mode cepat</span>
        <button onClick={()=>setQuickMode(!quickMode)} style={{background:quickMode?"#F59E0B22":"#1A2235",border:`1px solid ${quickMode?"#F59E0B":"#252D42"}`,borderRadius:6,padding:"3px 10px",fontSize:10,color:quickMode?"#F59E0B":"#64748B",cursor:"pointer",fontWeight:700}}>{quickMode?"AKTIF":"NONAKTIF"}</button>
      </div>}
      {fi("NAMA PERUSAHAAN","company",{ph:"PT. Nama Perusahaan"})}
      <div style={{marginBottom:11}}>
        <label style={lbl}>KONTAK UTAMA</label>
        <input value={form.contacts?.[0]?.name||""} onChange={e=>setPrimName(e.target.value)} style={{...inp,marginBottom:6}} placeholder="Nama lengkap"/>
        <input value={form.contacts?.[0]?.phone||""} onChange={e=>setPrimPhone(e.target.value)} style={inp} placeholder="628xxxxxxxxxx"/>
      </div>
      {fi("PRODUK","product",{opts:(products||DEF_PRODUCTS)})}
      {fi("DITANGANI OLEH","assignedTo",{opts:(team||[]).map(m=>m.name)})}
      {!quickMode&&<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:11}}>
          <div><label style={lbl}>JUMLAH UNIT</label><input type="number" value={form.qty||1} onChange={e=>setForm(p=>({...p,qty:e.target.value}))} style={inp} min={1}/></div>
          <div><label style={lbl}>NILAI DEAL (IDR)</label><input type="number" value={form.value||""} onChange={e=>setForm(p=>({...p,value:e.target.value}))} style={inp} placeholder="500000000"/></div>
        </div>
        {fi("STAGE","stage",{opts:STAGES.map(s=>({v:s.id,l:s.label}))})}
        {isClose&&fi(form.stage==="menang"?"ALASAN MENANG":"ALASAN KALAH","winLossReason",{opts:form.stage==="menang"?WIN_R:LOSS_R})}
        {fi("PRIORITAS","priority",{opts:PRI_LIST})}
        {fi("LOKASI TAMBANG / PROYEK","siteLocation",{ph:"Tambang Batu Bara, Kalimantan Timur"})}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:11}}>
          <div><label style={lbl}>TGL AKSI BERIKUTNYA</label><input type="date" value={form.nextActionDate||""} onChange={e=>setForm(p=>({...p,nextActionDate:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>TERAKHIR DIHUBUNGI</label><input type="date" value={form.lastContactedDate||""} onChange={e=>setForm(p=>({...p,lastContactedDate:e.target.value}))} style={inp}/></div>
        </div>
        <div style={{marginBottom:11}}><label style={lbl}>AKSI BERIKUTNYA</label><input value={form.nextAction||""} onChange={e=>setForm(p=>({...p,nextAction:e.target.value}))} style={inp} placeholder="Apa yang perlu dilakukan?"/></div>
        <div style={{marginBottom:11}}><label style={lbl}>LINK PROPOSAL (Google Drive)</label><input value={form.proposalLink||""} onChange={e=>setForm(p=>({...p,proposalLink:e.target.value}))} style={inp} placeholder="https://drive.google.com/..."/></div>
        <div style={{marginBottom:16}}><label style={lbl}>CATATAN</label><textarea value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{...inp,minHeight:60,resize:"vertical"}} placeholder="Konteks, kebutuhan, decision maker..."/></div>
      </>}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={btn()}>Batal</button>
        <button onClick={onSave} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),fontWeight:700}}>{saveLabel}</button>
      </div>
    </div>
  );
}

// ═══ QUICK UPDATE ═══
function QuickUpdateModal({deal,onUpdate,onClose,currentUser}) {
  const [done,setDone]=useState("");const [next,setNext]=useState(deal.nextAction||"");const [date,setDate]=useState("");
  const submit=()=>{const nc=done.trim()?{text:`✓ ${done.trim()}`,author:currentUser,date:today()}:null;onUpdate({...deal,nextAction:next,nextActionDate:date,lastContactedDate:today(),comments:nc?[...(deal.comments||[]),nc]:deal.comments});onClose();};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:16}}>
      <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:14,padding:"20px",width:"100%",maxWidth:420}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div><div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>Update Cepat</div><div style={{fontSize:11,color:"#374151"}}>{deal.company}</div></div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#374151"}}><X size={14}/></button>
        </div>
        <div style={{marginBottom:11}}><label style={lbl}>APA YANG SUDAH DILAKUKAN?</label><textarea value={done} onChange={e=>setDone(e.target.value)} style={{...inp,minHeight:55,resize:"vertical"}} placeholder="Sudah telepon, kirim email, meeting..."/></div>
        <div style={{marginBottom:11}}><label style={lbl}>AKSI BERIKUTNYA</label><input value={next} onChange={e=>setNext(e.target.value)} style={inp}/></div>
        <div style={{marginBottom:16}}><label style={lbl}>TANGGAL AKSI BERIKUTNYA</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp}/></div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={btn()}>Batal</button>
          <button onClick={submit} style={{...btn("#22C55E","#0A0C14","#22C55E"),fontWeight:700}}>✓ Selesai + Simpan</button>
        </div>
      </div>
    </div>
  );
}

// ═══ DEAL PANEL ═══
function DealPanel({deal,onUpdate,onDelete,onClose,isAdmin,currentUser,team,products}) {
  const [editing,setEditing]=useState(false);const [form,setForm]=useState({...deal});const [commentText,setComment]=useState("");
  useEffect(()=>{setForm({...deal});setEditing(false);},[deal.id]);
  const s=stageOf(deal.stage);const hs=health(deal);const age=ageInfo(deal.stageEnteredAt);const rc=repColor(deal.assignedTo,team);
  const contacts=deal.contacts||[{name:deal.contact||"",role:"",phone:deal.phone||""}];
  const save=()=>{const same=form.stage===deal.stage;onUpdate({...form,value:Number(form.value),qty:Number(form.qty),stageEnteredAt:same?deal.stageEnteredAt:today(),stageHistory:same?deal.stageHistory:[...(deal.stageHistory||[]),{stage:form.stage,date:today(),movedBy:currentUser}]});setEditing(false);};
  const changeStage=sid=>onUpdate({...deal,stage:sid,stageEnteredAt:today(),stageHistory:[...(deal.stageHistory||[]),{stage:sid,date:today(),movedBy:currentUser}]});
  const addComment=()=>{if(!commentText.trim())return;onUpdate({...deal,comments:[...(deal.comments||[]),{text:commentText.trim(),author:currentUser,date:today()}]});setComment("");};
  return(
    <div style={{width:320,flexShrink:0,background:"#0A0D18",borderLeft:"1px solid #151D30",display:"flex",flexDirection:"column",overflowY:"auto"}}>
      <div style={{padding:"13px 16px",borderBottom:"1px solid #151D30",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#0A0D18",zIndex:5}}>
        <span style={{fontSize:10,fontWeight:700,color:"#374151",letterSpacing:"0.07em"}}>DETAIL DEAL</span>
        <div style={{display:"flex",gap:5}}>
          {!editing&&<button onClick={()=>{setForm({...deal});setEditing(true)}} style={{...btn(),padding:"4px 7px"}}><Edit3 size={11}/></button>}
          {isAdmin&&<button onClick={()=>onDelete(deal.id)} style={{...btn("#200D0D","#F87171","#3B1111"),padding:"4px 7px"}}><Trash2 size={11}/></button>}
          <button onClick={onClose} style={{...btn(),padding:"4px 7px"}}><X size={11}/></button>
        </div>
      </div>
      <div style={{padding:"14px 16px",flex:1}}>
        {editing?<DealForm form={form} setForm={setForm} onSave={save} onCancel={()=>setEditing(false)} saveLabel="Simpan Perubahan" products={products} team={team}/>:<>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:800,color:"#F1F5F9",lineHeight:1.3,marginBottom:7}}>{deal.company}</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              <span style={{background:s.color+"22",color:s.color,borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:700}}>{s.label}</span>
              <span style={{background:PRI[deal.priority]?.bg,color:PRI[deal.priority]?.text,border:`1px solid ${PRI[deal.priority]?.border}`,borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:700}}>{deal.priority}</span>
              <span style={{background:age.bg,color:age.c,borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:700}}>⏱{age.label}</span>
              <span style={{background:hColor(hs)+"22",color:hColor(hs),borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:700}}>♥{hs}</span>
            </div>
          </div>
          <div style={{fontSize:24,fontWeight:800,color:"#F59E0B",marginBottom:14,letterSpacing:"-0.02em"}}>{fmtIDR(deal.value)}</div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>KONTAK</div>
            {contacts.map((c,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:9,marginBottom:6,padding:"8px 10px",background:"#0D1120",border:"1px solid #1A2235",borderRadius:8}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:rc+"22",border:`1px solid ${rc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:rc,flexShrink:0}}>{initials(c.name||"?")}</div>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:700,color:"#E2E8F0"}}>{c.name||"-"}</div><div style={{fontSize:10,color:"#374151"}}>{c.role}</div></div>
                {c.phone&&<a href={`https://wa.me/${c.phone}?text=${encodeURIComponent(waMsg(deal))}`} target="_blank" rel="noopener noreferrer" style={{background:"#052015",border:"1px solid #064E3B",borderRadius:7,padding:"5px 8px",display:"flex",alignItems:"center",gap:4,textDecoration:"none"}}><MessageCircle size={11} color="#6EE7B7"/><span style={{fontSize:9,color:"#6EE7B7",fontWeight:700}}>WA</span></a>}
              </div>
            ))}
          </div>
          {[["Produk",deal.product],["Jumlah",`${deal.qty} unit`],["Lokasi",deal.siteLocation||"-"],["Sales",deal.assignedTo],["Terakhir Dihubungi",fmtDate(deal.lastContactedDate)]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #111928"}}><span style={{fontSize:11,color:"#374151",fontWeight:600}}>{k}</span><span style={{fontSize:11,color:"#94A3B8",textAlign:"right",maxWidth:175}}>{v}</span></div>
          ))}
          {deal.winLossReason&&<div style={{marginTop:10,padding:"7px 10px",background:deal.stage==="menang"?"#052015":"#2D1515",border:`1px solid ${deal.stage==="menang"?"#064E3B":"#7F1D1D"}`,borderRadius:7,fontSize:11,color:deal.stage==="menang"?"#6EE7B7":"#FCA5A5"}}>{deal.stage==="menang"?"✓":"✗"} {deal.winLossReason}</div>}
          {deal.proposalLink&&<a href={deal.proposalLink} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:5,marginTop:10,padding:"7px 10px",background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,textDecoration:"none",fontSize:11,color:"#60A5FA"}}>📎 Lihat Proposal</a>}
          <div style={{marginTop:13}}>
            <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:6}}>AKSI BERIKUTNYA</div>
            <div style={{background:"#0D1120",border:`1px solid ${isOD(deal.nextActionDate)?"#7F1D1D":"#1A2235"}`,borderRadius:7,padding:"9px 11px",fontSize:12,color:isOD(deal.nextActionDate)?"#FCA5A5":"#FBBF24",lineHeight:1.5}}>
              {isOD(deal.nextActionDate)&&<div style={{fontSize:9,color:"#F87171",fontWeight:700,marginBottom:3}}>⚠ TERLAMBAT — {fmtDate(deal.nextActionDate)}</div>}
              {!isOD(deal.nextActionDate)&&deal.nextActionDate&&<div style={{fontSize:9,color:"#374151",marginBottom:3}}>📅 {fmtDate(deal.nextActionDate)}</div>}
              {deal.nextAction}
            </div>
          </div>
          {deal.notes&&<div style={{marginTop:10}}><div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:6}}>CATATAN</div><div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,padding:"9px 11px",fontSize:11,color:"#64748B",lineHeight:1.6}}>{deal.notes}</div></div>}
          <div style={{marginTop:14}}>
            <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>PINDAH STAGE</div>
            {STAGES.map(st=>{const active=deal.stage===st.id;return(
              <button key={st.id} onClick={()=>changeStage(st.id)} style={{background:active?st.color+"22":"#0D1120",border:`1px solid ${active?st.color+"88":"#1A2235"}`,borderRadius:6,padding:"6px 10px",fontSize:11,color:active?st.color:"#374151",cursor:"pointer",textAlign:"left",fontWeight:active?700:400,display:"flex",alignItems:"center",gap:7,width:"100%",marginBottom:4}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:st.color}}/>{st.label}{active&&<span style={{marginLeft:"auto",fontSize:9}}>SEKARANG</span>}
              </button>
            );})}
          </div>
          {isAdmin&&(deal.stageHistory||[]).length>0&&<div style={{marginTop:14}}>
            <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>RIWAYAT STAGE</div>
            {[...(deal.stageHistory||[])].reverse().slice(0,5).map((h,i)=>{const st=stageOf(h.stage);return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:7,fontSize:10,color:"#374151",marginBottom:4}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:st.color,flexShrink:0}}/><span style={{color:st.color,fontWeight:600}}>{st.label}</span><span style={{marginLeft:"auto"}}>{fmtDate(h.date)}</span>{h.movedBy&&<span style={{color:"#1E2A40"}}>· {h.movedBy}</span>}
              </div>
            );})}
          </div>}
          <div style={{marginTop:14}}>
            <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:8}}>LOG AKTIVITAS</div>
            {(deal.comments||[]).length===0&&<div style={{fontSize:11,color:"#1E2A40",marginBottom:8}}>Belum ada catatan.</div>}
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:8}}>
              {(deal.comments||[]).map((c,i)=>(
                <div key={i} style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,padding:"8px 10px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:10,fontWeight:700,color:repColor(c.author,team)}}>{c.author}</span><span style={{fontSize:9,color:"#374151"}}>{fmtDate(c.date)}</span></div>
                  <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.5}}>{c.text}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:6}}>
              <input value={commentText} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment()} placeholder="Tambah catatan..." style={{...inp,flex:1,fontSize:12}}/>
              <button onClick={addComment} style={{background:"#F59E0B",border:"none",borderRadius:8,padding:"0 11px",cursor:"pointer"}}><Send size={12} color="#0A0C14"/></button>
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}

// ═══ TODAY TASKS ═══
function TodayTasks({deals,onSelect,onUpdate,currentUser}) {
  const [quickDeal,setQuickDeal]=useState(null);
  const t=today();
  const overdue=deals.filter(d=>!["menang","kalah"].includes(d.stage)&&d.nextActionDate&&d.nextActionDate<=t).sort((a,b)=>Number(b.value)-Number(a.value));
  const reEngage=deals.filter(d=>d.stage==="kalah"&&d.nextActionDate&&d.nextActionDate<=t).sort((a,b)=>Number(b.value)-Number(a.value));
  const upcoming=deals.filter(d=>!["menang","kalah"].includes(d.stage)&&d.nextActionDate&&d.nextActionDate>t).sort((a,b)=>a.nextActionDate.localeCompare(b.nextActionDate)).slice(0,10);
  const Row=({deal,late,isRE})=>{const s=stageOf(deal.stage);return(
    <div style={{background:"#0D1120",border:`1px solid ${late?"#7F1D1D":"#1A2235"}`,borderRadius:10,padding:"11px 13px",display:"flex",gap:10,alignItems:"flex-start"}}>
      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>onSelect(deal)}>
        <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:2}}><span style={{fontSize:12,fontWeight:700,color:"#E2E8F0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{deal.company}</span><span style={{fontSize:12,fontWeight:700,color:"#F59E0B",whiteSpace:"nowrap"}}>{fmtIDR(deal.value)}</span></div>
        <div style={{fontSize:10,color:"#374151",marginBottom:3}}>{deal.assignedTo} · <span style={{color:s.color}}>{s.label}</span></div>
        <div style={{fontSize:11,color:late?"#FCA5A5":"#94A3B8",lineHeight:1.4}}>{late&&"⚠ "}{deal.nextAction}</div>
        {deal.nextActionDate&&<div style={{fontSize:9,color:late?"#F87171":"#374151",marginTop:2}}>{late?"Terlambat: ":isRE?"Re-engage: ":"📅 "}{fmtDate(deal.nextActionDate)}</div>}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
        <a href={waLink(deal)} target="_blank" rel="noopener noreferrer" style={{background:"#052015",border:"1px solid #064E3B",borderRadius:7,padding:"5px 7px",display:"flex",alignItems:"center",gap:3,textDecoration:"none"}}><MessageCircle size={11} color="#6EE7B7"/><span style={{fontSize:9,color:"#6EE7B7",fontWeight:700}}>WA</span></a>
        {!isRE&&<button onClick={()=>setQuickDeal(deal)} style={{background:"#1A2235",border:"1px solid #22C55E44",borderRadius:7,padding:"5px 7px",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}><CheckSquare size={11} color="#22C55E"/><span style={{fontSize:9,color:"#22C55E",fontWeight:700}}>Update</span></button>}
      </div>
    </div>
  );};
  const Section=({title,items,late,icon:Icon,color,isRE})=>(
    <div style={{marginBottom:20}}>
      <div style={{fontSize:10,fontWeight:700,color,letterSpacing:"0.07em",marginBottom:9,display:"flex",alignItems:"center",gap:6}}><Icon size={12} color={color}/>{title} ({items.length})</div>
      {items.length===0?<div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:9,padding:"14px",textAlign:"center",color:"#1E2A40",fontSize:12}}>Tidak ada tugas ✓</div>
        :<div style={{display:"flex",flexDirection:"column",gap:7}}>{items.map(d=><Row key={d.id} deal={d} late={late} isRE={isRE}/>)}</div>}
    </div>
  );
  return(
    <div style={{padding:"16px",maxWidth:700,margin:"0 auto"}}>
      {quickDeal&&<QuickUpdateModal deal={quickDeal} onUpdate={d=>{onUpdate(d);setQuickDeal(null);}} onClose={()=>setQuickDeal(null)} currentUser={currentUser}/>}
      <Section title="TERLAMBAT / JATUH TEMPO HARI INI" items={overdue} late icon={AlertCircle} color="#F87171"/>
      {reEngage.length>0&&<Section title="WAKTUNYA RE-ENGAGE" items={reEngage} isRE icon={RefreshCw} color="#A78BFA"/>}
      <Section title="AKAN DATANG" items={upcoming} icon={Clock} color="#60A5FA"/>
    </div>
  );
}

// ═══ TABLE VIEW ═══
function TableView({deals,onSelect,team}) {
  const [sort,setSort]=useState({col:"value",dir:"desc"});
  const [filter,setFilter]=useState({stage:"Semua",rep:"Semua",pri:"Semua"});
  const toggle=col=>setSort(s=>s.col===col?{col,dir:s.dir==="desc"?"asc":"desc"}:{col,dir:"desc"});
  const sorted=[...deals].filter(d=>(filter.stage==="Semua"||d.stage===filter.stage)&&(filter.rep==="Semua"||d.assignedTo===filter.rep)&&(filter.pri==="Semua"||d.priority===filter.pri)).sort((a,b)=>{const fn={value:(a,b)=>Number(b.value)-Number(a.value),company:(a,b)=>a.company.localeCompare(b.company),stage:(a,b)=>STAGES.findIndex(s=>s.id===a.stage)-STAGES.findIndex(s=>s.id===b.stage),health:(a,b)=>health(b)-health(a),nextActionDate:(a,b)=>(a.nextActionDate||"zz").localeCompare(b.nextActionDate||"zz")};const res=(fn[sort.col]||fn.value)(a,b);return sort.dir==="asc"?-res:res;});
  const Th=({label,col,w})=><th onClick={()=>toggle(col)} style={{padding:"8px 10px",fontSize:9,fontWeight:700,color:sort.col===col?"#F59E0B":"#374151",letterSpacing:"0.06em",textAlign:"left",cursor:"pointer",whiteSpace:"nowrap",width:w,background:"#0A0D18",position:"sticky",top:0}}>{label}{sort.col===col?(sort.dir==="desc"?<ChevronDown size={10}/>:<ChevronUp size={10}/>):null}</th>;
  return(
    <div style={{padding:"12px 14px",flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        {[{label:"Stage",key:"stage",opts:["Semua",...STAGES.map(s=>({v:s.id,l:s.label}))]},{label:"Sales",key:"rep",opts:["Semua",...(team||[]).map(m=>m.name)]},{label:"Prioritas",key:"pri",opts:["Semua",...PRI_LIST]}].map(({label,key,opts})=>(
          <div key={key} style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:10,color:"#374151",fontWeight:600}}>{label}:</span>
            <select value={filter[key]} onChange={e=>setFilter(p=>({...p,[key]:e.target.value}))} style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,padding:"5px 8px",color:"#CBD5E1",fontSize:11,outline:"none"}}>{opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select>
          </div>
        ))}
        <span style={{fontSize:11,color:"#374151",marginLeft:"auto"}}>{sorted.length} deal</span>
      </div>
      <div style={{overflowX:"auto",overflowY:"auto",flex:1}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:650}}>
          <thead><tr style={{borderBottom:"1px solid #151D30"}}><Th label="PERUSAHAAN" col="company" w="20%"/><Th label="SALES" col="assignedTo" w="13%"/><Th label="NILAI" col="value" w="12%"/><Th label="STAGE" col="stage" w="14%"/><Th label="PRI" col="priority" w="8%"/><Th label="SKOR" col="health" w="8%"/><Th label="AKSI BERIKUTNYA" col="nextActionDate" w="25%"/></tr></thead>
          <tbody>
            {sorted.map(deal=>{const s=stageOf(deal.stage);const p=PRI[deal.priority]||PRI.Sedang;const hs=health(deal);const overdue=isOD(deal.nextActionDate);return(
              <tr key={deal.id} onClick={()=>onSelect(deal)} style={{borderBottom:"1px solid #111928",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#0D1120"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"9px 10px"}}><div style={{fontSize:12,fontWeight:700,color:"#E2E8F0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:160}}>{deal.company}</div><div style={{fontSize:10,color:"#374151"}}>{deal.siteLocation}</div></td>
                <td style={{padding:"9px 10px",fontSize:11,color:"#94A3B8"}}>{(deal.assignedTo||"").split(" ")[0]}</td>
                <td style={{padding:"9px 10px",fontSize:12,fontWeight:700,color:"#F59E0B",whiteSpace:"nowrap"}}>{fmtIDR(deal.value)}</td>
                <td style={{padding:"9px 10px"}}><span style={{background:s.color+"22",color:s.color,borderRadius:4,padding:"2px 6px",fontSize:9,fontWeight:700}}>{s.label}</span></td>
                <td style={{padding:"9px 10px"}}><span style={{background:p.bg,color:p.text,borderRadius:4,padding:"2px 5px",fontSize:9,fontWeight:700}}>{deal.priority}</span></td>
                <td style={{padding:"9px 10px"}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{flex:1,height:5,background:"#111928",borderRadius:3,overflow:"hidden",minWidth:28}}><div style={{width:`${hs}%`,height:"100%",background:hColor(hs),borderRadius:3}}/></div><span style={{fontSize:9,fontWeight:700,color:hColor(hs)}}>{hs}</span></div></td>
                <td style={{padding:"9px 10px"}}><div style={{fontSize:11,color:overdue?"#FCA5A5":"#64748B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:190}}>{overdue&&"⚠ "}{deal.nextAction}</div>{deal.nextActionDate&&<div style={{fontSize:9,color:overdue?"#F87171":"#374151"}}>{fmtDate(deal.nextActionDate)}</div>}</td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══ TEAM VIEW ═══
function TeamView({deals,settings}) {
  const totalPipeline=deals.filter(d=>!["kalah"].includes(d.stage)).reduce((a,d)=>a+Number(d.value),0);
  const weightedTotal=deals.filter(d=>d.stage!=="kalah").reduce((a,d)=>a+Number(d.value)*(stageOf(d.stage).weight||0),0);
  return(
    <div style={{padding:"14px 16px",overflowY:"auto"}}>
      {(settings.team||[]).length===0&&<div style={{textAlign:"center",padding:"40px",color:"#374151",fontSize:13}}>Belum ada anggota tim. Tambah di Admin Panel.</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:11,marginBottom:20}}>
        {(settings.team||[]).map((m,i)=>{
          const rd=deals.filter(d=>d.assignedTo===m.name);const active=rd.filter(d=>!["menang","kalah"].includes(d.stage));const won=rd.filter(d=>d.stage==="menang");
          const pipeline=active.reduce((a,d)=>a+Number(d.value),0);const weighted=active.reduce((a,d)=>a+Number(d.value)*(stageOf(d.stage).weight||0),0);const wonVal=won.reduce((a,d)=>a+Number(d.value),0);
          const tgt=settings.targets?.[m.name]||1000000000;const pct=Math.min(Math.round(wonVal/tgt*100),100);
          const stale=active.filter(d=>daysSince(d.stageEnteredAt)>14).length;const overdue=active.filter(d=>isOD(d.nextActionDate)).length;const color=RC[i%RC.length];
          return(
            <div key={i} style={{background:"#0D1120",border:`1px solid ${color}33`,borderRadius:12,padding:"14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:color+"22",border:`1px solid ${color}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color}}>{initials(m.name)}</div>
                <div><div style={{fontSize:12,fontWeight:700,color:"#F1F5F9"}}>{m.name}</div><div style={{fontSize:10,color:"#374151"}}>{active.length} deal aktif · {totalPipeline>0?Math.round(pipeline/totalPipeline*100):0}%</div></div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:4}}><span style={{color:"#374151",fontWeight:600}}>TARGET: {fmtIDR(tgt)}</span><span style={{color:pct>=100?"#22C55E":pct>=60?"#FBBF24":"#F87171",fontWeight:700}}>{pct}%</span></div>
                <div style={{height:6,background:"#111928",borderRadius:3,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:pct>=100?"#22C55E":pct>=60?"#FBBF24":"#F87171",borderRadius:3}}/></div>
                <div style={{fontSize:10,color:"#374151",marginTop:3}}>Menang: {fmtIDR(wonVal)}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
                {[["Pipeline",fmtIDR(pipeline),"#F59E0B"],["Terbobot",fmtIDR(weighted),"#60A5FA"]].map(([l,v,c])=>(
                  <div key={l} style={{background:"#080D18",borderRadius:7,padding:"7px 9px"}}><div style={{fontSize:9,color:"#374151",fontWeight:600,marginBottom:2}}>{l.toUpperCase()}</div><div style={{fontSize:12,fontWeight:700,color:c}}>{v}</div></div>
                ))}
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {overdue>0&&<span style={{background:"#2D1515",color:"#FCA5A5",border:"1px solid #7F1D1D",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:700}}>⚠{overdue} terlambat</span>}
                {stale>0&&<span style={{background:"#2A1F05",color:"#FCD34D",border:"1px solid #78350F",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:700}}>⏱{stale} stagnan</span>}
                {overdue===0&&stale===0&&<span style={{background:"#052015",color:"#6EE7B7",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:700}}>✓ On track</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:12,padding:"14px"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#374151",letterSpacing:"0.07em",marginBottom:12}}>FUNNEL PIPELINE</div>
        {STAGES.filter(s=>s.id!=="kalah").map(stage=>{const sd=deals.filter(d=>d.stage===stage.id);const sv=sd.reduce((a,d)=>a+Number(d.value),0);const wv=sv*stage.weight;const pct=totalPipeline>0?Math.min(sv/totalPipeline*100,100):0;return(
          <div key={stage.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:stage.color,flexShrink:0}}/><div style={{width:110,fontSize:10,color:"#64748B",flexShrink:0}}>{stage.label}</div>
            <div style={{flex:1,height:8,background:"#111928",borderRadius:4,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:stage.color,borderRadius:4}}/></div>
            <div style={{width:80,fontSize:10,color:"#94A3B8",textAlign:"right",flexShrink:0}}>{fmtIDR(wv)}</div><div style={{width:20,fontSize:9,color:stage.color,fontWeight:700,textAlign:"right"}}>{sd.length}</div>
          </div>
        );})}
        <div style={{marginTop:11,padding:"9px 11px",background:"#080D18",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:"#64748B"}}>Estimasi Revenue (Terbobot)</span>
          <span style={{fontSize:14,fontWeight:800,color:"#F59E0B"}}>{fmtIDR(weightedTotal)}</span>
        </div>
      </div>
    </div>
  );
}

// ═══ MAIN ═══
export default function App() {
  const [session,setSession]     = useState(()=>{try{return JSON.parse(sessionStorage.getItem(LS_SESSION)||"null");}catch{return null;}});
  const [deals,setDeals]         = useState([]);
  const [settings,setSettings]   = useState(DEF_SETTINGS);
  const [auditLog,setAuditLog]   = useState([]);
  const [selected,setSelected]   = useState(null);
  const [showAdd,setShowAdd]     = useState(false);
  const [showAdmin,setShowAdmin] = useState(false);
  const [quickMode,setQuickMode] = useState(false);
  const [form,setForm]           = useState({});
  const [dragId,setDragId]       = useState(null);
  const [dragOver,setDragOver]   = useState(null);
  const [search,setSearch]       = useState("");
  const [repFilter,setRepFilter] = useState("Semua");
  const [tab,setTab]             = useState("papan");
  const [loading,setLoading]     = useState(true);
  const [syncing,setSyncing]     = useState(false);
  const [online,setOnline]       = useState(true);
  const [lastSaved,setLastSaved] = useState("");
  const nextId  = useRef(1);
  const saveTimer = useRef(null);
  const importRef = useRef(null);
  const isAdmin = session?.role==="admin";

  const emptyForm = useCallback(()=>({company:"",contacts:[{name:"",role:"Procurement Manager",phone:""}],product:(settings.products||DEF_PRODUCTS)[0]||"",qty:1,value:"",stage:"prospek",priority:"Sedang",assignedTo:(settings.team||[])[0]?.name||"",nextAction:"",nextActionDate:"",lastContactedDate:"",siteLocation:"",proposalLink:"",notes:"",stageEnteredAt:today(),winLossReason:"",stageHistory:[],comments:[],createdAt:today()}),[settings]);

  const addLog = useCallback(entry=>setAuditLog(p=>[...p,{...entry,timestamp:new Date().toISOString()}]),[]);

  const loadData = useCallback(async()=>{
    setLoading(true);
    try{const data=await sheetsGet();if(data.error)throw new Error(data.error);if(data.deals)setDeals(data.deals.map(migrate));if(data.settings)setSettings({...DEF_SETTINGS,...data.settings});if(data.auditLog)setAuditLog(data.auditLog);if(data.deals?.length>0)nextId.current=Math.max(...data.deals.map(d=>d.id))+1;setOnline(true);}
    catch(e){setOnline(false);}
    setLoading(false);
  },[]);

  useEffect(()=>{loadData();},[]);

  const saveData=useCallback(async(d,s,a)=>{
    setSyncing(true);
    try{await sheetsPost({deals:d,settings:s,auditLog:a});setLastSaved(new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}));setOnline(true);}
    catch(e){setOnline(false);}
    setSyncing(false);
  },[]);

  useEffect(()=>{if(loading)return;clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>saveData(deals,settings,auditLog),800);return()=>clearTimeout(saveTimer.current);},[deals,settings,auditLog]);

  const handleLogin=(role,name)=>{const s={role,name};setSession(s);sessionStorage.setItem(LS_SESSION,JSON.stringify(s));addLog({action:"Login",detail:name,by:name});};
  const handleLogout=()=>{sessionStorage.removeItem(LS_SESSION);setSession(null);setSelected(null);};

  const updateDeal=d=>{setDeals(p=>p.map(x=>x.id===d.id?d:x));setSelected(d);addLog({action:"Edit deal",detail:d.company,by:session?.name});};
  const deleteDeal=id=>{const deal=deals.find(d=>d.id===id);if(!window.confirm(`Hapus deal "${deal?.company}"? Tidak bisa dibatalkan.`))return;setDeals(p=>p.filter(x=>x.id!==id));setSelected(null);addLog({action:"Hapus deal",detail:deal?.company,by:session?.name});};
  const addDeal=()=>{const id=nextId.current++;const d={...form,id,value:Number(form.value)||0,qty:Number(form.qty)||1,stageHistory:[{stage:form.stage,date:today(),movedBy:session?.name}],comments:[],createdAt:today()};setDeals(p=>[...p,d]);setForm(emptyForm());setShowAdd(false);addLog({action:"Tambah deal baru",detail:form.company,by:session?.name});};

  const onDragStart=id=>setDragId(id);
  const onDragOver=(sid,e)=>{e.preventDefault();setDragOver(sid);};
  const onDrop=sid=>{if(dragId!=null){const deal=deals.find(d=>d.id===dragId);if(deal){const u={...deal,stage:sid,stageEnteredAt:today(),stageHistory:[...(deal.stageHistory||[]),{stage:sid,date:today(),movedBy:session?.name}]};setDeals(p=>p.map(d=>d.id===dragId?u:d));if(selected?.id===dragId)setSelected(u);addLog({action:`Pindah ke ${stageOf(sid).label}`,detail:deal.company,by:session?.name});}}setDragId(null);setDragOver(null);};

  const exportJSON=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({deals,settings,auditLog,version:"4.0",exportedAt:new Date().toISOString()},null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download=`btm-crm-${today()}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);};
  const importJSON=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(d.deals)setDeals(d.deals.map(migrate));if(d.settings)setSettings({...DEF_SETTINGS,...d.settings});if(d.auditLog)setAuditLog(d.auditLog);addLog({action:"Import data",detail:`${d.deals?.length||0} deals`,by:session?.name});}catch(e){alert("File tidak valid");}};r.readAsText(file);e.target.value="";};

  const visible=deals.filter(d=>(repFilter==="Semua"||d.assignedTo===repFilter)&&[d.company,d.contacts?.[0]?.name||"",d.product,d.notes,d.siteLocation].some(s=>s?.toLowerCase().includes(search.toLowerCase())));
  const byStage=id=>visible.filter(d=>d.stage===id);
  const pipelineVal=deals.filter(d=>!["menang","kalah"].includes(d.stage)).reduce((a,d)=>a+Number(d.value),0);
  const weightedVal=deals.filter(d=>d.stage!=="kalah").reduce((a,d)=>a+Number(d.value)*(stageOf(d.stage).weight||0),0);
  const wonVal=deals.filter(d=>d.stage==="menang").reduce((a,d)=>a+Number(d.value),0);
  const overdueCount=deals.filter(d=>!["menang","kalah"].includes(d.stage)&&isOD(d.nextActionDate)).length;
  const reEngageCount=deals.filter(d=>d.stage==="kalah"&&isOD(d.nextActionDate)).length;

  if(!session) return <LoginScreen settings={settings} onLogin={handleLogin}/>;
  if(loading) return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#070A12",flexDirection:"column",gap:16}}>
      <div style={{width:42,height:42,background:"linear-gradient(135deg,#F59E0B,#D97706)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}><Sun size={22} color="#0A0D18"/></div>
      <div style={{fontSize:13,color:"#374151"}}>Memuat data...</div>
    </div>
  );

  const TABS=[{id:"papan",label:"Papan",icon:LayoutGrid},{id:"tugas",label:"Tugas",icon:CheckSquare,badge:overdueCount+reEngageCount},{id:"tabel",label:"Tabel",icon:TrendingUp},{id:"tim",label:"Tim",icon:Users}];

  return(
    <div style={{background:"#070A12",minHeight:"100vh",color:"#CBD5E1",fontFamily:"ui-sans-serif,system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid #151D30",background:"#0A0D18",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,background:"linear-gradient(135deg,#F59E0B,#D97706)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}><Sun size={15} color="#0A0D18"/></div>
          <div><div style={{fontSize:12,fontWeight:700,color:"#F1F5F9"}}>BTM Energi Nusantara</div><div style={{fontSize:9,color:"#374151",letterSpacing:"0.07em",fontWeight:700}}>CRM PENJUALAN</div></div>
        </div>
        <div style={{flex:1}}/>
        {[["PIPELINE",fmtIDR(pipelineVal),"#F59E0B"],["EST. REVENUE",fmtIDR(weightedVal),"#60A5FA"],["MENANG",fmtIDR(wonVal),"#22C55E"]].map(([l,v,c])=>(
          <div key={l} style={{textAlign:"right"}}><div style={{fontSize:9,color:"#374151",letterSpacing:"0.06em",fontWeight:700}}>{l}</div><div style={{fontSize:12,fontWeight:800,color:c}}>{v}</div></div>
        ))}
        <div style={{position:"relative"}}><Search size={12} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:"#374151"}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari..." style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,padding:"6px 8px 6px 24px",color:"#CBD5E1",fontSize:11,width:120,outline:"none"}}/></div>
        <select value={repFilter} onChange={e=>setRepFilter(e.target.value)} style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,padding:"6px 8px",color:"#CBD5E1",fontSize:11,outline:"none"}}>
          <option>Semua</option>{(settings.team||[]).map(m=><option key={m.name}>{m.name}</option>)}
        </select>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {online?<Wifi size={12} color="#22C55E"/>:<WifiOff size={12} color="#F87171"/>}
          <button onClick={loadData} style={{...btn(),padding:"6px 8px"}} title="Refresh"><RefreshCw size={12} style={{animation:syncing?"spin 1s linear infinite":"none"}}/></button>
          {isAdmin&&<><button onClick={exportJSON} style={{...btn(),padding:"6px 8px"}} title="Export"><Download size={12}/></button><button onClick={()=>importRef.current?.click()} style={{...btn(),padding:"6px 8px"}} title="Import"><Upload size={12}/></button><input ref={importRef} type="file" accept=".json" onChange={importJSON} style={{display:"none"}}/></>}
          {isAdmin&&<button onClick={()=>setShowAdmin(true)} style={{...btn("#F59E0B22","#F59E0B","#F59E0B44"),padding:"6px 10px",display:"flex",alignItems:"center",gap:5,fontWeight:700}}><Shield size={12}/>Admin</button>}
          {isAdmin&&<button onClick={()=>{setForm(emptyForm());setShowAdd(true)}} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),display:"flex",alignItems:"center",gap:5,padding:"6px 11px",fontWeight:700}}><Plus size={12}/>Tambah Deal</button>}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:"#0D1120",border:"1px solid #1A2235",borderRadius:8}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:isAdmin?"#F59E0B22":"#60A5FA22",border:`1px solid ${isAdmin?"#F59E0B":"#60A5FA"}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:isAdmin?"#F59E0B":"#60A5FA"}}>{initials(session.name)}</div>
            <span style={{fontSize:11,color:"#94A3B8"}}>{session.name}</span>
            <button onClick={handleLogout} title="Keluar" style={{background:"none",border:"none",cursor:"pointer",color:"#374151",padding:0,marginLeft:2}}><LogOut size={11}/></button>
          </div>
        </div>
        {lastSaved&&<span style={{fontSize:9,color:"#1E2A40",whiteSpace:"nowrap"}}>✓ {lastSaved}</span>}
      </div>

      <div style={{display:"flex",borderBottom:"1px solid #151D30",background:"#0A0D18",paddingLeft:12}}>
        {TABS.map(t=>{const Icon=t.icon;const active=tab===t.id;return(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",borderBottom:active?"2px solid #F59E0B":"2px solid transparent",padding:"8px 12px",color:active?"#F59E0B":"#374151",cursor:"pointer",fontSize:11,fontWeight:active?700:400,display:"flex",alignItems:"center",gap:5,marginBottom:-1,whiteSpace:"nowrap"}}>
            <Icon size={12}/>{t.label}{t.badge>0&&<span style={{background:"#F87171",color:"#fff",borderRadius:10,padding:"1px 5px",fontSize:8,fontWeight:700}}>{t.badge}</span>}
          </button>
        );})}
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {tab==="papan"&&<>
          <div style={{flex:1,overflowX:"auto",padding:"10px 11px",display:"flex",gap:8,alignItems:"flex-start"}}>
            {STAGES.map(stage=>{
              const cards=byStage(stage.id);const total=cards.reduce((a,d)=>a+Number(d.value),0);const over=dragOver===stage.id;
              return(
                <div key={stage.id} onDragOver={e=>onDragOver(stage.id,e)} onDrop={()=>onDrop(stage.id)} style={{minWidth:205,maxWidth:205,background:over?"#111928":"#0D1120",border:`1px solid ${over?stage.color+"66":"#151D30"}`,borderRadius:12,display:"flex",flexDirection:"column",transition:"border-color 0.12s"}}>
                  <div style={{padding:"9px 11px 7px",borderBottom:"1px solid #151D30"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:stage.color}}/><span style={{fontSize:9,fontWeight:700,color:"#64748B",letterSpacing:"0.07em"}}>{stage.label.toUpperCase()}</span></div>
                      <span style={{background:"#151D30",color:"#475569",borderRadius:20,padding:"1px 6px",fontSize:9,fontWeight:700}}>{cards.length}</span>
                    </div>
                    {cards.length>0&&<div style={{fontSize:10,color:stage.color,fontWeight:700,marginTop:2}}>{fmtIDR(total)}</div>}
                  </div>
                  <div style={{overflowY:"auto",maxHeight:480,padding:"7px",display:"flex",flexDirection:"column",gap:6}}>
                    {cards.map(deal=>{
                      const p=PRI[deal.priority]||PRI.Sedang;const rc=repColor(deal.assignedTo,settings.team);const age=ageInfo(deal.stageEnteredAt);const overdue=isOD(deal.nextActionDate);const hs=health(deal);const isSel=selected?.id===deal.id;
                      return(
                        <div key={deal.id} draggable onDragStart={()=>onDragStart(deal.id)} onClick={()=>setSelected(deal)} style={{background:isSel?"#131B30":"#0F1525",border:`1px solid ${isSel?stage.color+"99":overdue?"#7F1D1D44":"#1A2235"}`,borderRadius:9,padding:"9px 10px",cursor:"pointer",opacity:dragId===deal.id?0.4:1,transition:"all 0.12s"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:5,marginBottom:4}}><span style={{fontSize:11,fontWeight:700,color:"#E2E8F0",lineHeight:1.3}}>{deal.company}</span><span style={{background:p.bg,color:p.text,border:`1px solid ${p.border}`,borderRadius:4,padding:"1px 5px",fontSize:8,fontWeight:700,whiteSpace:"nowrap"}}>{deal.priority}</span></div>
                          <div style={{fontSize:9,color:"#374151",marginBottom:3}}>{(deal.product||"").replace("Mobile ","")} · {deal.qty}u</div>
                          <div style={{fontSize:12,fontWeight:700,color:"#F59E0B",marginBottom:6}}>{fmtIDR(deal.value)}</div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div style={{width:20,height:20,borderRadius:"50%",background:rc+"22",border:`1px solid ${rc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:rc}}>{initials(deal.assignedTo)}</div>
                            <div style={{display:"flex",gap:4,alignItems:"center"}}>
                              {overdue&&<AlertCircle size={10} color="#F87171"/>}
                              <span style={{background:age.bg,color:age.c,borderRadius:4,padding:"1px 4px",fontSize:8,fontWeight:700}}>{age.label}</span>
                              <span style={{background:hColor(hs)+"22",color:hColor(hs),borderRadius:4,padding:"1px 4px",fontSize:8,fontWeight:700}}>♥{hs}</span>
                            </div>
                          </div>
                          {overdue&&<div style={{marginTop:5,fontSize:9,color:"#F87171",fontWeight:600,lineHeight:1.3}}>⚠ {(deal.nextAction||"").slice(0,38)}…</div>}
                        </div>
                      );
                    })}
                    {cards.length===0&&<div style={{padding:"20px 0",textAlign:"center",color:"#1E2A40",fontSize:10}}>Seret deal ke sini</div>}
                  </div>
                </div>
              );
            })}
          </div>
          {selected&&<DealPanel key={selected.id} deal={selected} onUpdate={updateDeal} onDelete={deleteDeal} onClose={()=>setSelected(null)} isAdmin={isAdmin} currentUser={session?.name} team={settings.team||[]} products={settings.products||DEF_PRODUCTS}/>}
        </>}
        {tab==="tugas"&&<div style={{flex:1,overflowY:"auto"}}><TodayTasks deals={visible} onSelect={d=>{setSelected(d);setTab("papan");}} onUpdate={updateDeal} currentUser={session?.name}/></div>}
        {tab==="tabel"&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}><TableView deals={visible} onSelect={d=>{setSelected(d);setTab("papan");}} team={settings.team||[]}/></div>}
        {tab==="tim"&&<div style={{flex:1,overflowY:"auto"}}><TeamView deals={deals} settings={settings}/></div>}
      </div>

      {showAdd&&isAdmin&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
          <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:16,padding:"20px",width:"100%",maxWidth:450,maxHeight:"92vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,background:"#F59E0B22",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={12} color="#F59E0B"/></div><span style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>Tambah Deal Baru</span></div>
              <button onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#374151"}}><X size={14}/></button>
            </div>
            <DealForm form={form} setForm={setForm} onSave={addDeal} onCancel={()=>setShowAdd(false)} saveLabel="Buat Deal" quickMode={quickMode} setQuickMode={setQuickMode} products={settings.products||DEF_PRODUCTS} team={settings.team||[]}/>
          </div>
        </div>
      )}

      {showAdmin&&isAdmin&&<AdminPanel settings={settings} setSettings={setSettings} auditLog={auditLog} onAddLog={addLog} onClose={()=>setShowAdmin(false)}/>}
    </div>
  );
}
