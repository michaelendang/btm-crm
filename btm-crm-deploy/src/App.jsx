import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, X, Trash2, Edit3, Sun, Search, MessageCircle, AlertCircle, Clock,
         Users, LayoutGrid, CheckSquare, Download, Upload, RefreshCw, Zap,
         ChevronUp, ChevronDown, Send, TrendingUp, Wifi, WifiOff, Settings } from "lucide-react";

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
const PRODUCTS = ["Mobile Solar Lighting Tower","Mobile CCTV Tower","Visionify AI System"];
const TEAM     = ["Rizky Pratama","Siti Nurhaliza","Doni Kusuma","Andi Firmansyah"];
const PRI_LIST = ["Tinggi","Sedang","Rendah"];
const PRI      = { Tinggi:{text:"#FCA5A5",bg:"#2D1515",border:"#7F1D1D"}, Sedang:{text:"#FCD34D",bg:"#2A1F05",border:"#78350F"}, Rendah:{text:"#6EE7B7",bg:"#052015",border:"#064E3B"} };
const WIN_R    = ["Harga kompetitif","Hubungan baik dengan klien","Demo produk sukses","Spesifikasi teknis sesuai","Referensi dari klien lain"];
const LOSS_R   = ["Kalah harga dari kompetitor","Anggaran klien dipotong","Proyek ditunda","Tidak ada respons","Kompetitor menang tender"];
const RC       = ["#F59E0B","#60A5FA","#A78BFA","#34D399"];
const DEF_TGT  = {"Rizky Pratama":2000000000,"Siti Nurhaliza":1500000000,"Doni Kusuma":1200000000,"Andi Firmansyah":1000000000};
const LS_URL   = "btm_crm_sheets_url";

// ═══ HELPERS ═══
const fmtIDR   = v => { const n=Number(v); if(!n)return"IDR 0"; if(n>=1e9)return`IDR ${(n/1e9).toFixed(2)}B`; if(n>=1e6)return`IDR ${Math.round(n/1e6)}M`; return`IDR ${n.toLocaleString("id-ID")}`; };
const daysSince= d => d ? Math.floor((Date.now()-new Date(d).getTime())/86400000) : 0;
const fmtDate  = d => d ? new Date(d).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}) : "-";
const today    = () => new Date().toISOString().split("T")[0];
const initials = n => n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const repColor = n => RC[TEAM.indexOf(n)>=0?TEAM.indexOf(n):0];
const stageOf  = id => STAGES.find(s=>s.id===id)||STAGES[0];
const isOD     = d => d ? new Date(d) < new Date(today()) : false;
const ageInfo  = d => { const days=daysSince(d); if(days>30)return{c:"#F87171",bg:"#2D1515",label:`${days}h`}; if(days>14)return{c:"#FBBF24",bg:"#2A1F05",label:`${days}h`}; return{c:"#6EE7B7",bg:"#052015",label:`${days}h`}; };

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
  const c=deal.contacts?.[0]?.name||"Bapak/Ibu", r=deal.assignedTo, p=deal.product, site=deal.siteLocation||"lokasi tambang";
  const t = {
    prospek:   `Selamat siang, ${c}. Perkenalkan saya ${r} dari BTM Energi Nusantara. Kami spesialis ${p} untuk operasional tambang. Ada waktu 10 menit untuk diskusi?`,
    survei:    `Selamat siang, ${c}. Saya ${r} dari BTM Energi. Ingin mengkonfirmasi jadwal survei lapangan untuk ${p} di ${site}. Kapan waktu yang tepat?`,
    proposal:  `Selamat siang, ${c}. Saya ${r} dari BTM Energi. Menindaklanjuti proposal ${p} yang sudah kami kirimkan. Ada yang perlu kami klarifikasi?`,
    negosiasi: `Selamat siang, ${c}. Saya ${r} dari BTM Energi. Melanjutkan diskusi ${p} untuk ${site}. Kami siap menyesuaikan penawaran. Ada waktu hari ini?`,
    po:        `Selamat siang, ${c}. Terima kasih atas kepercayaan kepada BTM Energi. Ingin konfirmasi detail pengiriman ${p} ke ${site}.`,
    menang:    `Selamat siang, ${c}. Terima kasih sudah bermitra dengan BTM Energi. Ingin memastikan semuanya berjalan lancar untuk ${p}.`,
    kalah:     `Selamat siang, ${c}. Saya ${r} dari BTM Energi. Terima kasih atas kesempatan sebelumnya. Semoga ada peluang kerja sama lagi ke depan.`,
  };
  return t[deal.stage]||t.prospek;
}
const waLink = d => `https://wa.me/${d.contacts?.[0]?.phone||""}?text=${encodeURIComponent(waMsg(d))}`;
const migrate = d => ({ ...d, contacts: d.contacts||[{name:d.contact||"",role:"Procurement Manager",phone:d.phone||""}], stageHistory: d.stageHistory||[{stage:d.stage,date:d.createdAt||today(),movedBy:d.assignedTo}] });

// ═══ GOOGLE SHEETS API ═══
async function sheetsGet(url) {
  const res = await fetch(url, { redirect: "follow" });
  return res.json();
}
async function sheetsPost(url, data) {
  // Apps Script requires a GET with query param for CORS-safe POST workaround
  // We use a no-cors POST then re-fetch
  await fetch(url, { method:"POST", body:JSON.stringify(data), redirect:"follow" });
}

