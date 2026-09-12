import { Spark, Utilization } from "../components/Charts";
import { Kpi } from "../components/Kpi";
import { compactMoney, money, pct } from "../lib/format";
import { TREASURY_SERIES } from "../lib/seed";
import { useStore } from "../lib/store";

export function Treasury() {
  const { snapshot, accounts, credits } = useStore();
  const frozen = accounts.filter((a) => a.status === "frozen").reduce((s, a) => s + a.deposits, 0);
  const premier = accounts.filter((a) => a.apyPlan === "Premier");
  const utilization =
    credits.reduce((s, c) => s + c.drawn, 0) / credits.reduce((s, c) => s + c.limit, 0);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <div className="kicker">liquidity</div>
        <h1 className="display" style={{ fontSize: 36, margin: "6px 0 0" }}>
          Treasury position
        </h1>
      </div>
      <div className="grid-4">
        <Kpi label="cash on book" value={compactMoney(snapshot.deposits)} child={<Spark data={TREASURY_SERIES} width={160} />} />
        <Kpi label="FDIC program" value="$3.0M" hint="per depositor via Coastal Community + partners" />
        <Kpi label="frozen funds" value={money(frozen)} hint="excluded from rails" />
        <Kpi label="credit drawn" value={pct(utilization * 100)} hint="across live facilities" />
      </div>
      <div className="grid-2">
        <section className="panel" style={{ padding: 18 }}>
          <div className="kicker">concentration · premier</div>
          <table className="table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>account</th>
                <th>plan</th>
                <th>deposits</th>
                <th>share</th>
              </tr>
            </thead>
            <tbody>
              {accounts
                .slice()
                .sort((a, b) => b.deposits - a.deposits)
                .map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div>{a.dba}</div>
                      <div className="mono dim" style={{ fontSize: 11 }}>
                        {a.id}
                      </div>
                    </td>
                    <td>{a.apyPlan}</td>
                    <td>{money(a.deposits)}</td>
                    <td style={{ minWidth: 120 }}>
                      <Utilization
                        value={(a.deposits / snapshot.deposits) * 100 * 80}
                        color={a.status === "frozen" ? "var(--bad)" : "var(--blue)"}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
        <section className="panel" style={{ padding: 18 }}>
          <div className="kicker">apy stack</div>
          <p className="muted" style={{ lineHeight: 1.55 }}>
            Standard 1.3% APY up to $250k when eligibility clears. Plus and Premier
            lift yield to 3.0% with payment-fee discounts. Premier desks on this
            watch: {premier.map((p) => p.dba).join(", ")}.
          </p>
          <div className="panel" style={{ padding: 14, marginTop: 12, boxShadow: "none" }}>
            <div className="kicker">program banks</div>
            <div style={{ marginTop: 10 }} className="mono">
              Coastal Community Bank · Member FDIC
              <br />
              sweep network · $3,000,000 coverage
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
