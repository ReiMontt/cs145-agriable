import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';

const API_URL = "http://localhost:8000";

// ── GLOBAL CSS ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { font-family: 'Instrument Sans', sans-serif; background: #0b0e13; color: #d8dcc8; min-height: 100vh; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #2a2e38; border-radius: 4px; }
  input { color: #d8dcc8; } input:focus { outline: none; } button { cursor: pointer; font-family: inherit; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes scaleIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
  @keyframes checkDraw { from { stroke-dashoffset:100; } to { stroke-dashoffset:0; } }
  @keyframes barGrow { from { transform:scaleY(0); } to { transform:scaleY(1); } }
  .spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.1); border-top-color:#9dbc5e; border-radius:50%; animation:spin 0.7s linear infinite; flex-shrink:0; }
  .dot-live { width:7px; height:7px; border-radius:50%; background:#9dbc5e; animation:pulse 2s infinite; flex-shrink:0; }
  .dot-off  { width:7px; height:7px; border-radius:50%; background:#c05050; flex-shrink:0; }
`;

// ── TOKENS ────────────────────────────────────────────────────────────────────
const T = {
  bg:'#0b0e13', bg2:'#111520', bg3:'#171c28', bg4:'#1e2436',
  border:'rgba(255,255,255,0.07)', border2:'rgba(255,255,255,0.13)',
  text:'#d8dcc8', text2:'#7a8070', text3:'#3d4438',
  green:'#9dbc5e', greenDim:'rgba(157,188,94,0.11)', greenBdr:'rgba(157,188,94,0.22)',
  blue:'#6090c8',  blueDim:'rgba(96,144,200,0.11)',  blueBdr:'rgba(96,144,200,0.22)',
  amber:'#d4a055', amberDim:'rgba(212,160,85,0.11)', amberBdr:'rgba(212,160,85,0.22)',
  red:'#c05050',   redDim:'rgba(192,80,80,0.11)',    redBdr:'rgba(192,80,80,0.22)',
};

// ── ICONS ─────────────────────────────────────────────────────────────────────
const Ic = ({ p, size=16, sw=1.75 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {[].concat(p).map((d,i) => <path key={i} d={d} />)}
  </svg>
);
const I = {
  leaf:    <Ic size={18} p={["M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z","M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"]} />,
  grid:    <Ic size={15} p={["M3 3h7v7H3z","M14 3h7v7h-7z","M3 14h7v7H3z","M14 14h7v7h-7z"]} />,
  zap:     <Ic size={15} sw={2} p="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  users:   <Ic size={15} p={["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","M23 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75"]} />,
  shield:  <Ic size={14} p={["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z","M9 12l2 2 4-4"]} />,
  package: <Ic size={15} p={["M12 2 2 7l10 5 10-5-10-5z","M2 17l10 5 10-5","M2 12l10 5 10-5"]} />,
  pin:     <Ic size={11} p={["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z","M12 10m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0"]} />,
  clock:   <Ic size={13} p={["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z","M12 6v6l4 2"]} />,
  check:   <Ic size={13} sw={2.5} p="M20 6 9 17 4 12" />,
  xmark:   <Ic size={13} sw={2.5} p={["M18 6 6 18","M6 6l12 12"]} />,
  info:    <Ic size={13} p={["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z","M12 16v-4","M12 8h.01"]} />,
  alert:   <Ic size={13} p={["M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4","M12 17h.01"]} />,
  refresh: <Ic size={13} p={["M23 4v6h-6","M1 20v-6h6","M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"]} />,
  activity:<Ic size={14} p="M22 12h-4l-3 9L9 3l-3 9H2" />,
  chevron: <Ic size={13} sw={2} p="M9 18l6-6-6-6" />,
  plus:    <Ic size={14} sw={2.5} p={["M12 5v14","M5 12h14"]} />,
  scan:    <Ic size={22} p={["M3 7V5a2 2 0 0 1 2-2h2","M17 3h2a2 2 0 0 1 2 2v2","M21 17v2a2 2 0 0 1-2 2h-2","M7 21H5a2 2 0 0 1-2-2v-2","M7 12h10"]} />,
  wheat:   <Ic size={15} p={["M2 22 16 8","M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94z","M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94z","M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94z","M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4z"]} />,
  weight:  <Ic size={17} p={["M6 2h12l2 6H4L6 2z","M4 8v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8","M12 12v4","M10 14h4"]} />,
  db:      <Ic size={15} p={["M12 2a9 3 0 1 0 0 .1","M3 5v14a9 3 0 0 0 18 0V5","M3 12a9 3 0 0 0 18 0"]} />,
  filter:  <Ic size={13} p="M22 3H2l8 9.46V19l4 2v-8.54L22 3" />,
  sim:     <Ic size={15} p={["M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"]} />,
};

// ── SHARED UI ─────────────────────────────────────────────────────────────────
function Badge({ color='green', icon, children, style }) {
  const c = { green:{bg:T.greenDim,bdr:T.greenBdr,txt:T.green}, blue:{bg:T.blueDim,bdr:T.blueBdr,txt:T.blue}, amber:{bg:T.amberDim,bdr:T.amberBdr,txt:T.amber}, red:{bg:T.redDim,bdr:T.redBdr,txt:T.red}, gray:{bg:'rgba(255,255,255,0.04)',bdr:T.border2,txt:T.text2} }[color];
  return <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'4px 9px', borderRadius:6, background:c.bg, border:`1px solid ${c.bdr}`, color:c.txt, whiteSpace:'nowrap', ...style }}>{icon&&<span style={{display:'flex'}}>{icon}</span>}{children}</span>;
}

function Card({ children, style, glow }) {
  return <div style={{ background:T.bg2, border:`1px solid ${glow?T.greenBdr:T.border}`, borderRadius:14, boxShadow:glow?`0 0 28px rgba(157,188,94,0.07)`:'none', ...style }}>{children}</div>;
}

function SectionHeader({ icon, title, right }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'15px 20px', borderBottom:`1px solid ${T.border}` }}>
      <span style={{ color:T.text3, display:'flex' }}>{icon}</span>
      <span style={{ fontSize:13, fontWeight:500, color:T.text }}>{title}</span>
      <div style={{ marginLeft:'auto' }}>{right}</div>
    </div>
  );
}

function Mono({ children, style }) {
  return <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:T.text2, ...style }}>{children}</span>;
}

function Avatar({ name, size=34 }) {
  return <div style={{ width:size, height:size, borderRadius:9, flexShrink:0, background:T.greenDim, border:`1px solid ${T.greenBdr}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:size*0.38, color:T.green }}>{(name||'?')[0].toUpperCase()}</div>;
}

function EmptyState({ icon, title, sub }) {
  return <div style={{ textAlign:'center', padding:'52px 24px', color:T.text3 }}><div style={{ fontSize:30, marginBottom:12, opacity:0.25 }}>{icon}</div><div style={{ fontSize:14, color:T.text2, marginBottom:5 }}>{title}</div><div style={{ fontSize:12 }}>{sub}</div></div>;
}