// ═══ SEED DATA (first-time only) ═══
const SEED = [
  {id:1,company:"PT. Pamapersada Nusantara",contacts:[{name:"Budi Santoso",role:"Procurement Manager",phone:"6281234567890"},{name:"Darmawan Putra",role:"Site Manager",phone:"6281234567891"}],product:"Mobile Solar Lighting Tower",qty:5,value:850000000,stage:"negosiasi",priority:"Tinggi",assignedTo:"Rizky Pratama",nextAction:"Follow up harga revisi dan konfirmasi termin pembayaran",nextActionDate:"2026-05-10",lastContactedDate:"2026-04-30",siteLocation:"Tambang Batu Bara, Kaltim",proposalLink:"",notes:"5 unit untuk Kalimantan. Budget disetujui procurement.",stageEnteredAt:"2026-03-20",winLossReason:"",stageHistory:[{stage:"prospek",date:"2026-03-01",movedBy:"Rizky Pratama"},{stage:"negosiasi",date:"2026-03-20",movedBy:"Rizky Pratama"}],comments:[{text:"Meeting procurement — minta cicilan 30/70.",author:"Rizky Pratama",date:"2026-04-15"}],createdAt:"2026-03-01"},
  {id:2,company:"PT. Stargate Pasific Resources",contacts:[{name:"Ahmad Fauzi",role:"Procurement Manager",phone:"6281198765432"}],product:"Mobile CCTV Tower",qty:2,value:320000000,stage:"proposal",priority:"Tinggi",assignedTo:"Siti Nurhaliza",nextAction:"Kirim spesifikasi teknis revisi dan dokumen garansi",nextActionDate:"2026-05-12",lastContactedDate:"2026-04-28",siteLocation:"Tambang Batu Bara, Kalsel",proposalLink:"",notes:"2 unit perimeter security. Minta integrasi VMS.",stageEnteredAt:"2026-04-20",winLossReason:"",stageHistory:[{stage:"prospek",date:"2026-04-10",movedBy:"Siti Nurhaliza"},{stage:"proposal",date:"2026-04-20",movedBy:"Siti Nurhaliza"}],comments:[],createdAt:"2026-04-10"},
  {id:3,company:"PT. Freeport Indonesia",contacts:[{name:"James Wattimena",role:"Site Manager",phone:"6285122334455"},{name:"Reza Budiman",role:"Direktur Keuangan",phone:"6285122334456"}],product:"Mobile Solar Lighting Tower",qty:10,value:1700000000,stage:"po",priority:"Tinggi",assignedTo:"Rizky Pratama",nextAction:"Konfirmasi jadwal pengiriman Q3 2026 dengan tim logistik",nextActionDate:"2026-05-20",lastContactedDate:"2026-05-01",siteLocation:"Tambang Emas, Papua",proposalLink:"",notes:"10 unit tambang emas Papua. PO diterima.",stageEnteredAt:"2026-04-10",winLossReason:"",stageHistory:[{stage:"prospek",date:"2026-03-15",movedBy:"Rizky Pratama"},{stage:"po",date:"2026-04-10",movedBy:"Rizky Pratama"}],comments:[{text:"PO diterima. Koordinasi pengiriman berjalan.",author:"Rizky Pratama",date:"2026-04-10"}],createdAt:"2026-03-15"},
];

// ═══ STYLES ═══
const inp = { background:"#0D1120",border:"1px solid #252D42",borderRadius:8,padding:"8px 12px",color:"#CBD5E1",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none" };
const lbl = { fontSize:10,color:"#475569",marginBottom:5,display:"block",letterSpacing:"0.07em",fontWeight:600 };
const btn = (bg="#1A2235",tc="#94A3B8",bc="#252D42") => ({ background:bg,border:`1px solid ${bc}`,borderRadius:8,padding:"8px 14px",color:tc,cursor:"pointer",fontSize:12,fontWeight:600 });

// ═══ SETUP SCREEN ═══
function SetupScreen({ onSave }) {
  const [url, setUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState("");

  const test = async () => {
    if (!url.trim()) { setMsg("Masukkan URL terlebih dahulu."); return; }
    setTesting(true); setMsg("");
    try {
      const data = await sheetsGet(url.trim());
      if (data.error) throw new Error(data.error);
      setMsg("✓ Koneksi berhasil! Klik Simpan untuk lanjut.");
    } catch (e) {
      setMsg("✗ Koneksi gagal. Pastikan URL Apps Script sudah benar dan deployed.");
    }
    setTesting(false);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#070A12",padding:20}}>
      <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:16,padding:28,width:"100%",maxWidth:480}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <div style={{width:42,height:42,background:"linear-gradient(135deg,#F59E0B,#D97706)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}><Sun size={22} color="#0A0D18"/></div>
          <div><div style={{fontSize:16,fontWeight:800,color:"#F1F5F9"}}>BTM Energi Nusantara</div><div style={{fontSize:11,color:"#374151",fontWeight:600}}>Setup Koneksi Database</div></div>
        </div>
        <div style={{padding:"14px",background:"#080D18",borderRadius:10,border:"1px solid #1A2235",marginBottom:20}}>
          <p style={{fontSize:12,color:"#64748B",lineHeight:1.7}}>CRM ini menggunakan <strong style={{color:"#F59E0B"}}>Google Sheets</strong> sebagai database. Ikuti panduan di file <code style={{color:"#60A5FA"}}>PANDUAN-DEPLOY.md</code> untuk mendapatkan URL Apps Script, lalu paste di bawah ini.</p>
        </div>
        <div style={{marginBottom:14}}>
          <label style={lbl}>APPS SCRIPT WEB APP URL</label>
          <input value={url} onChange={e=>setUrl(e.target.value)} style={inp} placeholder="https://script.google.com/macros/s/.../exec"/>
        </div>
        {msg && <div style={{padding:"10px 12px",background:msg.startsWith("✓")?"#052015":"#2D1515",border:`1px solid ${msg.startsWith("✓")?"#064E3B":"#7F1D1D"}`,borderRadius:8,fontSize:12,color:msg.startsWith("✓")?"#6EE7B7":"#FCA5A5",marginBottom:14}}>{msg}</div>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={test} disabled={testing} style={{...btn(),flex:1,opacity:testing?0.6:1}}>{testing?"Menguji...":"Test Koneksi"}</button>
          <button onClick={()=>onSave(url.trim())} disabled={!url.trim()} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),flex:1,fontWeight:700,opacity:url.trim()?1:0.5}}>Simpan & Mulai</button>
        </div>
      </div>
    </div>
  );
}

// ═══ DEAL FORM ═══
function DealForm({ form, setForm, onSave, onCancel, saveLabel="Simpan", quickMode=false, setQuickMode }) {
  const isClose = form.stage==="menang"||form.stage==="kalah";
  const fi = (label,key,extra) => (
    <div style={{marginBottom:11}}>
      <label style={lbl}>{label}</label>
      {extra?.opts ? <select value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={inp}>{extra.opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select>
        : <input type={extra?.type||"text"} value={form[key]||""} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={inp} placeholder={extra?.ph} min={extra?.min}/>}
    </div>
  );
  const setPrimPhone = v => setForm(p=>({...p,contacts:(p.contacts||[{name:"",role:"Procurement Manager",phone:""}]).map((c,i)=>i===0?{...c,phone:v}:c)}));
  const setPrimName  = v => setForm(p=>({...p,contacts:(p.contacts||[{name:"",role:"Procurement Manager",phone:""}]).map((c,i)=>i===0?{...c,name:v}:c)}));

  return (
    <div>
      {setQuickMode && (
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,padding:"8px 10px",background:"#080D18",borderRadius:8}}>
          <Zap size={12} color="#FBBF24"/><span style={{fontSize:11,color:"#64748B",flex:1}}>Mode cepat (4 field saja)</span>
          <button onClick={()=>setQuickMode(!quickMode)} style={{background:quickMode?"#F59E0B22":"#1A2235",border:`1px solid ${quickMode?"#F59E0B":"#252D42"}`,borderRadius:6,padding:"3px 10px",fontSize:10,color:quickMode?"#F59E0B":"#64748B",cursor:"pointer",fontWeight:700}}>{quickMode?"AKTIF":"NONAKTIF"}</button>
        </div>
      )}
      {fi("NAMA PERUSAHAAN","company",{ph:"PT. Nama Perusahaan"})}
      <div style={{marginBottom:11}}>
        <label style={lbl}>KONTAK UTAMA</label>
        <input value={form.contacts?.[0]?.name||""} onChange={e=>setPrimName(e.target.value)} style={{...inp,marginBottom:6}} placeholder="Nama lengkap"/>
        <input value={form.contacts?.[0]?.phone||""} onChange={e=>setPrimPhone(e.target.value)} style={inp} placeholder="628xxxxxxxxxx"/>
      </div>
      {fi("PRODUK","product",{opts:PRODUCTS})}
      {fi("DITANGANI OLEH","assignedTo",{opts:TEAM})}
      {!quickMode && <>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:11}}>
          <div><label style={lbl}>JUMLAH UNIT</label><input type="number" value={form.qty} onChange={e=>setForm(p=>({...p,qty:e.target.value}))} style={inp} min={1}/></div>
          <div><label style={lbl}>NILAI DEAL (IDR)</label><input type="number" value={form.value||""} onChange={e=>setForm(p=>({...p,value:e.target.value}))} style={inp} placeholder="500000000"/></div>
        </div>
        {fi("STAGE","stage",{opts:STAGES.map(s=>({v:s.id,l:s.label}))})}
        {isClose && fi(form.stage==="menang"?"ALASAN MENANG":"ALASAN KALAH","winLossReason",{opts:form.stage==="menang"?WIN_R:LOSS_R})}
        {fi("PRIORITAS","priority",{opts:PRI_LIST})}
        {fi("LOKASI TAMBANG / PROYEK","siteLocation",{ph:"Tambang Batu Bara, Kalimantan Timur"})}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:11}}>
          <div><label style={lbl}>TGL AKSI BERIKUTNYA</label><input type="date" value={form.nextActionDate||""} onChange={e=>setForm(p=>({...p,nextActionDate:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>TERAKHIR DIHUBUNGI</label><input type="date" value={form.lastContactedDate||""} onChange={e=>setForm(p=>({...p,lastContactedDate:e.target.value}))} style={inp}/></div>
        </div>
        <div style={{marginBottom:11}}><label style={lbl}>AKSI BERIKUTNYA</label><input value={form.nextAction||""} onChange={e=>setForm(p=>({...p,nextAction:e.target.value}))} style={inp} placeholder="Apa yang perlu dilakukan?"/></div>
        <div style={{marginBottom:11}}><label style={lbl}>LINK PROPOSAL (Google Drive)</label><input value={form.proposalLink||""} onChange={e=>setForm(p=>({...p,proposalLink:e.target.value}))} style={inp} placeholder="https://drive.google.com/..."/></div>
        <div style={{marginBottom:16}}><label style={lbl}>CATATAN</label><textarea value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{...inp,minHeight:65,resize:"vertical"}} placeholder="Konteks, kebutuhan, decision maker..."/></div>
      </>}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={btn()}>Batal</button>
        <button onClick={onSave} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),fontWeight:700}}>{saveLabel}</button>
      </div>
    </div>
  );
}

