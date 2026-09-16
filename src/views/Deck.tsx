import { useNavigate } from "react-router-dom";
import { Bars, Spark } from "../components/Charts";
import { Kpi } from "../components/Kpi";
import { compactMoney, compactNum, money } from "../lib/format";
import { ACH_SERIES, RISK_SERIES, TREASURY_SERIES } from "../lib/seed";
import { useStore } from "../lib/store";

export function Deck() {
  const store = useStore();
  const nav = useNavigate();
  const held = store.payments.filter((p) => p.status === "held");
  const openAlerts = store.alerts.filter((a) => !a.acked);
  const degraded = store.nodes.filter((n) => n.status !== "online");

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <div className="kicker">bluevine · coexist</div>
        <h1 className="display" style={{ fontSize: 40, margin: "6px 0 0" }}>
          Remote command deck
        </h1>
        <p className="muted" style={{ marginTop: 6, maxWidth: 640 }}>
          Live book for 1M+ small businesses. Approve rails, freeze risk, and
          drive the node fabric without leaving this seat.
        </p>
      </div>

      <div className="grid-4">
        <Kpi
          label="deposits on book"
          value={compactMoney(store.snapshot.deposits)}
          hint="Coastal Community + program banks"
          trend="+0.4% session"
          child={<Spark data={TREASURY_SERIES} />}
        />
        <Kpi
          label="lending outstanding"
          value={compactMoney(store.snapshot.loansOutstanding)}
          hint="LOC + partner term"
          trend="performing 3 / 5"
        />
        <Kpi
          label="ACH today"
          value={compactMoney(store.snapshot.achToday)}
          hint="same-day + next-day"
          child={<Bars data={ACH_SERIES} width={180} height={42} />}
        />
        <Kpi
          label="businesses served"
          value={compactNum(store.snapshot.businesses)}
          hint={`${store.snapshot.nodesOnline} nodes online`}
          child={<Spark data={RISK_SERIES} color="#ffb020" />}
        />
      </div>

      <div className="grid-2">
        <section className="panel" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div className="kicker">held dual-control</div>
            <button className="btn ghost" onClick={() => nav("/rails")}>
              open rails
            </button>
          </div>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {held.length === 0 && <div className="muted">No held payments.</div>}
            {held.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <div className="mono" style={{ fontSize: 12 }}>
                    {p.id} · {p.kind}
                  </div>
                  <div>
                    {p.from} → {p.to}
                  </div>
                  <div className="dim" style={{ fontSize: 13 }}>
                    {p.memo}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="display" style={{ fontSize: 20 }}>
                    {money(p.amount)}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                    <button className="btn good" onClick={() => store.dispatch({ type: "approve", id: p.id })}>
                      release
                    </button>
                    <button className="btn danger" onClick={() => store.dispatch({ type: "reject", id: p.id })}>
                      reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel" style={{ padding: 18 }}>
          <div className="kicker">sentinel + fabric</div>
          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            {openAlerts.slice(0, 3).map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <span className={`pill ${a.severity === "critical" ? "crit" : a.severity === "watch" ? "watch" : "info"}`}>
                    {a.severity}
                  </span>
                  <div style={{ marginTop: 6 }}>{a.title}</div>
                </div>
                <button className="btn ghost" onClick={() => store.dispatch({ type: "ack-alert", id: a.id })}>
                  ack
                </button>
              </div>
            ))}
            {degraded.map((n) => (
              <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span className="pill watch">{n.status}</span>
                  <div style={{ marginTop: 6 }}>
                    {n.name} · {n.latencyMs}ms
                  </div>
                </div>
                <button className="btn" onClick={() => store.dispatch({ type: "connect", id: n.id })}>
                  attach
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
