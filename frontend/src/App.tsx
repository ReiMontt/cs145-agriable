import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";

const API_URL = "";
const MACHINE_ID = "WEB_KIOSK_01"; // For Farmer Page
const SIMULATOR_ID = "SIMULATOR_ESP32"; // For Simulator Page

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
  .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; animation: fadeIn 0.2s ease; }
`;

// ── TOKENS ────────────────────────────────────────────────────────────────────
const T = {
  bg: "#0b0e13",
  bg2: "#111520",
  bg3: "#171c28",
  bg4: "#1e2436",
  border: "rgba(255,255,255,0.07)",
  border2: "rgba(255,255,255,0.13)",
  text: "#d8dcc8",
  text2: "#7a8070",
  text3: "#3d4438",
  green: "#9dbc5e",
  greenDim: "rgba(157,188,94,0.11)",
  greenBdr: "rgba(157,188,94,0.22)",
  blue: "#6090c8",
  blueDim: "rgba(96,144,200,0.11)",
  blueBdr: "rgba(96,144,200,0.22)",
  amber: "#d4a055",
  amberDim: "rgba(212,160,85,0.11)",
  amberBdr: "rgba(212,160,85,0.22)",
  red: "#c05050",
  redDim: "rgba(192,80,80,0.11)",
  redBdr: "rgba(192,80,80,0.22)",
};

// ── ICONS ─────────────────────────────────────────────────────────────────────
const Ic = ({ p, size = 16, sw = 1.75 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {[].concat(p).map((d, i) => (
      <path key={i} d={d} />
    ))}
  </svg>
);
const I = {
  leaf: (
    <Ic
      size={18}
      p={[
        "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z",
        "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12",
      ]}
    />
  ),
  grid: (
    <Ic
      size={15}
      p={["M3 3h7v7H3z", "M14 3h7v7h-7z", "M3 14h7v7H3z", "M14 14h7v7h-7z"]}
    />
  ),
  zap: <Ic size={15} sw={2} p="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  users: (
    <Ic
      size={15}
      p={[
        "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
        "M23 21v-2a4 4 0 0 0-3-3.87",
        "M16 3.13a4 4 0 0 1 0 7.75",
      ]}
    />
  ),
  shield: (
    <Ic
      size={14}
      p={["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "M9 12l2 2 4-4"]}
    />
  ),
  package: (
    <Ic
      size={15}
      p={["M12 2 2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"]}
    />
  ),
  pin: (
    <Ic
      size={11}
      p={[
        "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z",
        "M12 10m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0",
      ]}
    />
  ),
  clock: (
    <Ic
      size={13}
      p={["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", "M12 6v6l4 2"]}
    />
  ),
  check: <Ic size={13} sw={2.5} p="M20 6 9 17 4 12" />,
  xmark: <Ic size={13} sw={2.5} p={["M18 6 6 18", "M6 6l12 12"]} />,
  info: (
    <Ic
      size={13}
      p={["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", "M12 16v-4", "M12 8h.01"]}
    />
  ),
  alert: (
    <Ic
      size={13}
      p={[
        "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
        "M12 9v4",
        "M12 17h.01",
      ]}
    />
  ),
  refresh: (
    <Ic
      size={13}
      p={[
        "M23 4v6h-6",
        "M1 20v-6h6",
        "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
      ]}
    />
  ),
  activity: <Ic size={14} p="M22 12h-4l-3 9L9 3l-3 9H2" />,
  chevron: <Ic size={13} sw={2} p="M9 18l6-6-6-6" />,
  plus: <Ic size={14} sw={2.5} p={["M12 5v14", "M5 12h14"]} />,
  scan: (
    <Ic
      size={22}
      p={[
        "M3 7V5a2 2 0 0 1 2-2h2",
        "M17 3h2a2 2 0 0 1 2 2v2",
        "M21 17v2a2 2 0 0 1-2 2h-2",
        "M7 21H5a2 2 0 0 1-2-2v-2",
        "M7 12h10",
      ]}
    />
  ),
  wheat: (
    <Ic
      size={15}
      p={[
        "M2 22 16 8",
        "M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94z",
        "M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94z",
        "M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94z",
        "M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4z",
      ]}
    />
  ),
  weight: (
    <Ic
      size={17}
      p={[
        "M6 2h12l2 6H4L6 2z",
        "M4 8v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8",
        "M12 12v4",
        "M10 14h4",
      ]}
    />
  ),
  db: (
    <Ic
      size={15}
      p={[
        "M12 2a9 3 0 1 0 0 .1",
        "M3 5v14a9 3 0 0 0 18 0V5",
        "M3 12a9 3 0 0 0 18 0",
      ]}
    />
  ),
  filter: <Ic size={13} p="M22 3H2l8 9.46V19l4 2v-8.54L22 3" />,
  trash: (
    <Ic
      size={14}
      p={[
        "M3 6h18",
        "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
      ]}
    />
  ),
  edit: (
    <Ic
      size={14}
      p={[
        "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
        "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
      ]}
    />
  ),
};

// ── SHARED UI ─────────────────────────────────────────────────────────────────
function Badge({ color = "green", icon, children, style }) {
  const c = {
    green: { bg: T.greenDim, bdr: T.greenBdr, txt: T.green },
    blue: { bg: T.blueDim, bdr: T.blueBdr, txt: T.blue },
    amber: { bg: T.amberDim, bdr: T.amberBdr, txt: T.amber },
    red: { bg: T.redDim, bdr: T.redBdr, txt: T.red },
    gray: { bg: "rgba(255,255,255,0.04)", bdr: T.border2, txt: T.text2 },
  }[color];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "4px 9px",
        borderRadius: 6,
        background: c.bg,
        border: `1px solid ${c.bdr}`,
        color: c.txt,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      {children}
    </span>
  );
}

function Card({ children, style, glow }) {
  return (
    <div
      style={{
        background: T.bg2,
        border: `1px solid ${glow ? T.greenBdr : T.border}`,
        borderRadius: 14,
        boxShadow: glow ? `0 0 28px rgba(157,188,94,0.07)` : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, right }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "15px 20px",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <span style={{ color: T.text3, display: "flex" }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>
        {title}
      </span>
      <div style={{ marginLeft: "auto" }}>{right}</div>
    </div>
  );
}

function Mono({ children, style }) {
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize: 12,
        color: T.text2,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function Avatar({ name, size = 34 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 9,
        flexShrink: 0,
        background: T.greenDim,
        border: `1px solid ${T.greenBdr}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Syne',sans-serif",
        fontWeight: 700,
        fontSize: size * 0.38,
        color: T.green,
      }}
    >
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "52px 24px", color: T.text3 }}>
      <div style={{ fontSize: 30, marginBottom: 12, opacity: 0.25 }}>
        {icon}
      </div>
      <div style={{ fontSize: 14, color: T.text2, marginBottom: 5 }}>
        {title}
      </div>
      <div style={{ fontSize: 12 }}>{sub}</div>
    </div>
  );
}

