import { Utilization } from "../components/Charts";
import { money, pct } from "../lib/format";
import { useStore } from "../lib/store";

export function Credit() {
  const { credits } = useStore();
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <div className="kicker">LOC to $250k · term to $500k</div>
        <h1 className="display" style={{ fontSize: 36, margin: "6px 0 0" }}>
          Credit book
        </h1>
      </div>
      <section className="panel" style={{ padding: 8 }}>
        <table className="table">
          <thead>
            <tr>
              <th>facility</th>
              <th>borrower</th>
              <th>kind</th>
              <th>drawn</th>
              <th>rate</th>
              <th>status</th>
            </tr>
          </thead>
          <tbody>
            {credits.map((c) => {
              const used = (c.drawn / c.limit) * 100;
              return (
                <tr key={c.id}>
                  <td className="mono">{c.id}</td>
                  <td>
                    {c.legal}
                    <div className="mono dim">{c.accountId}</div>
                  </td>
                  <td>{c.kind === "line" ? "Line of credit" : "Term loan"}</td>
                  <td style={{ minWidth: 180 }}>
                    {money(c.drawn)} / {money(c.limit)}
                    <div style={{ marginTop: 6 }}>
                      <Utilization
                        value={used}
                        color={used > 90 ? "var(--bad)" : used > 70 ? "var(--warn)" : "var(--vine)"}
                      />
                    </div>
                  </td>
                  <td>{pct(c.rate)}</td>
                  <td>
                    <span
                      className={`pill ${
                        c.status === "performing" ? "ok" : c.status === "watch" ? "watch" : "crit"
                      }`}
                    >
                      {c.status}
                    </span>
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
