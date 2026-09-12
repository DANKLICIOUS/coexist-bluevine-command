import { useStore } from "../lib/store";
import type { RemoteNode } from "../lib/types";

function project(lat: number, lon: number) {
  const x = ((lon + 125) / 58) * 640;
  const y = ((50 - lat) / 26) * 360;
  return { x, y };
}

function NodeMap({ nodes, active, onPick }: { nodes: RemoteNode[]; active: string | null; onPick: (id: string) => void }) {
  return (
    <svg viewBox="0 0 640 360" style={{ width: "100%", height: "auto" }}>
      <rect width="640" height="360" fill="rgba(8,18,32,0.4)" rx="16" />
      <path
        d="M70 80 L150 70 L230 90 L310 60 L420 70 L520 90 L560 130 L530 190 L500 250 L420 280 L330 300 L240 290 L160 260 L90 210 L70 140 Z"
        fill="none"
        stroke="rgba(61,139,255,0.28)"
        strokeWidth="1.4"
      />
      {nodes.map((n) => {
        const { x, y } = project(n.lat, n.lon);
        const hot = n.id === active;
        const color =
          n.status === "online" ? "#7cff9a" : n.status === "degraded" ? "#ffb020" : n.status === "rebooting" ? "#3d8bff" : "#ff4d6a";
        return (
          <g key={n.id} onClick={() => onPick(n.id)} style={{ cursor: "pointer" }}>
            <circle cx={x} cy={y} r={hot ? 10 : 6} fill={color} opacity={0.9} />
            <circle cx={x} cy={y} r={hot ? 18 : 12} fill="none" stroke={color} opacity={0.35} />
            <text x={x + 12} y={y - 8} fill="#e8f1ff" fontSize="11" fontFamily="IBM Plex Mono, monospace">
              {n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Nodes() {
  const store = useStore();
  const selected = store.nodes.find((n) => n.id === store.connectedNodeId) ?? store.nodes[0];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <div className="kicker">hq · cloud · edge · partner</div>
        <h1 className="display" style={{ fontSize: 36, margin: "6px 0 0" }}>
          Remote node fabric
        </h1>
      </div>
      <div className="grid-2">
        <section className="panel" style={{ padding: 12 }}>
          <NodeMap
            nodes={store.nodes}
            active={store.connectedNodeId}
            onPick={(id) => store.dispatch({ type: "connect", id })}
          />
        </section>
        <section className="panel" style={{ padding: 18 }}>
          <div className="kicker">attached session</div>
          <h2 className="display" style={{ margin: "8px 0 4px" }}>
            {selected.name}
          </h2>
          <div className="mono dim">
            {selected.id} · {selected.city} · {selected.kind}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <span className={`pill ${selected.status === "online" ? "ok" : selected.status === "degraded" ? "watch" : "crit"}`}>
              {selected.status}
            </span>
            <span className="pill info">{selected.latencyMs} ms</span>
            <span className="pill">{selected.cpu}% cpu</span>
            <span className="pill">{selected.sessions} sessions</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => store.dispatch({ type: "connect", id: selected.id })}>
              attach
            </button>
            <button className="btn ghost" onClick={() => store.dispatch({ type: "reboot", id: selected.id })}>
              reboot
            </button>
            {selected.status === "isolated" ? (
              <button className="btn good" onClick={() => store.dispatch({ type: "restore", id: selected.id })}>
                restore
              </button>
            ) : (
              <button className="btn danger" onClick={() => store.dispatch({ type: "isolate", id: selected.id })}>
                isolate
              </button>
            )}
          </div>
        </section>
      </div>
      <section className="panel" style={{ padding: 8 }}>
        <table className="table">
          <thead>
            <tr>
              <th>node</th>
              <th>kind</th>
              <th>status</th>
              <th>latency</th>
              <th>cpu</th>
              <th>sessions</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {store.nodes.map((n) => (
              <tr key={n.id}>
                <td>
                  {n.name}
                  <div className="mono dim">{n.id}</div>
                </td>
                <td>{n.kind}</td>
                <td>
                  <span className={`pill ${n.status === "online" ? "ok" : n.status === "degraded" ? "watch" : "crit"}`}>
                    {n.status}
                  </span>
                </td>
                <td className="mono">{n.latencyMs}ms</td>
                <td className="mono">{n.cpu}%</td>
                <td className="mono">{n.sessions}</td>
                <td>
                  <button className="btn ghost" onClick={() => store.dispatch({ type: "connect", id: n.id })}>
                    attach
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
