import { useState } from "react";
import { ago, money } from "../lib/format";
import { useStore } from "../lib/store";

export function Risk() {
  const store = useStore();
  const [q, setQ] = useState("");
  const accounts = store.accounts.filter((a) =>
    `${a.id} ${a.dba} ${a.legal} ${a.city}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <div className="kicker">fraud · mule · ofac</div>
        <h1 className="display" style={{ fontSize: 36, margin: "6px 0 0" }}>
          Risk sentinel
        </h1>
      </div>
      <div className="grid-2">
        <section className="panel" style={{ padding: 18 }}>
          <div className="kicker">open typology</div>
          <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
            {store.alerts.map((a) => (
              <article key={a.id} style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <span className={`pill ${a.severity === "critical" ? "crit" : a.severity === "watch" ? "watch" : "info"}`}>
                      {a.severity}
                    </span>
                    {a.acked && (
                      <span className="pill ok" style={{ marginLeft: 6 }}>
                        acked
                      </span>
                    )}
                    <h3 style={{ margin: "8px 0 4px" }}>{a.title}</h3>
                    <p className="muted" style={{ margin: 0 }}>
                      {a.detail}
                    </p>
                    <div className="mono dim" style={{ fontSize: 11, marginTop: 6 }}>
                      {a.id} · {ago(a.createdAt, store.now)} · {a.accountId}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {!a.acked && (
                      <button className="btn" onClick={() => store.dispatch({ type: "ack-alert", id: a.id })}>
                        ack
                      </button>
                    )}
                    <button className="btn ghost" onClick={() => store.dispatch({ type: "escalate-alert", id: a.id })}>
                      escalate
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="panel" style={{ padding: 18 }}>
          <div className="kicker">account controls</div>
          <input
            className="search"
            style={{ margin: "12px 0" }}
            placeholder="search legal, DBA, city"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="scroll" style={{ maxHeight: 560 }}>
            {accounts.map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "12px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{a.dba}</div>
                  <div className="dim" style={{ fontSize: 13 }}>
                    {a.legal} · {a.city}, {a.state}
                  </div>
                  <div className="mono dim" style={{ fontSize: 11, marginTop: 4 }}>
                    {a.id} · deposits {money(a.deposits)} · risk {a.risk}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    className={`pill ${
                      a.status === "frozen" ? "crit" : a.status === "review" ? "watch" : "ok"
                    }`}
                  >
                    {a.status}
                  </span>
                  <div style={{ marginTop: 8 }}>
                    {a.status === "frozen" ? (
                      <button className="btn good" onClick={() => store.dispatch({ type: "thaw", id: a.id })}>
                        thaw
                      </button>
                    ) : (
                      <button className="btn danger" onClick={() => store.dispatch({ type: "freeze", id: a.id })}>
                        freeze
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
