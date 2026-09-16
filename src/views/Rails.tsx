import { useMemo, useState } from "react";
import { money, ago } from "../lib/format";
import { useStore } from "../lib/store";
import type { PaymentStatus } from "../lib/types";

const FILTERS: Array<PaymentStatus | "all"> = ["all", "queued", "held", "approved", "rejected", "settled"];

export function Rails() {
  const store = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const rows = useMemo(() => {
    return store.payments.filter((p) => {
      const hay = `${p.id} ${p.from} ${p.to} ${p.kind} ${p.memo}`.toLowerCase();
      const okQ = hay.includes(q.toLowerCase());
      const okF = filter === "all" || p.status === filter;
      return okQ && okF;
    });
  }, [store.payments, q, filter]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <div className="kicker">ACH · Fedwire · RTP · RDC</div>
        <h1 className="display" style={{ fontSize: 36, margin: "6px 0 0" }}>
          Payment rails
        </h1>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          className="search"
          style={{ maxWidth: 280 }}
          placeholder="search id, counterparty, memo"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {FILTERS.map((f) => (
          <button key={f} className={filter === f ? "btn" : "btn ghost"} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>
      <section className="panel" style={{ padding: 8, overflow: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>id</th>
              <th>rail</th>
              <th>flow</th>
              <th>amount</th>
              <th>age</th>
              <th>status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const live = p.status === "queued" || p.status === "held";
              return (
                <tr key={p.id}>
                  <td className="mono">{p.id}</td>
                  <td>
                    {p.kind}
                    <div className="dim" style={{ fontSize: 12 }}>
                      {p.rail}
                    </div>
                  </td>
                  <td>
                    {p.from} → {p.to}
                    <div className="dim">{p.memo}</div>
                  </td>
                  <td>{money(p.amount)}</td>
                  <td className="mono">{ago(p.submittedAt, store.now)}</td>
                  <td>
                    <span
                      className={`pill ${
                        p.status === "held" || p.status === "queued"
                          ? "watch"
                          : p.status === "rejected"
                            ? "crit"
                            : "ok"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td>
                    {live && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn good" onClick={() => store.dispatch({ type: "approve", id: p.id })}>
                          approve
                        </button>
                        <button className="btn ghost" onClick={() => store.dispatch({ type: "hold", id: p.id })}>
                          hold
                        </button>
                        <button className="btn danger" onClick={() => store.dispatch({ type: "reject", id: p.id })}>
                          reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