function StatCard({ label, value, unit, icon, color = "green", delay = 0 }) {
  const c = {
    green: [T.green, T.greenDim],
    blue: [T.blue, T.blueDim],
    amber: [T.amber, T.amberDim],
  }[color];
  return (
    <Card
      style={{
        padding: "22px 24px",
        animation: `fadeUp 0.4s ${delay}s ease both`,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: c[1],
          color: c[0],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: T.text3,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          style={{
            fontSize: 30,
            fontWeight: 300,
            color: T.text,
            letterSpacing: "-1px",
            fontFamily: "'Syne',sans-serif",
          }}
        >
          {value}
        </span>
        {unit && <span style={{ fontSize: 13, color: T.text3 }}>{unit}</span>}
      </div>
    </Card>
  );
}

function Topbar({ title, sub, right }) {
  return (
    <div
      style={{
        background: T.bg2,
        borderBottom: `1px solid ${T.border}`,
        padding: "0 28px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: T.text,
          }}
        >
          {title}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>
            {sub}
          </div>
        )}
      </div>
      {right && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {right}
        </div>
      )}
    </div>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((type, msg, sub) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, msg, sub }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);
  return { toasts, add };
}
function ToastStack({ toasts }) {
  const cfg = {
    success: { bg: T.greenDim, bdr: T.greenBdr, c: T.green, ic: I.check },
    error: { bg: T.redDim, bdr: T.redBdr, c: T.red, ic: I.xmark },
    info: { bg: T.blueDim, bdr: T.blueBdr, c: T.blue, ic: I.info },
    warning: { bg: T.amberDim, bdr: T.amberBdr, c: T.amber, ic: I.alert },
  };
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 1000,
      }}
    >
      {toasts.map((t) => {
        const s = cfg[t.type] || cfg.info;
        return (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 10,
              minWidth: 270,
              maxWidth: 360,
              background: T.bg2,
              border: `1px solid ${s.bdr}`,
              boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
              animation: "slideDown 0.2s ease",
            }}
          >
            <span
              style={{
                color: s.c,
                display: "flex",
                marginTop: 1,
                flexShrink: 0,
              }}
            >
              {s.ic}
            </span>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: T.text,
                  marginBottom: t.sub ? 3 : 0,
                }}
              >
                {t.msg}
              </div>
              {t.sub && (
                <div style={{ fontSize: 11, color: T.text2 }}>{t.sub}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
const NAV = [
  {
    id: "admin",
    label: "Admin Dashboard",
    icon: I.grid,
    role: "Government",
    badge: null,
  },
  {
    id: "farmer",
    label: "Farmer Portal",
    icon: I.wheat,
    role: "Beneficiary",
    badge: null,
  },
  {
    id: "sim",
    label: "HW Simulator",
    icon: I.zap,
    role: "Engineering",
    badge: "DEV",
  },
  {
    id: "registry",
    label: "RSBSA Registry",
    icon: I.users,
    role: "Government",
    badge: null,
  },
  {
    id: "logs",
    label: "Audit Logs",
    icon: I.clock,
    role: "Government",
    badge: null,
  },
];

function Sidebar({ page, setPage, online }) {
  return (
    <aside
      style={{
        width: 244,
        minWidth: 244,
        background: T.bg2,
        borderRight: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "24px 14px",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 28,
          paddingLeft: 6,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: T.greenDim,
            border: `1px solid ${T.greenBdr}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: T.green,
          }}
        >
          {I.leaf}
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: T.text,
              letterSpacing: "-0.3px",
            }}
          >
            AgriAble
          </div>
          <div
            style={{ fontSize: 10, color: T.text3, letterSpacing: "0.04em" }}
          >
            Subsidy System v2.0
          </div>
        </div>
      </div>

      {[
        { role: "Beneficiary", label: "Farmer" },
        { role: "Government", label: "Government / Admin" },
        { role: "Engineering", label: "Development" },
      ].map(({ role, label }) => {
        const items = NAV.filter((n) => n.role === role);
        return (
          <div key={role} style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.text3,
                marginBottom: 6,
                paddingLeft: 6,
              }}
            >
              {label}
            </div>
            {items.map((n) => {
              const active = page === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setPage(n.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 10px",
                    borderRadius: 9,
                    border: "none",
                    background: active ? T.greenDim : "transparent",
                    color: active ? T.green : T.text2,
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    textAlign: "left",
                    width: "100%",
                    transition: "all 0.15s",
                    marginBottom: 2,
                  }}
                >
                  <span style={{ display: "flex", opacity: active ? 1 : 0.6 }}>
                    {n.icon}
                  </span>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {n.badge && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        padding: "2px 5px",
                        borderRadius: 4,
                        background: T.amberDim,
                        color: T.amber,
                        border: `1px solid ${T.amberBdr}`,
                      }}
                    >
                      {n.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}

      <div
        style={{
          marginTop: "auto",
          borderTop: `1px solid ${T.border}`,
          paddingTop: 14,
          paddingLeft: 6,
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className={online ? "dot-live" : "dot-off"} />
          <span style={{ fontSize: 11, color: T.text3 }}>
            {online ? "Server online" : "Server offline"}
          </span>
        </div>
      </div>
    </aside>
  );
}

// ── ADMIN PAGE ────────────────────────────────────────────────────────────────
function AdminPage({ toast }) {
  const [stats, setStats] = useState({
    total_kg_dispensed: "—",
    total_transactions: 0,
    total_registered_farmers: 0,
    active_machines: 0,
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([
        axios.get(`${API_URL}/api/dashboard-stats`),
        axios.get(`${API_URL}/api/recent-logs`),
      ]);
      setStats(s.data);
      setLogs(l.data.data || l.data); // Support both old and new response wrappers
      setLastRefresh(new Date());
    } catch {
      toast("error", "Failed to fetch data", "Check server connection");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 5000);
    return () => clearInterval(iv);
  }, [refresh]);

  const barData = (() => {
    const map = {};
    logs.forEach((l) => {
      const d = new Date(l.timestamp).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      });
      map[d] = (map[d] || 0) + l.changed_kg;
    });
    const entries = Object.entries(map).slice(-7);
    const max = Math.max(...entries.map((e) => e[1]), 1);
    return entries.map(([d, v]) => ({ d, v, pct: v / max }));
  })();

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Topbar
        title="Admin Dashboard"
        sub="National government view — real-time subsidy analytics & system status"
        right={
          <button
            onClick={refresh}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              borderRadius: 8,
              border: `1px solid ${T.border2}`,
              background: "transparent",
              color: T.text2,
              fontSize: 12,
            }}
          >
            {I.refresh}{" "}
            {lastRefresh
              ? `${lastRefresh.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`
              : "Refresh"}
          </button>
        }
      />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 14,
          }}
        >
          <StatCard
            label="Total Distributed"
            value={loading ? "…" : stats.total_kg_dispensed}
            unit="kg"
            icon={I.package}
            color="green"
            delay={0}
          />
          <StatCard
            label="Transactions"
            value={loading ? "…" : stats.total_transactions}
            icon={I.activity}
            color="blue"
            delay={0.05}
          />
          <StatCard
            label="Registered Farmers"
            value={loading ? "…" : stats.total_registered_farmers}
            icon={I.users}
            color="amber"
            delay={0.1}
          />
          <StatCard
            label="Active Machines"
            value={loading ? "…" : stats.active_machines}
            icon={I.zap}
            color="green"
            delay={0.15}
          />
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 14 }}
        >
          <Card style={{ padding: 0 }}>
            <SectionHeader
              icon={I.activity}
              title="Dispense Activity — Last 7 Days"
            />
            <div style={{ padding: "20px 24px" }}>
              {barData.length === 0 ? (
                <EmptyState
                  icon="📊"
                  title="No chart data yet"
                  sub="Transactions will populate this chart"
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 10,
                    height: 130,
                  }}
                >
                  {barData.map((b, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: T.text2,
                          fontFamily: "'IBM Plex Mono',monospace",
                        }}
                      >
                        {b.v.toFixed(1)}
                      </span>
                      <div
                        style={{
                          width: "100%",
                          background: T.greenDim,
                          border: `1px solid ${T.greenBdr}`,
                          borderRadius: 4,
                          height: Math.max(b.pct * 90, 6),
                          transformOrigin: "bottom",
                          animation: `barGrow 0.5s ${i * 0.07}s ease both`,
                        }}
                      />
                      <span style={{ fontSize: 10, color: T.text3 }}>
                        {b.d}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card style={{ padding: 0 }}>
            <SectionHeader icon={I.shield} title="System Status" />
            <div
              style={{
                padding: "14px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 11,
              }}
            >
              {[
                {
                  label: "Silo Dispenser #01",
                  status: "Operational",
                  color: "green",
                },
                {
                  label: "MOSIP Sandbox API",
                  status: "Connected",
                  color: "green",
                },
                {
                  label: "Supabase Database",
                  status: "Connected",
                  color: "green",
                },
                { label: "RSBSA Quota Sync", status: "Active", color: "green" },
                { label: "Biometric Auth", status: "Pending", color: "amber" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: 12, color: T.text2 }}>
                    {item.label}
                  </span>
                  <Badge color={item.color}>{item.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card style={{ padding: 0 }}>
          <SectionHeader icon={I.clock} title="Live Transaction Stream" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                {[
                  "Farmer",
                  "PhilSys UIN",
                  "Dispensed",
                  "Machine ID",
                  "Timestamp",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 20px",
                      textAlign: "left",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.09em",
                      textTransform: "uppercase",
                      color: T.text3,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: "center" }}>
                    <div className="spinner" style={{ margin: "0 auto" }} />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon="🌾"
                      title="No transactions yet"
                      sub="Use Farmer Portal or HW Simulator to create records"
                    />
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <tr
                    key={log.id}
                    style={{
                      borderTop: `1px solid ${T.border}`,
                      animation: `fadeIn 0.3s ${i * 0.04}s ease both`,
                    }}
                  >
                    <td style={{ padding: "13px 20px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Avatar name={log.farmer_name || log.users?.name} />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: T.text,
                          }}
                        >
                          {log.farmer_name || log.users?.name || "Unregistered"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <Mono>{log.target_id}</Mono>
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono',monospace",
                          fontSize: 13,
                          fontWeight: 500,
                          color: T.green,
                        }}
                      >
                        {log.changed_kg} kg
                      </span>
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <Badge color="gray">{log.source_id}</Badge>
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <div style={{ fontSize: 12, color: T.text2 }}>
                        {new Date(log.timestamp).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <Mono style={{ fontSize: 10, color: T.text3 }}>
                        {new Date(log.timestamp).toLocaleTimeString("en-PH", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </Mono>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

// ── FARMER PAGE ───────────────────────────────────────────────────────────────
function FarmerPage({ toast }) {
  const [step, setStep] = useState("idle");
  const [uid, setUid] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [dobInput, setDobInput] = useState("");

  const [farmerData, setFarmerData] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const [kg, setKg] = useState("");
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const [zeroed, setZeroed] = useState(false);
  const [tared, setTared] = useState(false);

  const reset = async () => {
    // If a session is hanging, cancel it
    if (sessionId && step !== "done" && step !== "idle") {
      try {
        await axios.post(`${API_URL}/api/cancel-session`, {
          session_id: sessionId,
        });
      } catch (e) {
        /* silent fail on reset */
      }
    }
    setStep("idle");
    setUid("");
    setNameInput("");
    setDobInput("");
    setFarmerData(null);
    setSessionId(null);
    setKg("");
    setResult(null);
    setErrMsg("");
    setZeroed(false);
    setTared(false);
  };

  const handleVerify = async () => {
    if (!uid.trim() || !nameInput.trim() || !dobInput.trim()) return;
    setStep("scanning");
    await new Promise((r) => setTimeout(r, 1200));
    try {
      const res = await axios.post(`${API_URL}/api/verify-farmer`, {
        uin: uid.trim(),
        name: nameInput.trim(),
        dob: dobInput.trim(),
        machine_id: MACHINE_ID, // Inform backend which machine is requesting
      });
      setFarmerData(res.data.user);
      setSessionId(res.data.session_id);
      setStep("verified");
      toast(
        "success",
        `Identity verified`,
        `Quota Available: ${res.data.user.remaining_quota_kg} kg`,
      );
    } catch (e) {
      setErrMsg(
        e?.response?.data?.detail || "ID not found or quota exhausted.",
      );
      setStep("error");
      toast(
        "error",
        "Verification failed",
        e?.response?.data?.detail || "System Error",
      );
    }
  };

  const handleZero = () => {
    setZeroed(true);
    toast("info", "Scale zeroed");
  };
  const handleTare = () => {
    setTared(true);
    setStep("dispensing");
    toast("info", "Scale tared");
  };

  const handleDispense = async () => {
    const dispensed = parseFloat(kg);
    if (!dispensed || dispensed <= 0) return;

    // Validate against quota
    if (dispensed > parseFloat(farmerData.remaining_quota_kg)) {
      toast(
        "error",
        "Exceeds Quota",
        `You only have ${farmerData.remaining_quota_kg} kg remaining.`,
      );
      return;
    }

    setStep("loading");
    try {
      const res = await axios.post(`${API_URL}/api/log-transaction`, {
        session_id: sessionId,
        target_id: uid.trim(),
        source_id: MACHINE_ID,
        changed_kg: dispensed,
      });
      setResult({ dispensed, id: res.data.id, timestamp: new Date() });
      setStep("done");
      toast("success", `${dispensed} kg dispensed`, `Quota deducted.`);
    } catch (e) {
      setErrMsg(e?.response?.data?.detail || "Dispense failed.");
      setStep("error");
      toast("error", "Dispense failed");
    }
  };

  const STEP_ORDER = [
    "idle",
    "scanning",
    "verified",
    "weighing",
    "dispensing",
    "loading",
    "done",
    "error",
  ];
  const stepIdx = STEP_ORDER.indexOf(step);
  const PROGRESS = [
    { key: "idle", label: "Arrival" },
    { key: "verified", label: "Verified" },
    { key: "weighing", label: "Calibration" },
    { key: "dispensing", label: "Dispensing" },
    { key: "done", label: "Complete" },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Topbar
        title="Farmer Portal"
        sub="Guided dispensing workflow enforcing Quota limits"
        right={
          <button
            onClick={reset}
            style={{
              background: "none",
              border: `1px solid ${T.redBdr}`,
              color: T.red,
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Cancel Session
          </button>
        }
      />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 32,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 660 }}>
          {/* Stepper */}
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 32 }}
          >
            {PROGRESS.map((s, i, arr) => {
              const sIdx = STEP_ORDER.indexOf(s.key);
              const done = stepIdx > sIdx;
              const active =
                step === s.key ||
                (step === "scanning" && s.key === "idle") ||
                (step === "loading" && s.key === "dispensing");
              return (
                <div
                  key={s.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flex: i < arr.length - 1 ? 1 : 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: `2px solid ${done || active ? T.green : T.border2}`,
                        background: done || active ? T.greenDim : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: done || active ? T.green : T.text3,
                        fontSize: 11,
                        fontWeight: 700,
                        transition: "all 0.3s",
                      }}
                    >
                      {done ? I.check : i + 1}
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        color: active || done ? T.text2 : T.text3,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 1,
                        margin: "0 6px",
                        marginBottom: 18,
                        background: done ? T.green : T.border,
                        transition: "background 0.3s",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── IDLE / SCANNING ── */}
          {(step === "idle" || step === "scanning") && (
            <Card style={{ padding: 32, animation: "scaleIn 0.3s ease" }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    margin: "0 auto 16px",
                    background: T.greenDim,
                    border: `1px solid ${T.greenBdr}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: T.green,
                  }}
                >
                  {I.scan}
                </div>
                <div
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontWeight: 700,
                    fontSize: 20,
                    color: T.text,
                    marginBottom: 8,
                  }}
                >
                  Scan your PhilSys ID
                </div>
              </div>
              <input
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="PhilSys UIN"
                disabled={step === "scanning"}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  marginBottom: 14,
                  background: T.bg3,
                  border: `1px solid ${T.border2}`,
                  borderRadius: 9,
                  color: T.text,
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 14,
                }}
              />
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Full name (as on ID)"
                disabled={step === "scanning"}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  marginBottom: 10,
                  background: T.bg3,
                  border: `1px solid ${T.border2}`,
                  borderRadius: 9,
                  color: T.text,
                  fontSize: 14,
                }}
              />
              <input
                value={dobInput}
                onChange={(e) => setDobInput(e.target.value)}
                placeholder="Date of birth — YYYY/MM/DD"
                disabled={step === "scanning"}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  marginBottom: 14,
                  background: T.bg3,
                  border: `1px solid ${T.border2}`,
                  borderRadius: 9,
                  color: T.text,
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 14,
                }}
              />
              <button
                onClick={handleVerify}
                disabled={
                  step === "scanning" ||
                  !uid.trim() ||
                  !nameInput.trim() ||
                  !dobInput.trim()
                }
                style={{
                  width: "100%",
                  padding: 13,
                  borderRadius: 9,
                  border: "none",
                  background:
                    uid.trim() &&
                    nameInput.trim() &&
                    dobInput.trim() &&
                    step !== "scanning"
                      ? T.green
                      : T.bg4,
                  color:
                    uid.trim() &&
                    nameInput.trim() &&
                    dobInput.trim() &&
                    step !== "scanning"
                      ? "#0b1a04"
                      : T.text3,
                  fontSize: 14,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                {step === "scanning" ? (
                  <>
                    <div className="spinner" />
                    Authenticating via MOSIP…
                  </>
                ) : (
                  <>{I.zap} Verify Identity</>
                )}
              </button>
            </Card>
          )}

          {/* ── VERIFIED ── */}
          {step === "verified" && farmerData && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                animation: "scaleIn 0.3s ease",
              }}
            >
              <div
                style={{
                  padding: "14px 18px",
                  background: T.greenDim,
                  border: `1px solid ${T.greenBdr}`,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: T.green,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0b1a04",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: 100,
                      strokeDashoffset: 0,
                      animation: "checkDraw 0.5s ease",
                    }}
                  >
                    <path d="M20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: T.green }}
                  >
                    MOSIP Authentication Successful
                  </div>
                  <div style={{ fontSize: 11, color: T.text2, marginTop: 2 }}>
                    Secure Session Initiated
                  </div>
                </div>
              </div>
              <Card style={{ padding: 24 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 20,
                    paddingBottom: 20,
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <Avatar name={farmerData.name} size={52} />
                  <div>
                    <div
                      style={{
                        fontFamily: "'Syne',sans-serif",
                        fontWeight: 700,
                        fontSize: 20,
                        color: T.text,
                      }}
                    >
                      {farmerData.name}
                    </div>
                  </div>
                  <Badge
                    color="green"
                    icon={I.shield}
                    style={{ marginLeft: "auto" }}
                  >
                    RSBSA Verified
                  </Badge>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  {[
                    { label: "PhilSys UIN", value: uid, mono: true },
                    {
                      label: "Total Allocation",
                      value: `${farmerData.total_quota_kg} kg`,
                    },
                    {
                      label: "Remaining Quota",
                      value: `${farmerData.remaining_quota_kg} kg`,
                      hi: true,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        background: T.bg3,
                        borderRadius: 9,
                        padding: "12px 14px",
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: T.text3,
                          marginBottom: 5,
                        }}
                      >
                        {item.label}
                      </div>
                      {item.mono ? (
                        <Mono style={{ fontSize: 13, color: T.text }}>
                          {item.value}
                        </Mono>
                      ) : (
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: item.hi ? T.amber : T.text,
                          }}
                        >
                          {item.value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStep("weighing")}
                  style={{
                    width: "100%",
                    padding: 13,
                    borderRadius: 9,
                    border: "none",
                    background: T.green,
                    color: "#0b1a04",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {I.weight} Proceed to Scale Calibration
                </button>
              </Card>
            </div>
          )}

          {/* ── WEIGHING ── */}
          {step === "weighing" && (
            <Card style={{ padding: 28, animation: "scaleIn 0.3s ease" }}>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: T.text,
                  marginBottom: 24,
                }}
              >
                Calibrate the Weighing Scale
              </div>
              {[
                {
                  num: 1,
                  done: zeroed,
                  title: "Zero the Scale",
                  sub: "Ensure scale platform is completely empty",
                  action: "Press Zero Button",
                  fn: handleZero,
                },
                {
                  num: 2,
                  done: tared,
                  title: "Place container & Tare",
                  sub: "Set container on scale, then tare to exclude its weight",
                  action: "Press Tare Button",
                  fn: handleTare,
                  locked: !zeroed,
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px 18px",
                    borderRadius: 10,
                    marginBottom: 12,
                    background: s.done ? T.greenDim : T.bg3,
                    border: `1px solid ${s.done ? T.greenBdr : T.border}`,
                    opacity: s.locked ? 0.45 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: s.done ? 0 : 12,
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: `2px solid ${s.done ? T.green : T.border2}`,
                        background: s.done ? T.greenDim : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: s.done ? T.green : T.text3,
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {s.done ? I.check : s.num}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: s.done ? T.green : T.text,
                        }}
                      >
                        {s.title}
                      </div>
                      <div
                        style={{ fontSize: 11, color: T.text3, marginTop: 2 }}
                      >
                        {s.sub}
                      </div>
                    </div>
                  </div>
                  {!s.done && !s.locked && (
                    <button
                      onClick={s.fn}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 8,
                        border: `1px solid ${T.border2}`,
                        background: T.bg4,
                        color: T.text,
                        fontSize: 13,
                      }}
                    >
                      {s.action}
                    </button>
                  )}
                </div>
              ))}
            </Card>
          )}

          {/* ── DISPENSING ── */}
          {(step === "dispensing" || step === "loading") && farmerData && (
            <Card style={{ padding: 28, animation: "scaleIn 0.3s ease" }}>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: T.text,
                  marginBottom: 20,
                }}
              >
                Ready to Dispense
              </div>
              <div
                style={{
                  padding: "14px 16px",
                  background: T.amberDim,
                  border: `1px solid ${T.amberBdr}`,
                  borderRadius: 9,
                  marginBottom: 18,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12, color: T.amber }}>
                  Max Allowable Quota:
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.amber }}>
                  {farmerData.remaining_quota_kg} kg
                </span>
              </div>
              <input
                type="number"
                value={kg}
                onChange={(e) => setKg(e.target.value)}
                placeholder="0.0"
                min="0.1"
                step="0.5"
                max={farmerData.remaining_quota_kg}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 9,
                  background: T.bg3,
                  border: `1px solid ${T.border2}`,
                  color: T.text,
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 22,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              />
              <button
                onClick={handleDispense}
                disabled={!kg || parseFloat(kg) <= 0 || step === "loading"}
                style={{
                  width: "100%",
                  padding: 13,
                  borderRadius: 9,
                  border: "none",
                  background: kg && parseFloat(kg) > 0 ? T.green : T.bg4,
                  color: kg && parseFloat(kg) > 0 ? "#0b1a04" : T.text3,
                  fontSize: 14,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {step === "loading" ? (
                  <>
                    <div
                      className="spinner"
                      style={{ borderTopColor: "#0b1a04" }}
                    />{" "}
                    Dispensing...
                  </>
                ) : (
                  <>{I.zap} Activate Silo Dispenser</>
                )}
              </button>
            </Card>
          )}

          {/* ── DONE / ERROR ── */}
          {/* ... keeping the done & error screens mostly identical to original, just updating UI text where needed ... */}
          {step === "done" && result && (
            <Card
              style={{
                padding: 36,
                textAlign: "center",
                animation: "scaleIn 0.35s ease",
              }}
              glow
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  margin: "0 auto 20px",
                  background: T.greenDim,
                  border: `2px solid ${T.green}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: T.green,
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17 4 12" />
                </svg>
              </div>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 800,
                  fontSize: 24,
                  color: T.green,
                  marginBottom: 8,
                }}
              >
                Dispense Complete!
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: T.text2,
                  marginBottom: 28,
                  lineHeight: 1.6,
                }}
              >
                Quota updated and transaction recorded to tamper-proof cloud
                database.
              </div>
              <button
                onClick={reset}
                style={{
                  width: "100%",
                  padding: 13,
                  borderRadius: 9,
                  border: `1px solid ${T.border2}`,
                  background: "transparent",
                  color: T.text2,
                  fontSize: 14,
                }}
              >
                Start New Transaction
              </button>
            </Card>
          )}
          {step === "error" && (
            <Card
              style={{
                padding: 32,
                textAlign: "center",
                border: `1px solid ${T.redBdr}`,
              }}
            >
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 700,
                  fontSize: 20,
                  color: T.red,
                  marginBottom: 8,
                }}
              >
                Process Failed
              </div>
              <div style={{ fontSize: 13, color: T.text2, marginBottom: 24 }}>
                {errMsg}
              </div>
              <button
                onClick={reset}
                style={{
                  padding: "11px 28px",
                  borderRadius: 9,
                  border: `1px solid ${T.border2}`,
                  background: T.bg3,
                  color: T.text,
                  fontSize: 14,
                }}
              >
                Try Again
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── HW SIMULATOR PAGE ─────────────────────────────────────────────────────────
function SimPage({ toast }) {
  const [simId, setSimId] = useState("5408602380");
  const [simName, setSimName] = useState("Yuki Nakashima");
  const [simDob, setSimDob] = useState("1997/09/12");
  const [simKg, setSimKg] = useState(5);
  const [verifyState, setVerifyState] = useState("idle");
  const [verifyData, setVerifyData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [dispenseState, setDispState] = useState("idle");
  const [scalePct, setScalePct] = useState(0);
  const [log, setLog] = useState([]);

  const addLog = (msg, type = "system") =>
    setLog((p) => [{ msg, type, ts: new Date() }, ...p].slice(0, 30));

  const handleScan = async () => {
    setVerifyState("loading");
    setVerifyData(null);
    setSessionId(null);
    addLog(`[UART] Scanner → ESP32: UIN="${simId}"`, "system");
    try {
      const res = await axios.post(`${API_URL}/api/verify-farmer`, {
        uin: simId,
        name: simName,
        dob: simDob,
        machine_id: SIMULATOR_ID,
      });
      setVerifyData(res.data.user);
      setSessionId(res.data.session_id);
      setVerifyState("success");
      addLog(
        `[MOSIP] KYC confirmed. Session ID: ${res.data.session_id.substring(0, 8)}...`,
        "success",
      );
      addLog(
        `[DB] Quota Check: ${res.data.user.remaining_quota_kg} kg left`,
        "success",
      );
      toast("success", `MOSIP verified`, `Session Started`);
    } catch (e) {
      setVerifyState("error");
      addLog(`[ERROR] ${e.response?.data?.detail || "Auth Failed"}`, "error");
      toast("error", "Verification failed");
    }
  };

  const handleDispense = async () => {
    if (!sessionId) {
      toast("error", "No Active Session");
      return;
    }
    setDispState("loading");
    setScalePct(0);
    const ticks = [0.3, 0.55, 0.78, 1.0];
    for (const pct of ticks) {
      await new Promise((r) => setTimeout(r, 500));
      setScalePct(pct);
    }
    try {
      await axios.post(`${API_URL}/api/log-transaction`, {
        session_id: sessionId,
        target_id: simId,
        source_id: SIMULATOR_ID,
        changed_kg: parseFloat(simKg),
      });
      setDispState("success");
      addLog(
        `[WiFi] POST /api/log-transaction → Success. Quota deducted.`,
        "success",
      );
      toast("success", `${simKg} kg dispensed`);
    } catch {
      setDispState("error");
      addLog(`[ERROR] Transaction log failed`, "error");
    } finally {
      setTimeout(() => {
        setDispState("idle");
        setScalePct(0);
      }, 3500);
    }
  };

  const logColor = { success: T.green, error: T.red, system: T.blue };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Topbar
        title="Hardware Simulator"
        right={<Badge color="amber">{I.zap} DEV MODE</Badge>}
      />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 24,
          display: "grid",
          gridTemplateColumns: "350px 1fr",
          gap: 18,
          alignContent: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Scan Panel */}
          <Card style={{ padding: "18px 20px" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: T.text3,
                marginBottom: 8,
              }}
            >
              1. SIMULATE QR SCAN
            </div>
            <input
              value={simId}
              onChange={(e) => setSimId(e.target.value)}
              placeholder="UIN"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: 10,
                background: T.bg3,
                border: `1px solid ${T.border2}`,
                borderRadius: 8,
                color: T.text,
                fontSize: 13,
              }}
            />
            <input
              value={simName}
              onChange={(e) => setSimName(e.target.value)}
              placeholder="Name"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: 10,
                background: T.bg3,
                border: `1px solid ${T.border2}`,
                borderRadius: 8,
                color: T.text,
                fontSize: 13,
              }}
            />
            <input
              value={simDob}
              onChange={(e) => setSimDob(e.target.value)}
              placeholder="DOB"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: 10,
                background: T.bg3,
                border: `1px solid ${T.border2}`,
                borderRadius: 8,
                color: T.text,
                fontSize: 13,
              }}
            />
            <button
              onClick={handleScan}
              disabled={verifyState === "loading"}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: 8,
                border: "none",
                background: verifyState === "loading" ? T.bg4 : T.green,
                color: verifyState === "loading" ? T.text3 : "#0b1a04",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {verifyState === "loading" ? "Querying..." : "Trigger Scan"}
            </button>
          </Card>

          {/* Dispense Panel */}
          <Card style={{ padding: "18px 20px", opacity: sessionId ? 1 : 0.5 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: T.text3,
                marginBottom: 8,
              }}
            >
              2. SIMULATE DISPENSE (Requires Active Session)
            </div>
            <input
              type="number"
              value={simKg}
              onChange={(e) => setSimKg(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: 12,
                background: T.bg3,
                border: `1px solid ${T.border2}`,
                borderRadius: 8,
                color: T.text,
                fontSize: 13,
              }}
            />
            <button
              onClick={handleDispense}
              disabled={!sessionId || dispenseState === "loading"}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: 8,
                border: `1px solid ${T.blueBdr}`,
                background: T.blueDim,
                color: T.blue,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Simulate Scale & Motor
            </button>
          </Card>
        </div>

        {/* Console */}
        <Card style={{ padding: 0, display: "flex", flexDirection: "column" }}>
          <SectionHeader
            icon={I.activity}
            title="Serial Logs"
            right={
              <button
                onClick={() => setLog([])}
                style={{
                  background: "none",
                  border: "none",
                  color: T.text3,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            }
          />
          <div
            style={{
              flex: 1,
              padding: "14px 18px",
              fontFamily: "'IBM Plex Mono',monospace",
              maxHeight: 560,
              overflowY: "auto",
            }}
          >
            {log.map((entry, i) => (
              <div
                key={i}
                style={{ marginBottom: 7, fontSize: 12, lineHeight: 1.5 }}
              >
                <span style={{ color: T.text3 }}>
                  {entry.ts.toLocaleTimeString("en-PH", { hour12: false })}{" "}
                </span>
                <span style={{ color: logColor[entry.type] || T.text2 }}>
                  {entry.msg}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── REGISTRY PAGE (ADMIN CRUD) ────────────────────────────────────────────────
function RegistryPage({ toast }) {
  const [selected, setSelected] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ uin: "", name: "", quota: 10 });

  const fetchFarmers = useCallback(() => {
    setLoading(true);
    axios
      .get(`${API_URL}/api/admin/farmers`)
      .then((r) => setFarmers(r.data.data))
      .catch(() => toast("error", "Failed to load registry"))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  const handleAdd = async () => {
    try {
      await axios.post(`${API_URL}/api/admin/farmers`, {
        national_id: addForm.uin,
        name: addForm.name,
        quota_kg: addForm.quota,
      });
      toast("success", "Farmer Registered");
      setShowAdd(false);
      setAddForm({ uin: "", name: "", quota: 10 });
      fetchFarmers();
    } catch (e) {
      toast("error", "Failed to add", e.response?.data?.detail);
    }
  };

  const handleDelete = async (uin) => {
    if (!window.confirm("Delete this farmer and their history?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/farmers/${uin}`);
      toast("success", "Farmer Deleted");
      setSelected(null);
      fetchFarmers();
    } catch (e) {
      toast("error", "Failed to delete");
    }
  };

  const handleUpdateQuota = async (uin) => {
    const newQuota = prompt("Enter new maximum Quota in kg:");
    if (!newQuota || isNaN(newQuota)) return;
    try {
      await axios.patch(`${API_URL}/api/admin/farmers/${uin}/quota`, {
        new_quota_kg: parseFloat(newQuota),
        reset_remaining: true, // Instantly tops them up
      });
      toast("success", "Quota Updated & Reset");
      setSelected(null);
      fetchFarmers();
    } catch (e) {
      toast("error", "Failed to update quota");
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Topbar
        title="RSBSA Registry Manager"
        sub="Add farmers, modify quotas, and oversee beneficiaries"
        right={
          <button
            onClick={() => setShowAdd(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              background: T.green,
              color: "#0b1a04",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
            }}
          >
            {I.plus} Register Farmer
          </button>
        }
      />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 24,
          display: "grid",
          gridTemplateColumns: selected ? "1fr 340px" : "1fr",
          gap: 18,
          alignContent: "start",
        }}
      >
        <Card style={{ padding: 0 }}>
          <SectionHeader
            icon={I.users}
            title="Registered Beneficiaries"
            right={<Badge color="gray">{farmers.length} entries</Badge>}
          />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                {["Farmer", "PhilSys UIN", "Total Quota", "Remaining"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 20px",
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.09em",
                        textTransform: "uppercase",
                        color: T.text3,
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {farmers.map((f, i) => (
                <tr
                  key={f.national_id}
                  onClick={() =>
                    setSelected(
                      selected?.national_id === f.national_id ? null : f,
                    )
                  }
                  style={{
                    borderTop: `1px solid ${T.border}`,
                    cursor: "pointer",
                    background:
                      selected?.national_id === f.national_id
                        ? T.bg3
                        : "transparent",
                    animation: `fadeUp 0.3s ${i * 0.06}s ease both`,
                  }}
                >
                  <td style={{ padding: "14px 20px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <Avatar name={f.name} />
                      <span
                        style={{ fontSize: 13, fontWeight: 500, color: T.text }}
                      >
                        {f.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <Mono>{f.national_id}</Mono>
                  </td>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontSize: 13,
                      color: T.text2,
                    }}
                  >
                    {f.total_quota_kg} kg
                  </td>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: f.remaining_quota_kg > 0 ? T.green : T.red,
                    }}
                  >
                    {f.remaining_quota_kg} kg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {selected && (
          <div style={{ animation: "slideDown 0.2s ease" }}>
            <Card style={{ padding: 0, position: "sticky", top: 0 }}>
              <div
                style={{
                  padding: "15px 18px",
                  borderBottom: `1px solid ${T.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>
                  Farmer Profile
                </span>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: T.text3,
                    cursor: "pointer",
                    display: "flex",
                  }}
                >
                  {I.xmark}
                </button>
              </div>
              <div style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 20,
                    paddingBottom: 20,
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <Avatar name={selected.name} size={48} />
                  <div
                    style={{
                      fontFamily: "'Syne',sans-serif",
                      fontWeight: 700,
                      fontSize: 17,
                      color: T.text,
                    }}
                  >
                    {selected.name}
                  </div>
                </div>
                {[
                  ["PhilSys UIN", selected.national_id, true],
                  ["Total Allowance", `${selected.total_quota_kg} kg`],
                  ["Remaining", `${selected.remaining_quota_kg} kg`],
                ].map(([k, v, mono]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: `1px solid ${T.border}`,
                    }}
                  >
                    <span style={{ fontSize: 12, color: T.text3 }}>{k}</span>
                    {mono ? (
                      <Mono style={{ color: T.text, fontSize: 12 }}>{v}</Mono>
                    ) : (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: k === "Remaining" ? T.amber : T.text,
                        }}
                      >
                        {v}
                      </span>
                    )}
                  </div>
                ))}

                <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
                  <button
                    onClick={() => handleUpdateQuota(selected.national_id)}
                    style={{
                      flex: 1,
                      padding: "9px",
                      borderRadius: 8,
                      background: T.bg3,
                      border: `1px solid ${T.border2}`,
                      color: T.text,
                      fontSize: 12,
                      display: "flex",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    {I.edit} Edit Quota
                  </button>
                  <button
                    onClick={() => handleDelete(selected.national_id)}
                    style={{
                      flex: 1,
                      padding: "9px",
                      borderRadius: 8,
                      background: T.redDim,
                      border: `1px solid ${T.redBdr}`,
                      color: T.red,
                      fontSize: 12,
                      display: "flex",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    {I.trash} Delete
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay">
          <Card
            style={{ padding: 24, width: 360, animation: "scaleIn 0.2s ease" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>
                Register New Farmer
              </div>
              <button
                onClick={() => setShowAdd(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: T.text3,
                  cursor: "pointer",
                }}
              >
                {I.xmark}
              </button>
            </div>
            <input
              value={addForm.uin}
              onChange={(e) => setAddForm({ ...addForm, uin: e.target.value })}
              placeholder="PhilSys UIN"
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: 12,
                background: T.bg3,
                border: `1px solid ${T.border2}`,
                borderRadius: 8,
                color: T.text,
                fontSize: 13,
              }}
            />
            <input
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="Full Name"
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: 12,
                background: T.bg3,
                border: `1px solid ${T.border2}`,
                borderRadius: 8,
                color: T.text,
                fontSize: 13,
              }}
            />
            <input
              type="number"
              value={addForm.quota}
              onChange={(e) =>
                setAddForm({ ...addForm, quota: parseFloat(e.target.value) })
              }
              placeholder="Initial Quota (kg)"
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: 20,
                background: T.bg3,
                border: `1px solid ${T.border2}`,
                borderRadius: 8,
                color: T.text,
                fontSize: 13,
              }}
            />

            <button
              onClick={handleAdd}
              disabled={!addForm.uin || !addForm.name}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                background: T.green,
                color: "#0b1a04",
                fontSize: 13,
                fontWeight: 600,
                border: "none",
              }}
            >
              Confirm Registration
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── AUDIT LOG PAGE ────────────────────────────────────────────────────────────
// (Kept completely functional and identical, no schema changes affect rendering here other than the metric counts updated above in AdminPage)
function AuditPage({ toast }) {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/api/recent-logs`)
      .then((r) => setLogs(r.data.data || r.data))
      .catch(() => toast("error", "Failed to load logs"));
  }, [toast]);

  const filtered = logs.filter(
    (l) =>
      !filter ||
      l.target_id?.includes(filter) ||
      (l.farmer_name || l.users?.name)
        ?.toLowerCase()
        .includes(filter.toLowerCase()),
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Topbar title="Audit Logs" sub="Tamper-proof transaction traceability" />
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        <Card style={{ padding: 0 }}>
          <div
            style={{
              padding: "13px 20px",
              borderBottom: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ color: T.text3, display: "flex" }}>{I.filter}</span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name or PhilSys UIN…"
              style={{
                background: "none",
                border: "none",
                color: T.text,
                fontSize: 13,
                flex: 1,
              }}
            />
            <Badge color="gray">{filtered.length} records</Badge>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                {[
                  "#",
                  "Farmer",
                  "PhilSys UIN",
                  "Dispensed",
                  "Machine ID",
                  "Timestamp",
                  "Session ID",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 18px",
                      textAlign: "left",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.09em",
                      textTransform: "uppercase",
                      color: T.text3,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr key={log.id} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td
                    style={{
                      padding: "12px 18px",
                      color: T.text3,
                      fontSize: 11,
                    }}
                  >
                    {i + 1}
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Avatar
                        name={log.farmer_name || log.users?.name}
                        size={28}
                      />
                      <span style={{ fontSize: 13, color: T.text }}>
                        {log.farmer_name || log.users?.name || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <Mono>{log.target_id}</Mono>
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono',monospace",
                        fontSize: 13,
                        fontWeight: 500,
                        color: T.green,
                      }}
                    >
                      {log.changed_kg} kg
                    </span>
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <Badge color="gray">{log.source_id}</Badge>
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <div style={{ fontSize: 12, color: T.text2 }}>
                      {new Date(log.timestamp).toLocaleDateString("en-PH")}
                    </div>
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <Mono style={{ fontSize: 10, color: T.text3 }}>
                      {log.session_id?.slice(0, 8)}…
                    </Mono>
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

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("admin");
  const [online, setOnline] = useState(true);
  const { toasts, add: toast } = useToast();
  const styleRef = useRef(null);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    styleRef.current = el;
    return () => {
      if (styleRef.current) document.head.removeChild(styleRef.current);
    };
  }, []);

  const PAGES = {
    admin: <AdminPage toast={toast} />,
    farmer: <FarmerPage toast={toast} />,
    sim: <SimPage toast={toast} />,
    registry: <RegistryPage toast={toast} />,
    logs: <AuditPage toast={toast} />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg }}>
      <Sidebar page={page} setPage={setPage} online={online} />
      {PAGES[page]}
      <ToastStack toasts={toasts} />
    </div>
  );
}
