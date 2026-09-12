import { useRef, type FormEvent } from "react";
import { useStore } from "../lib/store";

export function Terminal() {
  const store = useStore();
  const ref = useRef<HTMLInputElement>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = ref.current?.value ?? "";
    store.run(value);
    if (ref.current) ref.current.value = "";
  }

  return (
    <div style={{ display: "grid", gap: 16, height: "calc(100vh - 160px)" }}>
      <div>
        <div className="kicker">remote shell</div>
        <h1 className="display" style={{ fontSize: 36, margin: "6px 0 0" }}>
          Command terminal
        </h1>
      </div>
      <section
        className="panel"
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          fontFamily: "var(--font-mono)",
          background: "rgba(3,8,16,0.86)",
        }}
      >
        <div className="scroll" style={{ flex: 1, display: "flex", flexDirection: "column-reverse", gap: 4 }}>
          {store.terminal.map((line) => (
            <div
              key={line.id}
              className={line.kind === "err" ? "bad" : line.kind === "in" ? "vine" : line.kind === "sys" ? "blue" : "ink"}
              style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.45 }}
            >
              {line.text}
            </div>
          ))}
        </div>
        <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
          <span className="vine">›</span>
          <input
            ref={ref}
            className="search"
            style={{ border: "none", background: "transparent", padding: 0 }}
            autoFocus
            placeholder="help · rails approve WIR-118304 · nodes reboot DEN-EDGE"
          />
        </form>
      </section>
    </div>
  );
}