// ═══ QUICK UPDATE MODAL ═══
function QuickUpdateModal({ deal, onUpdate, onClose }) {
  const [done,setDone] = useState("");
  const [next,setNext] = useState(deal.nextAction||"");
  const [date,setDate] = useState("");
  const submit = () => {
    const nc = done.trim() ? {text:`✓ ${done.trim()}`,author:deal.assignedTo,date:today()} : null;
    onUpdate({...deal,nextAction:next,nextActionDate:date,lastContactedDate:today(),comments:nc?[...(deal.comments||[]),nc]:deal.comments});
    onClose();
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:16}}>
      <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:14,padding:"20px",width:"100%",maxWidth:420}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div><div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>Update Cepat</div><div style={{fontSize:11,color:"#374151"}}>{deal.company}</div></div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#374151"}}><X size={14}/></button>
        </div>
        <div style={{marginBottom:11}}><label style={lbl}>APA YANG SUDAH DILAKUKAN?</label><textarea value={done} onChange={e=>setDone(e.target.value)} style={{...inp,minHeight:55,resize:"vertical"}} placeholder="Sudah telepon, kirim email, meeting di site..."/></div>
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
function DealPanel({ deal, onUpdate, onDelete, onClose }) {
  const [editing,setEditing]     = useState(false);
  const [form,setForm]           = useState({...deal});
  const [commentText,setComment] = useState("");
  const [commenter,setCommenter] = useState(TEAM[0]);
  useEffect(()=>{ setForm({...deal}); setEditing(false); },[deal.id]);
  const s = stageOf(deal.stage); const hs = health(deal); const age = ageInfo(deal.stageEnteredAt); const rc = repColor(deal.assignedTo);
  const contacts = deal.contacts||[{name:deal.contact||"",role:"",phone:deal.phone||""}];
  const save = () => {
    const same = form.stage===deal.stage;
    onUpdate({...form,value:Number(form.value),qty:Number(form.qty),stageEnteredAt:same?deal.stageEnteredAt:today(),stageHistory:same?deal.stageHistory:[...(deal.stageHistory||[]),{stage:form.stage,date:today(),movedBy:form.assignedTo}]});
    setEditing(false);
  };
  const changeStage = sid => onUpdate({...deal,stage:sid,stageEnteredAt:today(),stageHistory:[...(deal.stageHistory||[]),{stage:sid,date:today(),movedBy:deal.assignedTo}]});
  const addComment = () => {
    if(!commentText.trim()) return;
    onUpdate({...deal,comments:[...(deal.comments||[]),{text:commentText.trim(),author:commenter,date:today()}]});
    setComment("");
  };

  return (
    <div style={{width:320,flexShrink:0,background:"#0A0D18",borderLeft:"1px solid #151D30",display:"flex",flexDirection:"column",overflowY:"auto"}}>
      <div style={{padding:"13px 16px",borderBottom:"1px solid #151D30",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#0A0D18",zIndex:5}}>
        <span style={{fontSize:10,fontWeight:700,color:"#374151",letterSpacing:"0.07em"}}>DETAIL DEAL</span>
        <div style={{display:"flex",gap:5}}>
          {!editing&&<button onClick={()=>{setForm({...deal});setEditing(true)}} style={{...btn(),padding:"4px 7px"}}><Edit3 size={11}/></button>}
          <button onClick={()=>onDelete(deal.id)} style={{...btn("#200D0D","#F87171","#3B1111"),padding:"4px 7px"}}><Trash2 size={11}/></button>
          <button onClick={onClose} style={{...btn(),padding:"4px 7px"}}><X size={11}/></button>
        </div>
      </div>
      <div style={{padding:"14px 16px",flex:1}}>
        {editing ? <DealForm form={form} setForm={setForm} onSave={save} onCancel={()=>setEditing(false)} saveLabel="Simpan Perubahan"/> : <>
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
            <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>KONTAK STAKEHOLDER</div>
            {contacts.map((c,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:9,marginBottom:6,padding:"8px 10px",background:"#0D1120",border:"1px solid #1A2235",borderRadius:8}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:rc+"22",border:`1px solid ${rc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:rc,flexShrink:0}}>{initials(c.name||"?")}</div>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:700,color:"#E2E8F0"}}>{c.name||"-"}</div><div style={{fontSize:10,color:"#374151"}}>{c.role}</div></div>
                {c.phone&&<a href={`https://wa.me/${c.phone}?text=${encodeURIComponent(waMsg(deal))}`} target="_blank" rel="noopener noreferrer" style={{background:"#052015",border:"1px solid #064E3B",borderRadius:7,padding:"5px 8px",display:"flex",alignItems:"center",gap:4,textDecoration:"none"}}><MessageCircle size={11} color="#6EE7B7"/><span style={{fontSize:9,color:"#6EE7B7",fontWeight:700}}>WA</span></a>}
              </div>
            ))}
          </div>
          {[["Produk",deal.product],["Jumlah",`${deal.qty} unit`],["Lokasi Site",deal.siteLocation||"-"],["Sales",deal.assignedTo],["Terakhir Dihubungi",fmtDate(deal.lastContactedDate)]].map(([k,v])=>(
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
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {STAGES.map(st=>{const active=deal.stage===st.id;return(
                <button key={st.id} onClick={()=>changeStage(st.id)} style={{background:active?st.color+"22":"#0D1120",border:`1px solid ${active?st.color+"88":"#1A2235"}`,borderRadius:6,padding:"6px 10px",fontSize:11,color:active?st.color:"#374151",cursor:"pointer",textAlign:"left",fontWeight:active?700:400,display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:st.color}}/>{st.label}{active&&<span style={{marginLeft:"auto",fontSize:9}}>SEKARANG</span>}
                </button>
              );})}
            </div>
          </div>
          {(deal.stageHistory||[]).length>0&&<div style={{marginTop:14}}>
            <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>RIWAYAT STAGE</div>
            {[...(deal.stageHistory||[])].reverse().slice(0,4).map((h,i)=>{const st=stageOf(h.stage);return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:7,fontSize:10,color:"#374151",marginBottom:4}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:st.color,flexShrink:0}}/><span style={{color:st.color,fontWeight:600}}>{st.label}</span><span style={{marginLeft:"auto"}}>{fmtDate(h.date)}</span>
              </div>
            );})}
          </div>}
          <div style={{marginTop:14}}>
            <div style={{fontSize:10,color:"#374151",letterSpacing:"0.07em",fontWeight:700,marginBottom:8}}>LOG AKTIVITAS</div>
            {(deal.comments||[]).length===0&&<div style={{fontSize:11,color:"#1E2A40",marginBottom:8}}>Belum ada catatan.</div>}
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:8}}>
              {(deal.comments||[]).map((c,i)=>(
                <div key={i} style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,padding:"8px 10px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:10,fontWeight:700,color:repColor(c.author)}}>{c.author}</span><span style={{fontSize:9,color:"#374151"}}>{fmtDate(c.date)}</span></div>
                  <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.5}}>{c.text}</div>
                </div>
              ))}
            </div>
            <select value={commenter} onChange={e=>setCommenter(e.target.value)} style={{...inp,fontSize:11,padding:"5px 8px",marginBottom:6}}>{TEAM.map(t=><option key={t}>{t}</option>)}</select>
            <div style={{display:"flex",gap:6}}>
              <input value={commentText} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment()} placeholder="Tambah catatan aktivitas..." style={{...inp,flex:1,fontSize:12}}/>
              <button onClick={addComment} style={{background:"#F59E0B",border:"none",borderRadius:8,padding:"0 11px",cursor:"pointer"}}><Send size={12} color="#0A0C14"/></button>
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}

