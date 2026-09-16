import { useState, type FormEvent } from "react";
import { ago } from "../lib/format";
import { useStore } from "../lib/store";

export function Incidents() {
  const store = useStore();
  const [title, setTitle] = useState("");

  function open(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    store.dispatch({ type: "open-incident", title: title.trim() });
    setTitle("");
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <div className="kicker">bridge</div>
        <h1 className="display" style={{ fontSize: 36, margin: "6px 0 0" }}>
          Incident bridge
        </h1>
      </div>
      <form onSubmit={open} style={{ display: "flex", gap: 10 }}>
        <input
          className="search"
          placeholder="open a new incident…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn" type="submit">
          open
        </button>
      </form>
      <section className="panel" style={{ padding: 18, display: "grid", gap: 14 }}>
        {store.incidents.map((i) => (
          <article key={i.id} className="panel" style={{ padding: 16, boxShadow: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="mono">{i.id}</span>
                  <span className={`pill ${i.severity === "critical" ? "crit" : i.severity === "watch" ? "watch" : "info"}`}>
                    {i.severity}
                  </span>
                  <span className={`pill ${i.status === "resolved" ? "ok" : i.status === "acked" ? "info" : "watch"}`}>
                    {i.status}
                  </span>
                </div>
                <h3 style={{ margin: "8px 0 4px" }}>{i.title}</h3>
                <p className="muted" style={{ margin: 0 }}>
                  {i.notes}
                </p>
                <div className="mono dim" style={{ fontSize: 11, marginTop: 8 }}>
                  owner {i.owner} · {ago(i.openedAt, store.now)}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {i.status === "open" && (
                  <button className="btn" onClick={() => store.dispatch({ type: "ack-incident", id: i.id })}>
                    ack
                  </button>
                )}
                {i.status !== "resolved" && (
                  <button className="btn good" onClick={() => store.dispatch({ type: "resolve-incident", id: i.id })}>
                    resolve
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
