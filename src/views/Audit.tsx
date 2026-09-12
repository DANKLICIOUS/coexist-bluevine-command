import { clock } from "../lib/format";
import { useStore } from "../lib/store";

export function Audit() {
  const { audit } = useStore();
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <div className="kicker">immutable desk log</div>
        <h1 className="display" style={{ fontSize: 36, margin: "6px 0 0" }}>
          Audit trail
        </h1>
      </div>
      <section className="panel" style={{ padding: 8 }}>
        <table className="table">
          <thead>
            <tr>
              <th>when</th>
              <th>actor</th>
              <th>action</th>
              <th>target</th>
              <th>detail</th>
            </tr>
          </thead>
          <tbody>
            {audit.map((e) => (
              <tr key={e.id}>
                <td className="mono">{clock(e.at)}</td>
                <td className="mono">{e.actor}</td>
                <td>{e.action}</td>
                <td className="mono">{e.target}</td>
                <td className="dim">{e.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