function StatCard({ label, value, unit, icon, color='green', delay=0 }) {
  const c = { green:[T.green,T.greenDim], blue:[T.blue,T.blueDim], amber:[T.amber,T.amberDim] }[color];
  return (
    <Card style={{ padding:'22px 24px', animation:`fadeUp 0.4s ${delay}s ease both` }}>
      <div style={{ width:36, height:36, borderRadius:9, background:c[1], color:c[0], display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>{icon}</div>
      <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.09em', textTransform:'uppercase', color:T.text3, marginBottom:6 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
        <span style={{ fontSize:30, fontWeight:300, color:T.text, letterSpacing:'-1px', fontFamily:"'Syne',sans-serif" }}>{value}</span>
        {unit&&<span style={{ fontSize:13, color:T.text3 }}>{unit}</span>}
      </div>
    </Card>
  );
}

function Topbar({ title, sub, right }) {
  return (
    <div style={{ background:T.bg2, borderBottom:`1px solid ${T.border}`, padding:'0 28px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
      <div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:T.text }}>{title}</div>
        {sub&&<div style={{ fontSize:11, color:T.text3, marginTop:1 }}>{sub}</div>}
      </div>
      {right&&<div style={{ display:'flex', alignItems:'center', gap:10 }}>{right}</div>}
    </div>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((type, msg, sub) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, msg, sub }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);
  return { toasts, add };
}
function ToastStack({ toasts }) {
  const cfg = { success:{bg:T.greenDim,bdr:T.greenBdr,c:T.green,ic:I.check}, error:{bg:T.redDim,bdr:T.redBdr,c:T.red,ic:I.xmark}, info:{bg:T.blueDim,bdr:T.blueBdr,c:T.blue,ic:I.info}, warning:{bg:T.amberDim,bdr:T.amberBdr,c:T.amber,ic:I.alert} };
  return (
    <div style={{ position:'fixed', bottom:24, right:24, display:'flex', flexDirection:'column', gap:8, zIndex:1000 }}>
      {toasts.map(t => { const s=cfg[t.type]||cfg.info; return (
        <div key={t.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 16px', borderRadius:10, minWidth:270, maxWidth:360, background:T.bg2, border:`1px solid ${s.bdr}`, boxShadow:'0 8px 28px rgba(0,0,0,0.45)', animation:'slideDown 0.2s ease' }}>
          <span style={{ color:s.c, display:'flex', marginTop:1, flexShrink:0 }}>{s.ic}</span>
          <div><div style={{ fontSize:13, fontWeight:500, color:T.text, marginBottom:t.sub?3:0 }}>{t.msg}</div>{t.sub&&<div style={{ fontSize:11, color:T.text2 }}>{t.sub}</div>}</div>
        </div>
      );})}
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
const NAV = [
  { id:'admin',    label:'Admin Dashboard', icon:I.grid,    role:'Government',  badge:null    },
  { id:'farmer',   label:'Farmer Portal',   icon:I.wheat,   role:'Beneficiary', badge:null    },
  { id:'sim',      label:'HW Simulator',    icon:I.zap,     role:'Engineering', badge:'DEV'   },
  { id:'registry', label:'RSBSA Registry',  icon:I.users,   role:'Government',  badge:null    },
  { id:'logs',     label:'Audit Logs',      icon:I.clock,   role:'Government',  badge:null    },
];

function Sidebar({ page, setPage, online }) {
  const govNav = NAV.filter(n => n.role === 'Government' || n.role === 'Engineering');
  return (
    <aside style={{ width:244, minWidth:244, background:T.bg2, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', padding:'24px 14px', position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28, paddingLeft:6 }}>
        <div style={{ width:34, height:34, borderRadius:9, background:T.greenDim, border:`1px solid ${T.greenBdr}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.green }}>{I.leaf}</div>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, color:T.text, letterSpacing:'-0.3px' }}>AgriAble</div>
          <div style={{ fontSize:10, color:T.text3, letterSpacing:'0.04em' }}>Subsidy System v1.0</div>
        </div>
      </div>

      {/* Role sections */}
      {[
        { role:'Beneficiary', label:'Farmer' },
        { role:'Government',  label:'Government / Admin' },
        { role:'Engineering', label:'Development' },
      ].map(({ role, label }) => {
        const items = NAV.filter(n => n.role === role);
        return (
          <div key={role} style={{ marginBottom:18 }}>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:T.text3, marginBottom:6, paddingLeft:6 }}>{label}</div>
            {items.map(n => {
              const active = page === n.id;
              return (
                <button key={n.id} onClick={() => setPage(n.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:9, border:'none', background:active?T.greenDim:'transparent', color:active?T.green:T.text2, fontSize:13, fontWeight:active?600:400, textAlign:'left', width:'100%', transition:'all 0.15s', marginBottom:2 }}>
                  <span style={{ display:'flex', opacity:active?1:0.6 }}>{n.icon}</span>
                  <span style={{ flex:1 }}>{n.label}</span>
                  {n.badge&&<span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.08em', padding:'2px 5px', borderRadius:4, background:T.amberDim, color:T.amber, border:`1px solid ${T.amberBdr}` }}>{n.badge}</span>}
                </button>
              );
            })}
          </div>
        );
      })}

      <div style={{ marginTop:'auto', borderTop:`1px solid ${T.border}`, paddingTop:14, paddingLeft:6, display:'flex', flexDirection:'column', gap:7 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}><div className={online?'dot-live':'dot-off'} /><span style={{ fontSize:11, color:T.text3 }}>{online?'Server online':'Server offline'}</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ width:7, height:7, borderRadius:'50%', background:T.blue, opacity:0.7, flexShrink:0 }} /><span style={{ fontSize:11, color:T.text3 }}>MOSIP Sandbox</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ width:7, height:7, borderRadius:'50%', background:T.amber, opacity:0.7, flexShrink:0 }} /><span style={{ fontSize:11, color:T.text3 }}>RSBSA (Mocked)</span></div>
      </div>
    </aside>
  );
}

// ── ADMIN PAGE ────────────────────────────────────────────────────────────────
function AdminPage({ toast }) {
  const [stats, setStats] = useState({ total_kg:'—', count:0 });
  const [logs, setLogs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([axios.get(`${API_URL}/api/dashboard-stats`), axios.get(`${API_URL}/api/recent-logs`)]);
      setStats(s.data); setLogs(l.data); setLastRefresh(new Date());
    } catch { toast('error','Failed to fetch data','Check server connection'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); const iv = setInterval(refresh, 5000); return () => clearInterval(iv); }, []);

  const barData = (() => {
    const map = {};
    logs.forEach(l => { const d = new Date(l.timestamp).toLocaleDateString('en-PH',{month:'short',day:'numeric'}); map[d]=(map[d]||0)+l.dispensed_kg; });
    const entries = Object.entries(map).slice(-7);
    const max = Math.max(...entries.map(e=>e[1]),1);
    return entries.map(([d,v])=>({ d, v, pct:v/max }));
  })();

  const uniqueFarmers = new Set(logs.map(l=>l.national_id)).size;
  const avgDispense   = logs.length ? (logs.reduce((a,l)=>a+l.dispensed_kg,0)/logs.length).toFixed(1) : '—';

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <Topbar title="Admin Dashboard" sub="National government view — real-time subsidy analytics & system status"
        right={<button onClick={refresh} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:8, border:`1px solid ${T.border2}`, background:'transparent', color:T.text2, fontSize:12 }}>{I.refresh} {lastRefresh?`${lastRefresh.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'})}`:'Refresh'}</button>} />
      <div style={{ flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:18 }}>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
          <StatCard label="Total Distributed" value={loading?'…':stats.total_kg} unit="kg" icon={I.package} color="green" delay={0} />
          <StatCard label="Transactions" value={loading?'…':stats.count} icon={I.activity} color="blue" delay={0.05} />
          <StatCard label="Unique Farmers" value={loading?'…':uniqueFarmers} icon={I.users} color="amber" delay={0.1} />
          <StatCard label="Avg. Per Dispense" value={loading?'…':avgDispense} unit="kg" icon={I.wheat} color="green" delay={0.15} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 310px', gap:14 }}>
          <Card style={{ padding:0 }}>
            <SectionHeader icon={I.activity} title="Dispense Activity — Last 7 Days" />
            <div style={{ padding:'20px 24px' }}>
              {barData.length===0 ? <EmptyState icon="📊" title="No chart data yet" sub="Transactions will populate this chart" /> : (
                <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:130 }}>
                  {barData.map((b,i) => (
                    <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                      <span style={{ fontSize:10, color:T.text2, fontFamily:"'IBM Plex Mono',monospace" }}>{b.v.toFixed(1)}</span>
                      <div style={{ width:'100%', background:T.greenDim, border:`1px solid ${T.greenBdr}`, borderRadius:4, height:Math.max(b.pct*90,6), transformOrigin:'bottom', animation:`barGrow 0.5s ${i*0.07}s ease both` }} />
                      <span style={{ fontSize:10, color:T.text3 }}>{b.d}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card style={{ padding:0 }}>
            <SectionHeader icon={I.shield} title="System Status" />
            <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:11 }}>
              {[
                { label:'Silo Dispenser #01',  status:'Operational', color:'green' },
                { label:'MOSIP Sandbox API',   status:'Connected',   color:'green' },
                { label:'Supabase Database',   status:'Connected',   color:'green' },
                { label:'RSBSA Integration',   status:'Mocked',      color:'amber' },
                { label:'Biometric Auth',      status:'Pending',     color:'amber' },
                { label:'Tamper-proof Logs',   status:'Active',      color:'green' },
              ].map((item,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:T.text2 }}>{item.label}</span>
                  <Badge color={item.color}>{item.status}</Badge>
                </div>
              ))}
            </div>
            <div style={{ margin:'0 14px 14px', padding:'12px 14px', background:T.greenDim, borderRadius:9, border:`1px solid ${T.greenBdr}` }}>
              <div style={{ fontSize:11, color:T.green, fontWeight:600, marginBottom:3 }}>Stage 5 — Live Sync Active</div>
              <div style={{ fontSize:11, color:T.text2, lineHeight:1.55 }}>Transactions recording to tamper-proof cloud DB in real time.</div>
            </div>
          </Card>
        </div>

        <Card style={{ padding:0 }}>
          <SectionHeader icon={I.clock} title="Live Transaction Stream" right={<div style={{ display:'flex', alignItems:'center', gap:6 }}><div className="dot-live" /><span style={{ fontSize:11, color:T.green }}>Auto-refresh</span></div>} />
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ background:'rgba(255,255,255,0.02)' }}>
              {['Farmer','PhilSys UIN','Dispensed','Auth','Location','Timestamp'].map(h => (
                <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:10, fontWeight:600, letterSpacing:'0.09em', textTransform:'uppercase', color:T.text3 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ padding:40, textAlign:'center' }}><div style={{ display:'inline-flex', gap:10, alignItems:'center', color:T.text3, fontSize:13 }}><div className="spinner" />Loading…</div></td></tr>
              : logs.length===0 ? <tr><td colSpan={6}><EmptyState icon="🌾" title="No transactions yet" sub="Use Farmer Portal or HW Simulator to create records" /></td></tr>
              : logs.map((log,i) => (
                <tr key={log.id} style={{ borderTop:`1px solid ${T.border}`, animation:`fadeIn 0.3s ${i*0.04}s ease both` }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'13px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Avatar name={log.rsbsa_farmers?.name} />
                      <div><div style={{ fontSize:13, fontWeight:500, color:T.text }}>{log.rsbsa_farmers?.name||'Unregistered'}</div><div style={{ fontSize:10, color:T.text3, display:'flex', alignItems:'center', gap:3, marginTop:2 }}>{I.pin} RSBSA</div></div>
                    </div>
                  </td>
                  <td style={{ padding:'13px 20px' }}><Mono>{log.national_id}</Mono></td>
                  <td style={{ padding:'13px 20px' }}><span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:500, color:T.green }}>{log.dispensed_kg} kg</span></td>
                  <td style={{ padding:'13px 20px' }}><Badge color="green" icon={I.shield}>MOSIP</Badge></td>
                  <td style={{ padding:'13px 20px' }}><span style={{ fontSize:11, color:T.text2 }}>{log.rsbsa_farmers?.location||'—'}</span></td>
                  <td style={{ padding:'13px 20px' }}>
                    <div style={{ fontSize:12, color:T.text2 }}>{new Date(log.timestamp).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</div>
                    <Mono style={{ fontSize:10, color:T.text3 }}>{new Date(log.timestamp).toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</Mono>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

// ── FARMER PAGE ───────────────────────────────────────────────────────────────
function FarmerPage({ toast }) {
  const [step, setStep]         = useState('idle');
  const [uid, setUid]           = useState('');
  const [farmerData, setFarmerData] = useState(null);
  const [kg, setKg]             = useState('');
  const [result, setResult]     = useState(null);
  const [errMsg, setErrMsg]     = useState('');
  const [zeroed, setZeroed]     = useState(false);
  const [tared, setTared]       = useState(false);

  const reset = () => { setStep('idle'); setUid(''); setFarmerData(null); setKg(''); setResult(null); setErrMsg(''); setZeroed(false); setTared(false); };

  const handleVerify = async () => {
    if (!uid.trim()) return;
    setStep('scanning');
    await new Promise(r=>setTimeout(r,1800));
    try {
      const res = await axios.post(`${API_URL}/api/verify-farmer`, { national_id:uid.trim() });
      setFarmerData(res.data.data); setStep('verified');
      toast('success',`Identity verified`,`Welcome, ${res.data.data.name}`);
    } catch(e) {
      setErrMsg(e?.response?.data?.detail||'ID not found in MOSIP or RSBSA database.');
      setStep('error'); toast('error','Verification failed','ID not registered in RSBSA');
    }
  };

  const handleZero  = () => { setZeroed(true); toast('info','Scale zeroed','Baseline set to 0.00 kg'); };
  const handleTare  = () => { setTared(true); setStep('dispensing'); toast('info','Scale tared','Container weight excluded'); };

  const handleDispense = async () => {
    const dispensed = parseFloat(kg);
    if (!dispensed || dispensed <= 0) return;
    if (dispensed > farmerData.quota_kg) { toast('warning','Exceeds quota',`Max: ${farmerData.quota_kg} kg`); return; }
    try {
      const res = await axios.post(`${API_URL}/api/log-transaction`, { national_id:uid.trim(), dispensed_kg:dispensed });
      setResult({ dispensed, new_quota:res.data.new_quota }); setStep('done');
      toast('success',`${dispensed} kg dispensed`,`Remaining quota: ${res.data.new_quota} kg`);
    } catch(e) {
      setErrMsg(e?.response?.data?.detail||'Dispense failed.'); setStep('error');
      toast('error','Dispense failed');
    }
  };

  const STEP_ORDER = ['idle','scanning','verified','weighing','dispensing','done','error'];
  const stepIdx = STEP_ORDER.indexOf(step);
  const PROGRESS = [
    { key:'idle',      label:'Arrival'     },
    { key:'verified',  label:'Verified'    },
    { key:'weighing',  label:'Calibration' },
    { key:'dispensing',label:'Dispensing'  },
    { key:'done',      label:'Complete'    },
  ];

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <Topbar title="Farmer Portal" sub="Step-by-step guided dispensing workflow — Stages 1 through 5" />
      <div style={{ flex:1, overflowY:'auto', padding:32, display:'flex', justifyContent:'center' }}>
        <div style={{ width:'100%', maxWidth:660 }}>

          {/* Stepper */}
          <div style={{ display:'flex', alignItems:'center', marginBottom:32 }}>
            {PROGRESS.map((s,i,arr) => {
              const sIdx = STEP_ORDER.indexOf(s.key);
              const done = stepIdx > sIdx;
              const active = step===s.key || (step==='scanning'&&s.key==='idle');
              return (
                <div key={s.key} style={{ display:'flex', alignItems:'center', flex:i<arr.length-1?1:0 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', border:`2px solid ${done||active?T.green:T.border2}`, background:done||active?T.greenDim:'transparent', display:'flex', alignItems:'center', justifyContent:'center', color:done||active?T.green:T.text3, fontSize:11, fontWeight:700, transition:'all 0.3s' }}>{done?I.check:i+1}</div>
                    <span style={{ fontSize:10, color:active||done?T.text2:T.text3, whiteSpace:'nowrap' }}>{s.label}</span>
                  </div>
                  {i<arr.length-1&&<div style={{ flex:1, height:1, margin:'0 6px', marginBottom:18, background:done?T.green:T.border, transition:'background 0.3s' }} />}
                </div>
              );
            })}
          </div>

          {/* ── IDLE / SCANNING ── */}
          {(step==='idle'||step==='scanning') && (
            <Card style={{ padding:32, animation:'scaleIn 0.3s ease' }}>
              <div style={{ textAlign:'center', marginBottom:28 }}>
                <div style={{ width:64, height:64, borderRadius:16, margin:'0 auto 16px', background:T.greenDim, border:`1px solid ${T.greenBdr}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.green }}>{I.scan}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:20, color:T.text, marginBottom:8 }}>Scan your PhilSys ID</div>
                <div style={{ fontSize:13, color:T.text2, lineHeight:1.6 }}>Present your National ID QR code to the scanner, or enter your UIN below.</div>
              </div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:T.text3, marginBottom:8 }}>PhilSys UIN</label>
              <input value={uid} onChange={e=>setUid(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleVerify()} placeholder="e.g. 5408602380" disabled={step==='scanning'}
                style={{ width:'100%', padding:'12px 14px', marginBottom:14, background:T.bg3, border:`1px solid ${T.border2}`, borderRadius:9, color:T.text, fontFamily:"'IBM Plex Mono',monospace", fontSize:14 }} />
              <button onClick={handleVerify} disabled={step==='scanning'||!uid.trim()}
                style={{ width:'100%', padding:13, borderRadius:9, border:'none', background:uid.trim()&&step!=='scanning'?T.green:T.bg4, color:uid.trim()&&step!=='scanning'?'#0b1a04':T.text3, fontSize:14, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'all 0.2s' }}>
                {step==='scanning'?<><div className="spinner" />Authenticating via MOSIP…</>:<>{I.zap} Verify Identity</>}
              </button>
              <div style={{ marginTop:20, padding:'14px', background:T.bg3, borderRadius:9, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:T.text3, marginBottom:8 }}>Sample RSBSA Farmers</div>
                {[{id:'5408602380',name:'Yuki Nakashima',quota:'50 kg'},{id:'6409739653',name:'Juan Dela Cruz',quota:'25.5 kg'},{id:'2092578314',name:'Mañuel Quezon',quota:'100 kg'}].map(f=>(
                  <button key={f.id} onClick={()=>setUid(f.id)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', padding:'8px 0', background:'none', border:'none', borderTop:`1px solid ${T.border}`, cursor:'pointer', textAlign:'left' }}>
                    <span style={{ fontSize:12, color:T.text2 }}>{f.name}</span>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}><Mono style={{ fontSize:11 }}>{f.id}</Mono><Badge color="gray">{f.quota}</Badge></div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* ── VERIFIED ── */}
          {step==='verified'&&farmerData&&(
            <div style={{ display:'flex', flexDirection:'column', gap:14, animation:'scaleIn 0.3s ease' }}>
              <div style={{ padding:'14px 18px', background:T.greenDim, border:`1px solid ${T.greenBdr}`, borderRadius:10, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:T.green, display:'flex', alignItems:'center', justifyContent:'center', color:'#0b1a04', flexShrink:0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray:100, strokeDashoffset:0, animation:'checkDraw 0.5s ease' }}><path d="M20 6 9 17 4 12"/></svg>
                </div>
                <div><div style={{ fontSize:13, fontWeight:600, color:T.green }}>MOSIP Authentication Successful</div><div style={{ fontSize:11, color:T.text2, marginTop:2 }}>Identity confirmed via PhilSys biometric database</div></div>
                <Badge color="green" style={{ marginLeft:'auto' }}>Stage 1 ✓</Badge>
              </div>
              <Card style={{ padding:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, paddingBottom:20, borderBottom:`1px solid ${T.border}` }}>
                  <Avatar name={farmerData.name} size={52} />
                  <div><div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:20, color:T.text }}>{farmerData.name}</div><div style={{ fontSize:12, color:T.text2, display:'flex', alignItems:'center', gap:5, marginTop:4 }}>{I.pin}{farmerData.location||'Location not set'}</div></div>
                  <Badge color="green" icon={I.shield} style={{ marginLeft:'auto' }}>RSBSA Verified</Badge>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
                  {[{label:'PhilSys UIN',value:uid,mono:true},{label:'Fertilizer Quota',value:`${farmerData.quota_kg} kg`,hi:true},{label:'Registry Status',value:'Active Member'}].map((item,i)=>(
                    <div key={i} style={{ background:T.bg3, borderRadius:9, padding:'12px 14px', border:`1px solid ${T.border}` }}>
                      <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:T.text3, marginBottom:5 }}>{item.label}</div>
                      {item.mono?<Mono style={{ fontSize:13, color:T.text }}>{item.value}</Mono>:<div style={{ fontSize:14, fontWeight:500, color:item.hi?T.green:T.text }}>{item.value}</div>}
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                    <span style={{ fontSize:11, color:T.text3, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Remaining Quota</span>
                    <span style={{ fontSize:12, color:T.green, fontWeight:600 }}>{farmerData.quota_kg} kg available</span>
                  </div>
                  <div style={{ height:8, background:T.bg4, borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:4, background:T.green, width:`${Math.min((farmerData.quota_kg/100)*100,100)}%`, transition:'width 0.6s' }} />
                  </div>
                </div>
                <button onClick={()=>setStep('weighing')} style={{ width:'100%', padding:13, borderRadius:9, border:'none', background:T.green, color:'#0b1a04', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  {I.weight} Proceed to Scale Calibration — Stage 3
                </button>
              </Card>
            </div>
          )}

          {/* ── WEIGHING ── */}
          {step==='weighing'&&(
            <Card style={{ padding:28, animation:'scaleIn 0.3s ease' }}>
              <Badge color="amber" style={{ marginBottom:14 }}>Stage 3 — Scale Calibration</Badge>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:T.text, marginBottom:8 }}>Calibrate the Weighing Scale</div>
              <div style={{ fontSize:13, color:T.text2, lineHeight:1.6, marginBottom:24 }}>Follow these steps in order. The HX711 load cell measures weight in real-time to stop dispensing at the exact quota.</div>
              {[
                { num:1, done:zeroed, title:'Zero the Scale', sub:'Ensure scale platform is completely empty', action:'Press Zero Button', fn:handleZero },
                { num:2, done:tared,  title:'Place container & Tare', sub:'Set container on scale, then tare to exclude its weight', action:'Press Tare Button', fn:handleTare, locked:!zeroed },
              ].map((s,i)=>(
                <div key={i} style={{ padding:'16px 18px', borderRadius:10, marginBottom:12, background:s.done?T.greenDim:T.bg3, border:`1px solid ${s.done?T.greenBdr:T.border}`, opacity:s.locked?0.45:1, transition:'all 0.3s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:s.done?0:12 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', border:`2px solid ${s.done?T.green:T.border2}`, background:s.done?T.greenDim:'transparent', display:'flex', alignItems:'center', justifyContent:'center', color:s.done?T.green:T.text3, fontSize:11, fontWeight:700, flexShrink:0 }}>{s.done?I.check:s.num}</div>
                    <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:500, color:s.done?T.green:T.text }}>{s.title}</div><div style={{ fontSize:11, color:T.text3, marginTop:2 }}>{s.sub}</div></div>
                    {s.done&&<Badge color="green">Done</Badge>}
                  </div>
                  {!s.done&&!s.locked&&<button onClick={s.fn} style={{ width:'100%', padding:'10px', borderRadius:8, border:`1px solid ${T.border2}`, background:T.bg4, color:T.text, fontSize:13, fontWeight:500, cursor:'pointer' }}>{s.action}</button>}
                </div>
              ))}
            </Card>
          )}

          {/* ── DISPENSING ── */}
          {step==='dispensing'&&farmerData&&(
            <Card style={{ padding:28, animation:'scaleIn 0.3s ease' }}>
              <Badge color="blue" style={{ marginBottom:14 }}>Stage 4 — Fertilizer Dispensing</Badge>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:T.text, marginBottom:20 }}>Ready to Dispense</div>
              <div style={{ padding:'14px 16px', background:T.greenDim, border:`1px solid ${T.greenBdr}`, borderRadius:9, marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:T.text2 }}>Maximum for {farmerData.name}</span>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:16, fontWeight:500, color:T.green }}>{farmerData.quota_kg} kg</span>
              </div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:T.text3, marginBottom:8 }}>Amount to Dispense (kg)</label>
              <input type="number" value={kg} onChange={e=>setKg(e.target.value)} placeholder="0.0" max={farmerData.quota_kg} min="0.1" step="0.5"
                style={{ width:'100%', padding:'14px', borderRadius:9, background:T.bg3, border:`1px solid ${T.border2}`, color:T.text, fontFamily:"'IBM Plex Mono',monospace", fontSize:22, textAlign:'center', marginBottom:8 }} />
              {kg&&parseFloat(kg)>farmerData.quota_kg&&<div style={{ fontSize:12, color:T.amber, display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>{I.alert} Exceeds quota of {farmerData.quota_kg} kg</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:18 }}>
                {[5,10,25,farmerData.quota_kg].map(v=>(
                  <button key={v} onClick={()=>setKg(String(v))} style={{ padding:'9px', borderRadius:8, border:`1px solid ${parseFloat(kg)===v?T.greenBdr:T.border}`, background:parseFloat(kg)===v?T.greenDim:T.bg3, color:parseFloat(kg)===v?T.green:T.text2, fontSize:13, fontWeight:500, cursor:'pointer' }}>{v} kg</button>
                ))}
              </div>
              <button onClick={handleDispense} disabled={!kg||parseFloat(kg)<=0||parseFloat(kg)>farmerData.quota_kg}
                style={{ width:'100%', padding:13, borderRadius:9, border:'none', background:kg&&parseFloat(kg)>0&&parseFloat(kg)<=farmerData.quota_kg?T.green:T.bg4, color:kg&&parseFloat(kg)>0&&parseFloat(kg)<=farmerData.quota_kg?'#0b1a04':T.text3, fontSize:14, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {I.zap} Activate Silo Dispenser
              </button>
            </Card>
          )}

          {/* ── DONE ── */}
          {step==='done'&&result&&(
            <Card style={{ padding:36, textAlign:'center', animation:'scaleIn 0.35s ease' }} glow>
              <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 20px', background:T.greenDim, border:`2px solid ${T.green}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.green }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray:100, strokeDashoffset:0, animation:'checkDraw 0.6s 0.1s ease both' }}><path d="M20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, color:T.green, marginBottom:8 }}>Dispense Complete!</div>
              <div style={{ fontSize:14, color:T.text2, marginBottom:28, lineHeight:1.6 }}>Transaction recorded to tamper-proof cloud database.</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24, textAlign:'left' }}>
                {[{label:'Farmer',value:farmerData.name},{label:'PhilSys UIN',value:uid,mono:true},{label:'Amount Dispensed',value:`${result.dispensed} kg`,hi:true},{label:'Remaining Quota',value:`${result.new_quota} kg`},{label:'Auth Method',value:'MOSIP KYC'},{label:'Timestamp',value:new Date().toLocaleString('en-PH')}].map((item,i)=>(
                  <div key={i} style={{ background:T.bg3, borderRadius:9, padding:'12px 14px', border:`1px solid ${T.border}` }}>
                    <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:T.text3, marginBottom:5 }}>{item.label}</div>
                    {item.mono?<Mono style={{ color:T.text, fontSize:12 }}>{item.value}</Mono>:<div style={{ fontSize:14, fontWeight:500, color:item.hi?T.green:T.text }}>{item.value}</div>}
                  </div>
                ))}
              </div>
              <div style={{ padding:'12px 16px', background:T.bg3, borderRadius:9, border:`1px solid ${T.border}`, marginBottom:20, fontSize:12, color:T.text2, lineHeight:1.7, display:'flex', gap:10, alignItems:'flex-start', textAlign:'left' }}>
                <span style={{ color:T.green, flexShrink:0, marginTop:1 }}>{I.shield}</span>
                <span>This transaction is encrypted and logged in the national government database as a tamper-proof record accessible to auditors.</span>
              </div>
              <button onClick={reset} style={{ width:'100%', padding:13, borderRadius:9, border:`1px solid ${T.border2}`, background:'transparent', color:T.text2, fontSize:14, fontWeight:500, cursor:'pointer' }}>Start New Transaction</button>
            </Card>
          )}

          {/* ── ERROR ── */}
          {step==='error'&&(
            <Card style={{ padding:32, textAlign:'center', animation:'scaleIn 0.3s ease', border:`1px solid ${T.redBdr}` }}>
              <div style={{ width:60, height:60, borderRadius:'50%', margin:'0 auto 16px', background:T.redDim, border:`2px solid ${T.redBdr}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.red }}>{I.xmark}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:20, color:T.red, marginBottom:8 }}>Verification Failed</div>
              <div style={{ fontSize:13, color:T.text2, marginBottom:24, lineHeight:1.6 }}>{errMsg}</div>
              <button onClick={reset} style={{ padding:'11px 28px', borderRadius:9, border:`1px solid ${T.border2}`, background:T.bg3, color:T.text, fontSize:14, cursor:'pointer' }}>Try Again</button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── HW SIMULATOR PAGE ─────────────────────────────────────────────────────────
function SimPage({ toast }) {
  const [simId, setSimId]             = useState('5408602380');
  const [simKg, setSimKg]             = useState(5);
  const [verifyState, setVerifyState] = useState('idle');
  const [verifyData, setVerifyData]   = useState(null);
  const [dispenseState, setDispState] = useState('idle');
  const [scalePct, setScalePct]       = useState(0);
  const [log, setLog]                 = useState([]);

  const addLog = (msg, type='system') => setLog(p=>[{msg,type,ts:new Date()},...p].slice(0,30));

  const handleScan = async () => {
    setVerifyState('loading'); setVerifyData(null);
    addLog(`[UART] GM861S scanner → ESP32: raw_qr="${simId}"`, 'system');
    addLog(`[WiFi] ESP32 → Server: POST /api/verify-farmer`, 'system');
    await new Promise(r=>setTimeout(r,1200));
    try {
      const res = await axios.post(`${API_URL}/api/verify-farmer`, { national_id:simId });
      setVerifyData(res.data.data); setVerifyState('success');
      addLog(`[MOSIP] authStatus: TRUE — KYC confirmed`, 'success');
      addLog(`[DB] RSBSA: found "${res.data.data.name}", quota=${res.data.data.quota_kg}kg`, 'success');
      addLog(`[Display] Quota approved → ${res.data.data.quota_kg} kg`, 'success');
      toast('success',`MOSIP verified: ${res.data.data.name}`,`Quota: ${res.data.data.quota_kg} kg`);
    } catch {
      setVerifyState('error');
      addLog(`[MOSIP] authStatus: FALSE — ID not in registry`, 'error');
      addLog(`[Display] ACCESS DENIED`, 'error');
      toast('error','MOSIP authentication failed','ID not found in RSBSA');
    }
  };

  const handleDispense = async () => {
    setDispState('loading'); setScalePct(0);
    addLog(`[HX711] Scale tared. Container weight excluded.`, 'system');
    addLog(`[Button] START pressed → servo motor activated`, 'system');
    addLog(`[Auger] Rotating. Weight: 0.0 / target: ${simKg} kg`, 'system');
    const ticks = [0.3, 0.55, 0.78, 1.0];
    for (const pct of ticks) {
      await new Promise(r=>setTimeout(r,500));
      setScalePct(pct);
      if (pct < 1) addLog(`[Auger] Weight: ${(simKg*pct).toFixed(1)} / ${simKg} kg`, 'system');
    }
    try {
      await axios.post(`${API_URL}/api/log-transaction`, { national_id:simId, dispensed_kg:parseFloat(simKg) });
      setDispState('success');
      addLog(`[Auger] Target reached: ${simKg} kg → servo STOPPED`, 'success');
      addLog(`[WiFi] POST /api/log-transaction → 200 OK`, 'success');
      addLog(`[DB] Transaction logged. Quota updated in Supabase.`, 'success');
      toast('success',`${simKg} kg dispensed`,`ID ${simId} — recorded`);
    } catch {
      setDispState('error');
      addLog(`[ERROR] Transaction log failed`, 'error');
      toast('error','Log failed','Check server connection');
    } finally {
      setTimeout(()=>{setDispState('idle'); setScalePct(0);}, 3500);
    }
  };

  const logColor = { success:T.green, error:T.red, system:T.blue };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <Topbar title="Hardware Simulator" sub="Simulates the full ESP32 → MOSIP → Supabase pipeline for integration testing" right={<Badge color="amber">{I.zap} DEV MODE</Badge>} />
      <div style={{ flex:1, overflowY:'auto', padding:24, display:'grid', gridTemplateColumns:'350px 1fr', gap:18, alignContent:'start' }}>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* ID Scan card */}
          <Card style={{ padding:0 }}>
            <SectionHeader icon={I.scan} title="Stage 1 — ID Scan (GM861S)" />
            <div style={{ padding:'18px 20px' }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:T.text3, marginBottom:8 }}>Simulate QR Scan Output (UART)</label>
              <input value={simId} onChange={e=>setSimId(e.target.value)} style={{ width:'100%', padding:'10px 12px', marginBottom:12, background:T.bg3, border:`1px solid ${T.border2}`, borderRadius:8, color:T.text, fontFamily:"'IBM Plex Mono',monospace", fontSize:13 }} />
              <button onClick={handleScan} disabled={verifyState==='loading'}
                style={{ width:'100%', padding:'11px', borderRadius:8, border:'none', background:verifyState==='loading'?T.bg4:T.green, color:verifyState==='loading'?T.text3:'#0b1a04', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {verifyState==='loading'?<><div className="spinner" style={{ borderTopColor:T.text3 }}/>Querying MOSIP…</>:<>{I.zap} Trigger ID Scan</>}
              </button>
              {verifyState==='success'&&verifyData&&(
                <div style={{ marginTop:14, padding:'14px', background:T.greenDim, border:`1px solid ${T.greenBdr}`, borderRadius:9, animation:'slideDown 0.2s ease' }}>
                  <div style={{ fontSize:10, color:T.green, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:10 }}>KYC Auth Response</div>
                  {[['Name',verifyData.name],['Location',verifyData.location||'—'],['Quota',`${verifyData.quota_kg} kg`],['authStatus','TRUE'],['authToken','••••••••••••']].map(([k,v])=>(
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderTop:`1px solid ${T.greenBdr}` }}>
                      <span style={{ fontSize:11, color:T.text3 }}>{k}</span>
                      <span style={{ fontSize:11, color:k==='authStatus'?T.green:T.text, fontWeight:500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
              {verifyState==='error'&&(
                <div style={{ marginTop:14, padding:'12px', background:T.redDim, border:`1px solid ${T.redBdr}`, borderRadius:9, animation:'slideDown 0.2s ease' }}>
                  <div style={{ fontSize:12, color:T.red, fontWeight:600 }}>AUTH FAILED</div>
                  <div style={{ fontSize:11, color:T.text2, marginTop:3 }}>authStatus: false — ID not in RSBSA</div>
                </div>
              )}
            </div>
          </Card>

          {/* Dispense card */}
          <Card style={{ padding:0 }}>
            <SectionHeader icon={I.weight} title="Stage 4 — Dispenser (HX711)" />
            <div style={{ padding:'18px 20px' }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:T.text3, marginBottom:8 }}>Target kg — Servo + Load Cell</label>
              <input type="number" value={simKg} onChange={e=>setSimKg(e.target.value)} min="0.1" step="0.5"
                style={{ width:'100%', padding:'10px 12px', marginBottom:12, background:T.bg3, border:`1px solid ${T.border2}`, borderRadius:8, color:T.text, fontFamily:"'IBM Plex Mono',monospace", fontSize:13 }} />
              {/* Scale viz */}
              <div style={{ padding:'12px 14px', background:T.bg3, border:`1px solid ${T.border}`, borderRadius:8, marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:10, color:T.text3, textTransform:'uppercase', letterSpacing:'0.08em' }}>HX711 Reading</span>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, color:dispenseState==='success'?T.green:T.text2 }}>{(simKg*scalePct).toFixed(2)} kg</span>
                </div>
                <div style={{ height:8, background:T.bg4, borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:4, background:dispenseState==='success'?T.green:T.blue, width:`${scalePct*100}%`, transition:'width 0.5s ease' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                  <span style={{ fontSize:10, color:T.text3 }}>0 kg</span>
                  <span style={{ fontSize:10, color:T.text3 }}>{simKg} kg target</span>
                </div>
              </div>
              <button onClick={handleDispense} disabled={dispenseState==='loading'}
                style={{ width:'100%', padding:'11px', borderRadius:8, border:`1px solid ${T.blueBdr}`, background:T.blueDim, color:T.blue, fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {dispenseState==='loading'?<><div className="spinner" style={{ borderTopColor:T.blue }}/>Dispensing…</>:<>{I.plus} Simulate Dispense</>}
              </button>
              {dispenseState==='success'&&<div style={{ marginTop:10, padding:'10px 12px', background:T.greenDim, border:`1px solid ${T.greenBdr}`, borderRadius:8, fontSize:12, color:T.green, fontWeight:500 }}>✓ {simKg} kg dispensed — Supabase updated</div>}
            </div>
          </Card>

          {/* MOSIP info */}
          <Card style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:T.text3, marginBottom:10 }}>MOSIP SDK Reference</div>
            {[{label:'Auth Type',val:'KYC (Know Your Customer)'},{label:'Endpoint',val:'PIIDTL Testbed'},{label:'Transport',val:'WireGuard VPN'},{label:'SDK',val:'mosip_auth_sdk (Python)'},{label:'ID Type',val:'UIN (Unique ID Number)'}].map(({label,val})=>(
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderTop:`1px solid ${T.border}` }}>
                <span style={{ fontSize:11, color:T.text3 }}>{label}</span>
                <Mono style={{ fontSize:11, color:T.text2 }}>{val}</Mono>
              </div>
            ))}
          </Card>
        </div>

        {/* Serial log */}
        <Card style={{ padding:0, display:'flex', flexDirection:'column' }}>
          <SectionHeader icon={I.activity} title="Serial / System Log — ESP32 Console"
            right={<button onClick={()=>setLog([])} style={{ fontSize:11, color:T.text3, background:'none', border:'none', cursor:'pointer' }}>Clear</button>} />
          <div style={{ flex:1, overflowY:'auto', padding:'14px 18px', fontFamily:"'IBM Plex Mono',monospace", maxHeight:560 }}>
            {log.length===0?(
              <div style={{ color:T.text3, fontSize:12, paddingTop:12 }}>
                <span style={{ color:T.green }}>$</span> Waiting for hardware events…<span style={{ animation:'pulse 1.2s infinite', display:'inline-block', marginLeft:2 }}>▋</span>
              </div>
            ):log.map((entry,i)=>(
              <div key={i} style={{ marginBottom:7, fontSize:12, lineHeight:1.5, animation:i===0?'slideDown 0.15s ease':'none' }}>
                <span style={{ color:T.text3 }}>{entry.ts.toLocaleTimeString('en-PH',{hour12:false})} </span>
                <span style={{ color:logColor[entry.type]||T.text2 }}>{entry.msg}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── REGISTRY PAGE ─────────────────────────────────────────────────────────────
function RegistryPage({ toast }) {
  const [selected, setSelected] = useState(null);
  const FARMERS = [
    { national_id:'5408602380', name:'Yuki Nakashima', quota_kg:50.0,  location:'UP Diliman, Quezon City', status:'Active', benefit:'Fertilizer Subsidy', registered:'2024-01-15' },
    { national_id:'6409739653', name:'Juan Dela Cruz',  quota_kg:25.5,  location:'San Jose, Nueva Ecija',   status:'Active', benefit:'Fertilizer Subsidy', registered:'2023-09-08' },
    { national_id:'2092578314', name:'Mañuel Quezon',   quota_kg:100.0, location:'Baler, Aurora',           status:'Active', benefit:'Fertilizer Subsidy', registered:'2023-03-22' },
  ];

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <Topbar title="RSBSA Registry" sub="Registry System for Basic Sectors in Agriculture — simulated national beneficiary database" />
      <div style={{ flex:1, overflowY:'auto', padding:24, display:'grid', gridTemplateColumns:selected?'1fr 340px':'1fr', gap:18, alignContent:'start' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ padding:'14px 18px', background:T.amberDim, border:`1px solid ${T.amberBdr}`, borderRadius:10, display:'flex', gap:12 }}>
            <span style={{ color:T.amber, flexShrink:0, marginTop:1 }}>{I.info}</span>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:T.amber, marginBottom:4 }}>Mocked RSBSA Database — Development Mode</div>
              <div style={{ fontSize:12, color:T.text2, lineHeight:1.6 }}>In production this connects to the real DA database. A 2025 COA report found 58,000 ineligible ghost beneficiaries in the real RSBSA — AgriAble adds MOSIP biometric verification to each dispense to prevent fraud.</div>
            </div>
          </div>
          <Card style={{ padding:0 }}>
            <SectionHeader icon={I.users} title="Registered Farmers" right={<Badge color="gray">{FARMERS.length} entries</Badge>} />
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ background:'rgba(255,255,255,0.02)' }}>
                {['Farmer','PhilSys UIN','Remaining Quota','Location','Status',''].map(h=>(
                  <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:10, fontWeight:600, letterSpacing:'0.09em', textTransform:'uppercase', color:T.text3 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {FARMERS.map((f,i)=>(
                  <tr key={f.national_id} onClick={()=>setSelected(selected?.national_id===f.national_id?null:f)}
                    style={{ borderTop:`1px solid ${T.border}`, cursor:'pointer', background:selected?.national_id===f.national_id?T.bg3:'transparent', transition:'background 0.1s', animation:`fadeUp 0.3s ${i*0.06}s ease both` }}
                    onMouseEnter={e=>{ if(selected?.national_id!==f.national_id) e.currentTarget.style.background='rgba(255,255,255,0.025)'; }}
                    onMouseLeave={e=>{ if(selected?.national_id!==f.national_id) e.currentTarget.style.background='transparent'; }}>
                    <td style={{ padding:'14px 20px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}><Avatar name={f.name} /><span style={{ fontSize:13, fontWeight:500, color:T.text }}>{f.name}</span></div>
                    </td>
                    <td style={{ padding:'14px 20px' }}><Mono>{f.national_id}</Mono></td>
                    <td style={{ padding:'14px 20px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:56, height:5, background:T.bg4, borderRadius:3, overflow:'hidden' }}><div style={{ height:'100%', width:`${Math.min((f.quota_kg/100)*100,100)}%`, background:T.green, borderRadius:3 }} /></div>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:T.green }}>{f.quota_kg} kg</span>
                      </div>
                    </td>
                    <td style={{ padding:'14px 20px' }}><span style={{ fontSize:12, color:T.text2 }}>{f.location}</span></td>
                    <td style={{ padding:'14px 20px' }}><Badge color="green">{f.status}</Badge></td>
                    <td style={{ padding:'14px 20px', color:T.text3 }}>{I.chevron}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
        {selected&&(
          <div style={{ animation:'slideDown 0.2s ease' }}>
            <Card style={{ padding:0, position:'sticky', top:0 }}>
              <div style={{ padding:'15px 18px', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, fontWeight:500, color:T.text }}>Farmer Profile</span>
                <button onClick={()=>setSelected(null)} style={{ background:'none', border:'none', color:T.text3, cursor:'pointer', display:'flex' }}>{I.xmark}</button>
              </div>
              <div style={{ padding:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, paddingBottom:20, borderBottom:`1px solid ${T.border}` }}>
                  <Avatar name={selected.name} size={48} />
                  <div><div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:17, color:T.text }}>{selected.name}</div><div style={{ fontSize:11, color:T.text3, marginTop:3 }}>{selected.location}</div></div>
                </div>
                {[['PhilSys UIN',selected.national_id,true],['Quota Remaining',`${selected.quota_kg} kg`,false,true],['Registry Status',selected.status],['Benefit Type',selected.benefit],['Registered',selected.registered],['Auth Method','MOSIP KYC + RSBSA'],['Distribution Point','AgriAble Silo #01']].map(([k,v,mono,hi])=>(
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ fontSize:12, color:T.text3 }}>{k}</span>
                    {mono?<Mono style={{ color:T.text, fontSize:12 }}>{v}</Mono>:<span style={{ fontSize:12, fontWeight:500, color:hi?T.green:T.text }}>{v}</span>}
                  </div>
                ))}
                <div style={{ marginTop:16 }}>
                  <div style={{ fontSize:11, color:T.text3, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Quota Status</div>
                  <div style={{ height:10, background:T.bg4, borderRadius:5, overflow:'hidden', marginBottom:6 }}><div style={{ height:'100%', background:T.green, borderRadius:5, width:`${Math.min((selected.quota_kg/100)*100,100)}%`, transition:'width 0.5s' }} /></div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:T.text3 }}><span>0 kg</span><span>{selected.quota_kg} / 100 kg max</span></div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AUDIT LOG PAGE ────────────────────────────────────────────────────────────
function AuditPage({ toast }) {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/api/recent-logs`).then(r=>{ setLogs(r.data); setLoading(false); }).catch(()=>{ toast('error','Failed to load logs'); setLoading(false); });
  }, []);

  const filtered = logs.filter(l => !filter || l.national_id?.includes(filter) || l.rsbsa_farmers?.name?.toLowerCase().includes(filter.toLowerCase()));
  const totalKg = filtered.reduce((a,l)=>a+l.dispensed_kg,0);

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <Topbar title="Audit Logs" sub="Tamper-proof transaction traceability — Stage 5 encrypted database records" />
      <div style={{ flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:18 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          <StatCard label="Total Records" value={filtered.length} icon={I.db} color="blue" delay={0} />
          <StatCard label="Total Dispensed" value={totalKg.toFixed(2)} unit="kg" icon={I.package} color="green" delay={0.05} />
          <StatCard label="Avg. per Transaction" value={filtered.length?(totalKg/filtered.length).toFixed(1):'—'} unit="kg" icon={I.activity} color="amber" delay={0.1} />
        </div>
        <Card style={{ padding:0 }}>
          <div style={{ padding:'13px 20px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ color:T.text3, display:'flex' }}>{I.filter}</span>
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter by name or PhilSys UIN…" style={{ background:'none', border:'none', color:T.text, fontSize:13, flex:1 }} />
            {filter&&<button onClick={()=>setFilter('')} style={{ background:'none', border:'none', color:T.text3, cursor:'pointer', display:'flex' }}>{I.xmark}</button>}
            <Badge color="gray">{filtered.length} records</Badge>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ background:'rgba(255,255,255,0.02)' }}>
              {['#','Farmer','PhilSys UIN','Dispensed','Auth','Timestamp','Transaction ID'].map(h=>(
                <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:10, fontWeight:600, letterSpacing:'0.09em', textTransform:'uppercase', color:T.text3 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading?<tr><td colSpan={7} style={{ padding:40, textAlign:'center' }}><div style={{ display:'inline-flex', gap:10, alignItems:'center', color:T.text3, fontSize:13 }}><div className="spinner" />Loading…</div></td></tr>
              :filtered.length===0?<tr><td colSpan={7}><EmptyState icon="📋" title={filter?'No matching records':'No transactions yet'} sub={filter?'Try a different filter':'Dispense fertilizer to see records here'} /></td></tr>
              :filtered.map((log,i)=>(
                <tr key={log.id} style={{ borderTop:`1px solid ${T.border}`, animation:`fadeIn 0.3s ${i*0.03}s ease both` }}>
                  <td style={{ padding:'12px 18px', color:T.text3, fontSize:11 }}>{i+1}</td>
                  <td style={{ padding:'12px 18px' }}><div style={{ display:'flex', alignItems:'center', gap:8 }}><Avatar name={log.rsbsa_farmers?.name} size={28} /><span style={{ fontSize:13, color:T.text }}>{log.rsbsa_farmers?.name||'Unknown'}</span></div></td>
                  <td style={{ padding:'12px 18px' }}><Mono>{log.national_id}</Mono></td>
                  <td style={{ padding:'12px 18px' }}><span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:500, color:T.green }}>{log.dispensed_kg} kg</span></td>
                  <td style={{ padding:'12px 18px' }}><Badge color="green" icon={I.shield}>MOSIP</Badge></td>
                  <td style={{ padding:'12px 18px' }}>
                    <div style={{ fontSize:12, color:T.text2 }}>{new Date(log.timestamp).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</div>
                    <Mono style={{ fontSize:10, color:T.text3 }}>{new Date(log.timestamp).toLocaleTimeString('en-PH',{hour12:false})}</Mono>
                  </td>
                  <td style={{ padding:'12px 18px' }}><Mono style={{ fontSize:10, color:T.text3 }}>{log.id?.slice(0,13)}…</Mono></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div style={{ padding:'14px 18px', background:T.bg2, border:`1px solid ${T.border}`, borderRadius:10, fontSize:12, color:T.text2, lineHeight:1.7, display:'flex', gap:12 }}>
          <span style={{ color:T.green, flexShrink:0 }}>{I.shield}</span>
          <span><strong style={{ color:T.text }}>Tamper-proof by design.</strong> All records are encrypted in Supabase and accessible to national government auditors. Farmers' personal data is encrypted to prevent tampering. This directly addresses the transparency failures that enabled the 2004 Fertilizer Fund Scam (₱728M diverted) and the 2026 ghost-delivery allegations (₱30B probe).</span>
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]   = useState('admin');
  const [online, setOnline] = useState(true);
  const { toasts, add: toast } = useToast();
  const styleRef = useRef(null);

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    styleRef.current = el;
    return () => { if(styleRef.current) document.head.removeChild(styleRef.current); };
  }, []);

  useEffect(() => {
    const check = () => axios.get(`${API_URL}/`).then(()=>setOnline(true)).catch(()=>setOnline(false));
    check();
    const iv = setInterval(check, 6000);
    return () => clearInterval(iv);
  }, []);

  const PAGES = { admin:<AdminPage toast={toast}/>, farmer:<FarmerPage toast={toast}/>, sim:<SimPage toast={toast}/>, registry:<RegistryPage toast={toast}/>, logs:<AuditPage toast={toast}/> };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:T.bg }}>
      <Sidebar page={page} setPage={setPage} online={online} />
      {PAGES[page]}
      <ToastStack toasts={toasts} />
    </div>
  );
}