// ═══ TODAY TASKS ═══
function TodayTasks({ deals, onSelect, onUpdate }) {
  const [quickDeal,setQuickDeal] = useState(null);
  const t = today();
  const overdue  = deals.filter(d=>!["menang","kalah"].includes(d.stage)&&d.nextActionDate&&d.nextActionDate<=t).sort((a,b)=>Number(b.value)-Number(a.value));
  const reEngage = deals.filter(d=>d.stage==="kalah"&&d.nextActionDate&&d.nextActionDate<=t).sort((a,b)=>Number(b.value)-Number(a.value));
  const upcoming = deals.filter(d=>!["menang","kalah"].includes(d.stage)&&d.nextActionDate&&d.nextActionDate>t).sort((a,b)=>a.nextActionDate.localeCompare(b.nextActionDate)).slice(0,10);

  const Row = ({deal,late,isRE}) => {
    const s=stageOf(deal.stage); const rc=repColor(deal.assignedTo);
    return (
      <div style={{background:"#0D1120",border:`1px solid ${late?"#7F1D1D":"#1A2235"}`,borderRadius:10,padding:"11px 13px",display:"flex",gap:10,alignItems:"flex-start"}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:rc+"22",border:`1px solid ${rc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:rc,flexShrink:0,cursor:"pointer"}} onClick={()=>onSelect(deal)}>{initials(deal.assignedTo)}</div>
        <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>onSelect(deal)}>
          <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:2}}><span style={{fontSize:12,fontWeight:700,color:"#E2E8F0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{deal.company}</span><span style={{fontSize:12,fontWeight:700,color:"#F59E0B",whiteSpace:"nowrap"}}>{fmtIDR(deal.value)}</span></div>
          <div style={{fontSize:10,color:"#374151",marginBottom:3}}>{deal.assignedTo} · <span style={{color:s.color}}>{s.label}</span>{deal.siteLocation&&` · ${deal.siteLocation}`}</div>
          <div style={{fontSize:11,color:late?"#FCA5A5":"#94A3B8",lineHeight:1.4}}>{late&&"⚠ "}{deal.nextAction}</div>
          {deal.nextActionDate&&<div style={{fontSize:9,color:late?"#F87171":"#374151",marginTop:2}}>{late?"Terlambat: ":isRE?"Re-engage: ":"📅 "}{fmtDate(deal.nextActionDate)}</div>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
          <a href={waLink(deal)} target="_blank" rel="noopener noreferrer" style={{background:"#052015",border:"1px solid #064E3B",borderRadius:7,padding:"5px 7px",display:"flex",alignItems:"center",gap:3,textDecoration:"none"}}><MessageCircle size={11} color="#6EE7B7"/><span style={{fontSize:9,color:"#6EE7B7",fontWeight:700}}>WA</span></a>
          {!isRE&&<button onClick={()=>setQuickDeal(deal)} style={{background:"#1A2235",border:"1px solid #22C55E44",borderRadius:7,padding:"5px 7px",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}><CheckSquare size={11} color="#22C55E"/><span style={{fontSize:9,color:"#22C55E",fontWeight:700}}>Update</span></button>}
        </div>
      </div>
    );
  };

  const Section = ({title,items,late,icon:Icon,color,isRE}) => (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:10,fontWeight:700,color,letterSpacing:"0.07em",marginBottom:9,display:"flex",alignItems:"center",gap:6}}><Icon size={12} color={color}/>{title} ({items.length})</div>
      {items.length===0 ? <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:9,padding:"16px",textAlign:"center",color:"#1E2A40",fontSize:12}}>Tidak ada tugas ✓</div>
        : <div style={{display:"flex",flexDirection:"column",gap:7}}>{items.map(d=><Row key={d.id} deal={d} late={late} isRE={isRE}/>)}</div>}
    </div>
  );

  return (
    <div style={{padding:"16px",maxWidth:700,margin:"0 auto"}}>
      {quickDeal&&<QuickUpdateModal deal={quickDeal} onUpdate={d=>{onUpdate(d);setQuickDeal(null);}} onClose={()=>setQuickDeal(null)}/>}
      <Section title="TERLAMBAT / JATUH TEMPO HARI INI" items={overdue} late icon={AlertCircle} color="#F87171"/>
      {reEngage.length>0&&<Section title="WAKTUNYA RE-ENGAGE" items={reEngage} isRE icon={RefreshCw} color="#A78BFA"/>}
      <Section title="AKAN DATANG" items={upcoming} icon={Clock} color="#60A5FA"/>
    </div>
  );
}

// ═══ TABLE VIEW ═══
function TableView({ deals, onSelect }) {
  const [sort,setSort]   = useState({col:"value",dir:"desc"});
  const [filter,setFilter] = useState({stage:"Semua",rep:"Semua",pri:"Semua"});
  const toggle = col => setSort(s=>s.col===col?{col,dir:s.dir==="desc"?"asc":"desc"}:{col,dir:"desc"});

  const sorted = [...deals]
    .filter(d=>(filter.stage==="Semua"||d.stage===filter.stage)&&(filter.rep==="Semua"||d.assignedTo===filter.rep)&&(filter.pri==="Semua"||d.priority===filter.pri))
    .sort((a,b)=>{
      const fn={value:(a,b)=>Number(b.value)-Number(a.value),company:(a,b)=>a.company.localeCompare(b.company),assignedTo:(a,b)=>a.assignedTo.localeCompare(b.assignedTo),stage:(a,b)=>STAGES.findIndex(s=>s.id===a.stage)-STAGES.findIndex(s=>s.id===b.stage),health:(a,b)=>health(b)-health(a),nextActionDate:(a,b)=>(a.nextActionDate||"zz").localeCompare(b.nextActionDate||"zz")};
      const res=(fn[sort.col]||fn.value)(a,b); return sort.dir==="asc"?-res:res;
    });

  const Th = ({label,col,w}) => <th onClick={()=>toggle(col)} style={{padding:"8px 10px",fontSize:9,fontWeight:700,color:sort.col===col?"#F59E0B":"#374151",letterSpacing:"0.06em",textAlign:"left",cursor:"pointer",whiteSpace:"nowrap",width:w,background:"#0A0D18",position:"sticky",top:0}}>{label} {sort.col===col?(sort.dir==="desc"?<ChevronDown size={10}/>:<ChevronUp size={10}/>):null}</th>;

  return (
    <div style={{padding:"12px 14px",flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        {[{label:"Stage",key:"stage",opts:["Semua",...STAGES.map(s=>({v:s.id,l:s.label}))]},{label:"Sales",key:"rep",opts:["Semua",...TEAM]},{label:"Prioritas",key:"pri",opts:["Semua",...PRI_LIST]}].map(({label,key,opts})=>(
          <div key={key} style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:10,color:"#374151",fontWeight:600}}>{label}:</span>
            <select value={filter[key]} onChange={e=>setFilter(p=>({...p,[key]:e.target.value}))} style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:7,padding:"5px 8px",color:"#CBD5E1",fontSize:11,outline:"none"}}>
              {opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
            </select>
          </div>
        ))}
        <span style={{fontSize:11,color:"#374151",marginLeft:"auto"}}>{sorted.length} deal</span>
      </div>
      <div style={{overflowX:"auto",overflowY:"auto",flex:1}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
          <thead><tr style={{borderBottom:"1px solid #151D30"}}>
            <Th label="PERUSAHAAN" col="company" w="18%"/><Th label="SALES" col="assignedTo" w="12%"/><Th label="PRODUK" col="product" w="16%"/><Th label="NILAI" col="value" w="11%"/><Th label="STAGE" col="stage" w="12%"/><Th label="PRI" col="priority" w="7%"/><Th label="SKOR" col="health" w="7%"/><Th label="AKSI BERIKUTNYA" col="nextActionDate" w="17%"/>
          </tr></thead>
          <tbody>
            {sorted.map(deal=>{
              const s=stageOf(deal.stage); const p=PRI[deal.priority]||PRI.Sedang; const hs=health(deal); const overdue=isOD(deal.nextActionDate);
              return <tr key={deal.id} onClick={()=>onSelect(deal)} style={{borderBottom:"1px solid #111928",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#0D1120"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"9px 10px"}}><div style={{fontSize:12,fontWeight:700,color:"#E2E8F0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:150}}>{deal.company}</div><div style={{fontSize:10,color:"#374151"}}>{deal.siteLocation}</div></td>
                <td style={{padding:"9px 10px"}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:20,height:20,borderRadius:"50%",background:repColor(deal.assignedTo)+"22",border:`1px solid ${repColor(deal.assignedTo)}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:repColor(deal.assignedTo)}}>{initials(deal.assignedTo)}</div><span style={{fontSize:11,color:"#94A3B8"}}>{deal.assignedTo.split(" ")[0]}</span></div></td>
                <td style={{padding:"9px 10px",fontSize:11,color:"#64748B"}}>{(deal.product||"").replace("Mobile ","").replace(" System","")}</td>
                <td style={{padding:"9px 10px",fontSize:12,fontWeight:700,color:"#F59E0B",whiteSpace:"nowrap"}}>{fmtIDR(deal.value)}</td>
                <td style={{padding:"9px 10px"}}><span style={{background:s.color+"22",color:s.color,borderRadius:4,padding:"2px 6px",fontSize:9,fontWeight:700}}>{s.label}</span></td>
                <td style={{padding:"9px 10px"}}><span style={{background:p.bg,color:p.text,borderRadius:4,padding:"2px 5px",fontSize:9,fontWeight:700}}>{deal.priority}</span></td>
                <td style={{padding:"9px 10px"}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{flex:1,height:5,background:"#111928",borderRadius:3,overflow:"hidden",minWidth:30}}><div style={{width:`${hs}%`,height:"100%",background:hColor(hs),borderRadius:3}}/></div><span style={{fontSize:9,fontWeight:700,color:hColor(hs)}}>{hs}</span></div></td>
                <td style={{padding:"9px 10px"}}><div style={{fontSize:11,color:overdue?"#FCA5A5":"#64748B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{overdue&&"⚠ "}{deal.nextAction}</div>{deal.nextActionDate&&<div style={{fontSize:9,color:overdue?"#F87171":"#374151"}}>{fmtDate(deal.nextActionDate)}</div>}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══ TEAM VIEW ═══
function TeamView({ deals, targets, setTargets }) {
  const totalPipeline = deals.filter(d=>!["kalah"].includes(d.stage)).reduce((a,d)=>a+Number(d.value),0);
  const weightedTotal = deals.filter(d=>d.stage!=="kalah").reduce((a,d)=>a+Number(d.value)*(stageOf(d.stage).weight||0),0);
  const repStats = TEAM.map((rep,i)=>{
    const rd=deals.filter(d=>d.assignedTo===rep);
    const active=rd.filter(d=>!["menang","kalah"].includes(d.stage));
    const won=rd.filter(d=>d.stage==="menang");
    const pipeline=active.reduce((a,d)=>a+Number(d.value),0);
    const weighted=active.reduce((a,d)=>a+Number(d.value)*(stageOf(d.stage).weight||0),0);
    const wonVal=won.reduce((a,d)=>a+Number(d.value),0);
    const tgt=targets[rep]||DEF_TGT[rep]||1000000000;
    const pct=Math.min(Math.round(wonVal/tgt*100),100);
    const stale=active.filter(d=>daysSince(d.stageEnteredAt)>14).length;
    const overdue=active.filter(d=>isOD(d.nextActionDate)).length;
    return {rep,pipeline,weighted,wonVal,activeCount:active.length,wonCount:won.length,lostCount:rd.filter(d=>d.stage==="kalah").length,stale,overdue,tgt,pct,color:RC[i]};
  });

  return (
    <div style={{padding:"14px 16px",overflowY:"auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:11,marginBottom:20}}>
        {repStats.map(s=>(
          <div key={s.rep} style={{background:"#0D1120",border:`1px solid ${s.color}33`,borderRadius:12,padding:"14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:s.color+"22",border:`1px solid ${s.color}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:s.color}}>{initials(s.rep)}</div>
              <div><div style={{fontSize:12,fontWeight:700,color:"#F1F5F9"}}>{s.rep}</div><div style={{fontSize:10,color:"#374151"}}>{s.activeCount} deal aktif · {totalPipeline>0?Math.round(s.pipeline/totalPipeline*100):0}% pipeline</div></div>
            </div>
            <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:"#374151",fontWeight:600}}>TARGET BULANAN (IDR)</span>
                <span style={{fontSize:10,color:s.pct>=100?"#22C55E":s.pct>=60?"#FBBF24":"#F87171",fontWeight:700}}>{s.pct}%</span>
              </div>
              <input type="number" value={s.tgt} onChange={e=>setTargets(p=>({...p,[s.rep]:Number(e.target.value)}))} style={{...inp,fontSize:11,padding:"5px 8px",marginBottom:5,color:"#F59E0B"}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#374151",marginBottom:5}}><span>Menang: {fmtIDR(s.wonVal)}</span></div>
              <div style={{height:6,background:"#111928",borderRadius:3,overflow:"hidden"}}><div style={{width:`${s.pct}%`,height:"100%",background:s.pct>=100?"#22C55E":s.pct>=60?"#FBBF24":"#F87171",borderRadius:3}}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
              {[["Pipeline Total",fmtIDR(s.pipeline),"#F59E0B"],["Pipeline Terbobot",fmtIDR(s.weighted),"#60A5FA"]].map(([l,v,c])=>(
                <div key={l} style={{background:"#080D18",borderRadius:7,padding:"7px 9px"}}><div style={{fontSize:9,color:"#374151",fontWeight:600,marginBottom:2}}>{l.toUpperCase()}</div><div style={{fontSize:12,fontWeight:700,color:c}}>{v}</div></div>
              ))}
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {s.overdue>0&&<span style={{background:"#2D1515",color:"#FCA5A5",border:"1px solid #7F1D1D",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:700}}>⚠{s.overdue} terlambat</span>}
              {s.stale>0&&<span style={{background:"#2A1F05",color:"#FCD34D",border:"1px solid #78350F",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:700}}>⏱{s.stale} stagnan</span>}
              {s.overdue===0&&s.stale===0&&<span style={{background:"#052015",color:"#6EE7B7",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:700}}>✓ On track</span>}
            </div>
          </div>
        ))}
      </div>
      <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:12,padding:"14px"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#374151",letterSpacing:"0.07em",marginBottom:12}}>FUNNEL PIPELINE (NILAI TERBOBOT)</div>
        {STAGES.filter(s=>s.id!=="kalah").map(stage=>{
          const sd=deals.filter(d=>d.stage===stage.id); const sv=sd.reduce((a,d)=>a+Number(d.value),0); const wv=sv*stage.weight; const pct=totalPipeline>0?Math.min(sv/totalPipeline*100,100):0;
          return <div key={stage.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:stage.color,flexShrink:0}}/><div style={{width:110,fontSize:10,color:"#64748B",flexShrink:0}}>{stage.label}</div>
            <div style={{flex:1,height:8,background:"#111928",borderRadius:4,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:stage.color,borderRadius:4}}/></div>
            <div style={{width:80,fontSize:10,color:"#94A3B8",textAlign:"right",flexShrink:0}}>{fmtIDR(wv)}</div><div style={{width:22,fontSize:9,color:stage.color,fontWeight:700,textAlign:"right"}}>{sd.length}</div>
          </div>;
        })}
        <div style={{marginTop:11,padding:"9px 11px",background:"#080D18",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:"#64748B"}}>Total Pipeline Terbobot (Estimasi Revenue)</span>
          <span style={{fontSize:14,fontWeight:800,color:"#F59E0B"}}>{fmtIDR(weightedTotal)}</span>
        </div>
      </div>
    </div>
  );
}

// ═══ MAIN APP ═══
export default function App() {
  const [sheetsUrl,setSheetsUrl] = useState(() => localStorage.getItem(LS_URL)||"");
  const [deals,setDeals]         = useState([]);
  const [targets,setTargets]     = useState(DEF_TGT);
  const [selected,setSelected]   = useState(null);
  const [showAdd,setShowAdd]     = useState(false);
  const [quickMode,setQuickMode] = useState(false);
  const [form,setForm]           = useState({...{company:"",contacts:[{name:"",role:"Procurement Manager",phone:""}],product:PRODUCTS[0],qty:1,value:"",stage:"prospek",priority:"Sedang",assignedTo:TEAM[0],nextAction:"",nextActionDate:"",lastContactedDate:"",siteLocation:"",proposalLink:"",notes:"",stageEnteredAt:today(),winLossReason:"",stageHistory:[],comments:[],createdAt:today()}});
  const EMPTY_FORM               = {company:"",contacts:[{name:"",role:"Procurement Manager",phone:""}],product:PRODUCTS[0],qty:1,value:"",stage:"prospek",priority:"Sedang",assignedTo:TEAM[0],nextAction:"",nextActionDate:"",lastContactedDate:"",siteLocation:"",proposalLink:"",notes:"",stageEnteredAt:today(),winLossReason:"",stageHistory:[],comments:[],createdAt:today()};
  const [dragId,setDragId]       = useState(null);
  const [dragOver,setDragOver]   = useState(null);
  const [search,setSearch]       = useState("");
  const [repFilter,setRepFilter] = useState("Semua");
  const [tab,setTab]             = useState("papan");
  const [loading,setLoading]     = useState(true);
  const [syncing,setSyncing]     = useState(false);
  const [online,setOnline]       = useState(true);
  const [lastSaved,setLastSaved] = useState("");
  const [showSettings,setShowSettings] = useState(false);
  const nextId = useRef(100);
  const importRef = useRef(null);
  const saveTimer = useRef(null);

  // Setup: save URL
  const handleSetupSave = url => { localStorage.setItem(LS_URL,url); setSheetsUrl(url); };

  // Load data from Sheets
  const loadData = useCallback(async () => {
    if (!sheetsUrl) return;
    setLoading(true);
    try {
      const data = await sheetsGet(sheetsUrl);
      if (data.error) throw new Error(data.error);
      const loadedDeals = (data.deals||[]).map(migrate);
      const loadedTargets = data.targets||DEF_TGT;
      setDeals(loadedDeals.length>0 ? loadedDeals : SEED.map(migrate));
      setTargets(loadedTargets);
      if (loadedDeals.length>0) nextId.current = Math.max(...loadedDeals.map(d=>d.id))+1;
      setOnline(true);
    } catch(e) {
      console.error("Load failed:",e);
      // Fall back to local seed if first load
      if (deals.length===0) setDeals(SEED.map(migrate));
      setOnline(false);
    }
    setLoading(false);
  }, [sheetsUrl]);

  useEffect(()=>{ if(sheetsUrl) loadData(); else setLoading(false); },[sheetsUrl]);

  // Auto-save with debounce
  const saveData = useCallback(async (dealsToSave, targetsToSave) => {
    if (!sheetsUrl || dealsToSave.length===0) return;
    setSyncing(true);
    try {
      await sheetsPost(sheetsUrl, { deals:dealsToSave, targets:targetsToSave });
      setLastSaved(new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}));
      setOnline(true);
    } catch(e) { setOnline(false); }
    setSyncing(false);
  }, [sheetsUrl]);

  useEffect(()=>{
    if (loading || !sheetsUrl) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(()=>saveData(deals,targets), 800);
    return ()=>clearTimeout(saveTimer.current);
  },[deals,targets]);

  const updateDeal = d => { setDeals(p=>p.map(x=>x.id===d.id?d:x)); setSelected(d); };
  const deleteDeal = id => { setDeals(p=>p.filter(x=>x.id!==id)); setSelected(null); };
  const addDeal = () => {
    const id = nextId.current++;
    const d = {...form,id,value:Number(form.value)||0,qty:Number(form.qty)||1,stageHistory:[{stage:form.stage,date:today(),movedBy:form.assignedTo}],comments:[],createdAt:today()};
    setDeals(p=>[...p,d]); setForm({...EMPTY_FORM}); setShowAdd(false);
  };

  const onDragStart=id=>setDragId(id);
  const onDragOver=(sid,e)=>{e.preventDefault();setDragOver(sid);};
  const onDrop=sid=>{
    if(dragId!=null){const deal=deals.find(d=>d.id===dragId);if(deal){const u={...deal,stage:sid,stageEnteredAt:today(),stageHistory:[...(deal.stageHistory||[]),{stage:sid,date:today(),movedBy:deal.assignedTo}]};setDeals(p=>p.map(d=>d.id===dragId?u:d));if(selected?.id===dragId)setSelected(u);}}
    setDragId(null);setDragOver(null);
  };

  const exportJSON = () => {
    const url=URL.createObjectURL(new Blob([JSON.stringify({deals,targets,version:"3.0",exportedAt:new Date().toISOString()},null,2)],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download=`btm-crm-${today()}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  };
  const importJSON = e => {
    const file=e.target.files[0];if(!file)return;
    const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(d.deals)setDeals(d.deals.map(migrate));if(d.targets)setTargets(d.targets);}catch(e){alert("File tidak valid");}};
    r.readAsText(file);e.target.value="";
  };

  const visible=deals.filter(d=>(repFilter==="Semua"||d.assignedTo===repFilter)&&[d.company,d.contacts?.[0]?.name||"",d.product,d.notes,d.siteLocation].some(s=>s?.toLowerCase().includes(search.toLowerCase())));
  const byStage=id=>visible.filter(d=>d.stage===id);
  const pipelineVal=deals.filter(d=>!["menang","kalah"].includes(d.stage)).reduce((a,d)=>a+Number(d.value),0);
  const weightedVal=deals.filter(d=>d.stage!=="kalah").reduce((a,d)=>a+Number(d.value)*(stageOf(d.stage).weight||0),0);
  const wonVal=deals.filter(d=>d.stage==="menang").reduce((a,d)=>a+Number(d.value),0);
  const overdueCount=deals.filter(d=>!["menang","kalah"].includes(d.stage)&&isOD(d.nextActionDate)).length;
  const reEngageCount=deals.filter(d=>d.stage==="kalah"&&isOD(d.nextActionDate)).length;

  if (!sheetsUrl) return <SetupScreen onSave={handleSetupSave}/>;

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#070A12",flexDirection:"column",gap:16}}>
      <div style={{width:42,height:42,background:"linear-gradient(135deg,#F59E0B,#D97706)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}><Sun size={22} color="#0A0D18"/></div>
      <div style={{fontSize:13,color:"#374151"}}>Memuat data dari Google Sheets...</div>
    </div>
  );

  const TABS=[{id:"papan",label:"Papan",icon:LayoutGrid},{id:"tugas",label:"Tugas",icon:CheckSquare,badge:overdueCount+reEngageCount},{id:"tabel",label:"Tabel",icon:TrendingUp},{id:"tim",label:"Tim",icon:Users}];

  return (
    <div style={{background:"#070A12",minHeight:"100vh",color:"#CBD5E1",fontFamily:"ui-sans-serif,system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      {/* HEADER */}
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
          <option>Semua</option>{TEAM.map(t=><option key={t}>{t}</option>)}
        </select>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          <div title={online?"Terhubung ke Sheets":"Offline"} style={{display:"flex",alignItems:"center"}}>{online?<Wifi size={13} color="#22C55E"/>:<WifiOff size={13} color="#F87171"/>}</div>
          <button onClick={loadData} title="Refresh data" style={{...btn(),padding:"6px 8px"}}><RefreshCw size={12} style={{animation:syncing?"spin 1s linear infinite":"none"}}/></button>
          <button onClick={exportJSON} title="Export" style={{...btn(),padding:"6px 8px"}}><Download size={12}/></button>
          <button onClick={()=>importRef.current?.click()} title="Import" style={{...btn(),padding:"6px 8px"}}><Upload size={12}/></button>
          <input ref={importRef} type="file" accept=".json" onChange={importJSON} style={{display:"none"}}/>
          <button onClick={()=>setShowSettings(true)} style={{...btn(),padding:"6px 8px"}}><Settings size={12}/></button>
          <button onClick={()=>{setForm({...EMPTY_FORM});setShowAdd(true)}} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),display:"flex",alignItems:"center",gap:5,padding:"6px 11px",fontWeight:700}}><Plus size={12}/>Tambah</button>
        </div>
        {lastSaved&&<span style={{fontSize:9,color:"#1E2A40",whiteSpace:"nowrap"}}>✓ {lastSaved}</span>}
      </div>

      {/* TABS */}
      <div style={{display:"flex",borderBottom:"1px solid #151D30",background:"#0A0D18",paddingLeft:12}}>
        {TABS.map(t=>{const Icon=t.icon;const active=tab===t.id;return(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",borderBottom:active?"2px solid #F59E0B":"2px solid transparent",padding:"8px 12px",color:active?"#F59E0B":"#374151",cursor:"pointer",fontSize:11,fontWeight:active?700:400,display:"flex",alignItems:"center",gap:5,marginBottom:-1,whiteSpace:"nowrap"}}>
            <Icon size={12}/>{t.label}{t.badge>0&&<span style={{background:"#F87171",color:"#fff",borderRadius:10,padding:"1px 5px",fontSize:8,fontWeight:700}}>{t.badge}</span>}
          </button>
        );})}
      </div>

      {/* CONTENT */}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {tab==="papan"&&<>
          <div style={{flex:1,overflowX:"auto",padding:"10px 11px",display:"flex",gap:8,alignItems:"flex-start"}}>
            {STAGES.map(stage=>{
              const cards=byStage(stage.id); const total=cards.reduce((a,d)=>a+Number(d.value),0); const over=dragOver===stage.id;
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
                      const p=PRI[deal.priority]||PRI.Sedang; const rc=repColor(deal.assignedTo); const age=ageInfo(deal.stageEnteredAt); const overdue=isOD(deal.nextActionDate); const hs=health(deal); const isSel=selected?.id===deal.id;
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
          {selected&&<DealPanel key={selected.id} deal={selected} onUpdate={updateDeal} onDelete={deleteDeal} onClose={()=>setSelected(null)}/>}
        </>}
        {tab==="tugas"&&<div style={{flex:1,overflowY:"auto"}}><TodayTasks deals={visible} onSelect={d=>{setSelected(d);setTab("papan");}} onUpdate={updateDeal}/></div>}
        {tab==="tabel"&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}><TableView deals={visible} onSelect={d=>{setSelected(d);setTab("papan");}}/></div>}
        {tab==="tim"&&<div style={{flex:1,overflowY:"auto"}}><TeamView deals={deals} targets={targets} setTargets={setTargets}/></div>}
      </div>

      {/* ADD MODAL */}
      {showAdd&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
          <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:16,padding:"20px",width:"100%",maxWidth:450,maxHeight:"92vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,background:"#F59E0B22",border:"1px solid #F59E0B44",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={12} color="#F59E0B"/></div><span style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>Tambah Deal Baru</span></div>
              <button onClick={()=>setShowAdd(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#374151"}}><X size={14}/></button>
            </div>
            <DealForm form={form} setForm={setForm} onSave={addDeal} onCancel={()=>setShowAdd(false)} saveLabel="Buat Deal" quickMode={quickMode} setQuickMode={setQuickMode}/>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
          <div style={{background:"#0D1120",border:"1px solid #1A2235",borderRadius:16,padding:"20px",width:"100%",maxWidth:420}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <span style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>Pengaturan</span>
              <button onClick={()=>setShowSettings(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#374151"}}><X size={14}/></button>
            </div>
            <div style={{marginBottom:14}}>
              <label style={lbl}>APPS SCRIPT URL</label>
              <input value={sheetsUrl} onChange={e=>setSheetsUrl(e.target.value)} style={inp} placeholder="https://script.google.com/macros/s/.../exec"/>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowSettings(false)} style={btn()}>Batal</button>
              <button onClick={()=>{localStorage.setItem(LS_URL,sheetsUrl);setShowSettings(false);loadData();}} style={{...btn("#F59E0B","#0A0C14","#F59E0B"),fontWeight:700}}>Simpan & Reload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
