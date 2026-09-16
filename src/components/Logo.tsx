export function VineMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect width="64" height="64" rx="18" fill="#06101b" />
      <path
        d="M18 44c9-2 13-11 13-19 0-7 3.2-13 11.5-15.2"
        stroke="#3d8bff"
        strokeWidth="5.2"
        strokeLinecap="round"
      />
      <path
        d="M21 48c12 7 22 4 28-8"
        stroke="#2de2c5"
        strokeWidth="5.2"
        strokeLinecap="round"
      />
      <circle cx="42.5" cy="11.5" r="4.2" fill="#7cff9a" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <VineMark />
      <div>
        <div
          className="display"
          style={{ fontSize: 18, lineHeight: 1, letterSpacing: "-0.04em" }}
        >
          bluevine
        </div>
        <div className="kicker" style={{ marginTop: 4, color: "var(--vine)" }}>
          coexist command
        </div>
      </div>
    </div>
  );
}
