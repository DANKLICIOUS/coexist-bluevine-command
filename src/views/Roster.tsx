import { useStore } from "../lib/store";

export function Roster() {
  const store = useStore();
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <div className="kicker">alpha · bravo · night</div>
        <h1 className="display" style={{ fontSize: 36, margin: "6px 0 0" }}>
          Operator roster
        </h1>
      </div>
      <div className="grid-3">
        {store.operators.map((o) => (
          <article key={o.id} className="panel hud-tick" style={{ padding: 18 }}>
            <div className="kicker">{o.shift} shift</div>
            <h3 className="display" style={{ margin: "8px 0 4px", fontSize: 24 }}>
              {o.name}
            </h3>
            <div className="muted">{o.role}</div>
            <div className="mono dim" style={{ fontSize: 12, marginTop: 8 }}>
              {o.id} · {o.seat} · {o.region}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
              <span
                className={`pill ${
                  o.status === "on-desk" || o.status === "remote" ? "ok" : o.status === "paged" ? "watch" : "crit"
                }`}
              >
                {o.status}
              </span>
              {o.id !== store.operator?.id && o.status !== "paged" && (
                <button className="btn" onClick={() => store.dispatch({ type: "page", id: o.id })}>
                  page
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
