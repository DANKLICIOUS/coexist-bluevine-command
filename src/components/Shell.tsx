import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Wordmark } from "./Logo";
import { useStore } from "../lib/store";
import { clock, timeOnly } from "../lib/format";
import type { ViewId } from "../lib/types";

const NAV: { to: string; id: ViewId; label: string; key: string }[] = [
  { to: "/", id: "deck", label: "Command deck", key: "1" },
  { to: "/treasury", id: "treasury", label: "Treasury", key: "2" },
  { to: "/rails", id: "rails", label: "Payment rails", key: "3" },
  { to: "/credit", id: "credit", label: "Credit book", key: "4" },
  { to: "/risk", id: "risk", label: "Risk sentinel", key: "5" },
  { to: "/nodes", id: "nodes", label: "Remote nodes", key: "6" },
  { to: "/incidents", id: "incidents", label: "Incident bridge", key: "7" },
  { to: "/roster", id: "roster", label: "Roster", key: "8" },
  { to: "/terminal", id: "terminal", label: "Terminal", key: "9" },
  { to: "/audit", id: "audit", label: "Audit", key: "0" },
];

const VIEW_PATH: Record<ViewId, string> = {
  deck: "/",
  treasury: "/treasury",
  rails: "/rails",
  credit: "/credit",
  risk: "/risk",
  nodes: "/nodes",
  incidents: "/incidents",
  roster: "/roster",
  terminal: "/terminal",
  audit: "/audit",
};

