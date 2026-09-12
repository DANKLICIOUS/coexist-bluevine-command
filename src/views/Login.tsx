import { useState, type FormEvent } from "react";
import { VineMark } from "../components/Logo";
import { useStore } from "../lib/store";

export function Login() {
  const { login } = useStore();
  const [handle, setHandle] = useState("BV-OPS-01");
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = login(handle, key);
    if (!ok) setError("uplink refused · check operator id and access key");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        position: "relative",
        zIndex: 1,
        padding: 24,
      }}
    >
      <div className="panel hud-tick" style={{ width: "min(520px, 100%)", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <VineMark size={44} />
          <span className="pill ok">
            <span className="pulse" /> remote access
          </span>
        </div>
        <h1 className="display" style={{ fontSize: 42, margin: "18px 0 8px" }}>
          COEXIST
        </h1>
        <p className="muted" style={{ marginTop: 0, lineHeight: 1.5 }}>
          Bluevine remote command center. Dual-control rails, live treasury, and the
          nationwide node fabric — one uplink.
        </p>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 22 }}>
          <label className="kicker">
            operator
            <input
              className="search"
              style={{ marginTop: 8 }}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </label>
          <label className="kicker">
            access key
            <input
              className="search"
              style={{ marginTop: 8 }}
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="coexist"
              autoComplete="off"
            />
          </label>
          {error && (
            <div className="mono bad" style={{ fontSize: 12 }}>
              {error}
            </div>
          )}
          <button className="btn" type="submit">
            establish uplink
          </button>
        </form>
        <div className="mono dim" style={{ fontSize: 11, marginTop: 16, lineHeight: 1.6 }}>
          demo desk · BV-OPS-01 / BV-OPS-07 / BV-OPS-12
          <br />
          access key · coexist
        </div>
      </div>
    </div>
  );
}
