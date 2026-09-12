import type { ReactNode } from "react";

export function Kpi({
  label,
  value,
  hint,
  trend,
  child,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  child?: ReactNode;
}) {
  return (
    <div className="panel hud-tick" style={{ padding: 18 }}>
      <div className="kicker">{label}</div>
      <div className="display" style={{ fontSize: 28, marginTop: 8, letterSpacing: "-0.04em" }}>
        {value}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, gap: 8 }}>
        {hint && (
          <span className="mono dim" style={{ fontSize: 11 }}>
            {hint}
          </span>
        )}
        {trend && (
          <span className="mono vine" style={{ fontSize: 11 }}>
            {trend}
          </span>
        )}
      </div>
      {child && <div style={{ marginTop: 10 }}>{child}</div>}
    </div>
  );
}