export function Shell({ children }: { children: ReactNode }) {
  const store = useStore();
  const nav = useNavigate();
  const loc = useLocation();
  const [cmd, setCmd] = useState("");
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const palRef = useRef<HTMLInputElement>(null);

  const openAlerts = store.alerts.filter((a) => !a.acked).length;
  const openInc = store.incidents.filter((i) => i.status !== "resolved").length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
        return;
      }
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setPalette(false);
      if (meta && e.key >= "0" && e.key <= "9") {
        const item = NAV.find((n) => n.key === e.key);
        if (item) nav(item.to);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nav]);

  useEffect(() => {
    if (palette) palRef.current?.focus();
  }, [palette]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const commands = [
      "status",
      "liquidity",
      "nodes list",
      "rails list",
      "alerts list",
      "focus rails",
      "focus nodes",
      "help",
    ];
    if (!q) {
      return {
        views: NAV,
        cmds: commands,
      };
    }
    return {
      views: NAV.filter((n) => n.label.toLowerCase().includes(q) || n.id.includes(q)),
      cmds: commands.filter((c) => c.includes(q)),
    };
  }, [query]);

  function go(view: ViewId) {
    nav(VIEW_PATH[view]);
  }

  function submitCommand(raw: string) {
    const text = raw.trim();
    if (!text) return;
    let jumped = false;
    store.run(text, (view) => {
      jumped = true;
      go(view);
    });
    setCmd("");
    setQuery("");
    setPalette(false);
    if (!jumped) nav("/terminal");
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "228px 1fr",
        gridTemplateRows: "64px 1fr 52px",
        minHeight: "100vh",
        position: "relative",
        zIndex: 1,
      }}
    >
      <aside
        className="panel"
        style={{
          gridRow: "1 / span 3",
          borderRadius: 0,
          borderLeft: 0,
          borderTop: 0,
          borderBottom: 0,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <Wordmark />
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.to === "/"}
              style={({ isActive }) => ({
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "9px 10px",
                borderRadius: 10,
                color: isActive ? "var(--ink)" : "var(--muted)",
                background: isActive ? "rgba(61,139,255,0.14)" : "transparent",
                border: `1px solid ${isActive ? "var(--line-strong)" : "transparent"}`,
                fontSize: 13,
              })}
            >
              <span>{item.label}</span>
              <span className="mono dim" style={{ fontSize: 10 }}>
                ⌘{item.key}
              </span>
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: "auto" }} className="panel" >
          <div style={{ padding: 12 }}>
            <div className="kicker">duty desk</div>
            <div style={{ marginTop: 8, fontWeight: 600 }}>{store.operator?.name}</div>
            <div className="mono dim" style={{ fontSize: 11, marginTop: 4 }}>
              {store.operator?.id} · {store.operator?.seat}
            </div>
            <button className="btn ghost" style={{ marginTop: 12, width: "100%" }} onClick={store.logout}>
              drop uplink
            </button>
          </div>
        </div>
      </aside>

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 22px",
          borderBottom: "1px solid var(--line)",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span className="pill ok">
            <span className="pulse" /> live
          </span>
          <span className="kicker">{loc.pathname === "/" ? "command deck" : loc.pathname.slice(1)}</span>
          <span className="mono dim" style={{ fontSize: 12 }}>
            FDIC program · ${store.snapshot.fdicCoverage / 1_000_000}M
          </span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span className="pill watch">{openAlerts} alerts</span>
          <span className="pill info">{openInc} incidents</span>
          <span className="mono" style={{ fontSize: 13 }}>
            {timeOnly(store.now)}
          </span>
          <span className="mono dim" style={{ fontSize: 12 }}>
            {clock(store.now)}
          </span>
        </div>
      </header>

      <main className="scroll" style={{ padding: 22 }}>
        {children}
      </main>

      <footer
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 22px",
          borderTop: "1px solid var(--line)",
          background: "rgba(4,8,15,0.7)",
        }}
      >
        <span className="kicker" style={{ color: "var(--vine)" }}>
          cmd
        </span>
        <form
          style={{ flex: 1 }}
          onSubmit={(e) => {
            e.preventDefault();
            submitCommand(cmd);
          }}
        >
          <input
            ref={inputRef}
            className="search"
            style={{ border: "none", background: "transparent", padding: 0 }}
            placeholder="issue a remote command — / or ⌘K · try: rails approve WIR-118304"
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
          />
        </form>
        <span className="mono dim" style={{ fontSize: 11 }}>
          {store.connectedNodeId ? `session ${store.connectedNodeId}` : "no node attached"}
        </span>
      </footer>

      <div style={{ position: "fixed", right: 22, bottom: 72, display: "flex", flexDirection: "column", gap: 8, zIndex: 20 }}>
        {store.toasts.map((t) => (
          <div
            key={t.id}
            className="panel"
            style={{
              padding: "10px 14px",
              minWidth: 240,
              borderColor:
                t.tone === "ok" ? "rgba(124,255,154,0.4)" : t.tone === "warn" ? "rgba(255,176,32,0.45)" : "rgba(255,77,106,0.45)",
            }}
          >
            <span className={`mono ${t.tone === "ok" ? "leaf" : t.tone === "warn" ? "warn" : "bad"}`} style={{ fontSize: 12 }}>
              {t.text}
            </span>
          </div>
        ))}
      </div>

      {palette && (
        <div
          onClick={() => setPalette(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,12,0.72)",
            zIndex: 30,
            display: "flex",
            justifyContent: "center",
            paddingTop: 14 * 8,
          }}
        >
          <div className="panel" style={{ width: 560, padding: 12 }} onClick={(e) => e.stopPropagation()}>
            <input
              ref={palRef}
              className="search"
              placeholder="Jump or run a command…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (query.includes(" ") || ["help", "status", "liquidity"].includes(query.trim())) {
                    submitCommand(query);
                  } else if (filtered.views[0]) {
                    nav(filtered.views[0].to);
                    setPalette(false);
                  }
                }
              }}
            />
            <div style={{ marginTop: 10 }}>
              {filtered.views.map((v) => (
                <button
                  key={v.id}
                  className="btn ghost"
                  style={{ width: "100%", textAlign: "left", marginBottom: 4, borderRadius: 10 }}
                  onClick={() => {
                    nav(v.to);
                    setPalette(false);
                  }}
                >
                  {v.label}
                </button>
              ))}
              {filtered.cmds.map((c) => (
                <button
                  key={c}
                  className="btn ghost"
                  style={{ width: "100%", textAlign: "left", marginBottom: 4, borderRadius: 10, color: "var(--vine)" }}
                  onClick={() => submitCommand(c)}
                >
                  › {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
