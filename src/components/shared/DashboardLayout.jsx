import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { buildSearchIndex } from '../../data.jsx';
import TabBar from './TabBar.jsx';
import XPPopup from './XPPopup.jsx';
import BadgeToast from './BadgeToast.jsx';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showXP, xpA, sB, nB } = useApp();
  const [srchQ, setSrchQ] = useState("");
  const [srchR, setSrchR] = useState([]);
  const [srchOpen, setSrchOpen] = useState(false);

  // Current tab derived from URL path
  const tabFromPath = () => {
    const p = location.pathname;
    if (p === "/" || p === "") return "home";
    if (p.startsWith("/learn")) return "learn";
    if (p.startsWith("/practice")) return "practice";
    if (p.startsWith("/croatia")) return "croatia";
    if (p.startsWith("/profile")) return "profile";
    return "home";
  };

  const doSearch = (q) => {
    if (!q.trim()) { setSrchR([]); return; }
    const idx = buildSearchIndex();
    const lq = q.toLowerCase();
    setSrchR(idx.filter(i => (i.hr && i.hr.toLowerCase().includes(lq)) || (i.en && i.en.toLowerCase().includes(lq))).slice(0, 15));
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <XPPopup showXP={showXP} xpA={xpA} />
      <BadgeToast show={sB} badge={nB} />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px", paddingBottom: 80, position: "relative", zIndex: 1 }}>
        <Outlet />
        <div style={{ position: "relative", marginBottom: 16, marginTop: 16 }}>
          <input
            type="text"
            value={srchQ}
            onChange={e => { setSrchQ(e.target.value); doSearch(e.target.value); setSrchOpen(true); }}
            onFocus={() => { if (srchQ) setSrchOpen(true); }}
            placeholder="🔍 Search words, phrases, screens..."
            style={{ width: "100%", padding: "12px 16px", fontSize: 15, borderRadius: 14, border: "2px solid rgba(14,116,144,.15)", background: "rgba(255,255,255,.7)" }} />
          {srchOpen && srchR.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,.12)", zIndex: 100, maxHeight: 300, overflow: "auto", marginTop: 4, border: "1px solid #e7e5e4" }}>
              {srchR.map((r, i) => (
                <div key={i} style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onClick={() => { setSrchOpen(false); setSrchQ(""); navigate("/" + r.go); }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#164e63" }}>{r.hr}</div>
                    <div style={{ fontSize: 12, color: "#78716c" }}>{r.en}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: "2px 8px", background: r.type === "vocab" ? "#dbeafe" : r.type === "screen" ? "#dcfce7" : "#fef3c7", borderRadius: 10 }}>{r.type}</span>
                </div>
              ))}
              <div style={{ padding: "8px", textAlign: "center", fontSize: 12, color: "#78716c", cursor: "pointer" }} onClick={() => setSrchOpen(false)}>Close</div>
            </div>
          )}
        </div>
      </div>
      <TabBar tab={tabFromPath()} setTab={t => navigate(t === "home" ? "/" : `/${t}`)} setScr={s => navigate(`/${s}`)} />
    </div>
  );
}
