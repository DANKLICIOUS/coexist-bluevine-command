type SeriesProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
};

export function Spark({
  data,
  width = 140,
  height = 42,
  color = "#2de2c5",
  fill = true,
}: SeriesProps) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / span) * (height - 6) - 3;
    return [x, y] as const;
  });
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  const area = `${d} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {fill && <path d={area} fill={color} opacity={0.12} />}
      <path d={d} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function Bars({
  data,
  width = 220,
  height = 88,
  color = "#3d8bff",
}: SeriesProps) {
  const max = Math.max(...data);
  const gap = 4;
  const w = (width - gap * (data.length - 1)) / data.length;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((v, i) => {
        const h = (v / max) * (height - 4);
        return (
          <rect
            key={i}
            x={i * (w + gap)}
            y={height - h}
            width={w}
            height={h}
            rx={3}
            fill={color}
            opacity={0.35 + (i / data.length) * 0.65}
          />
        );
      })}
    </svg>
  );
}

export function Utilization({ value, color = "var(--vine)" }: { value: number; color?: string }) {
  return (
    <div
      style={{
        height: 6,
        borderRadius: 99,
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(100, value)}%`,
          height: "100%",
          background: color,
          boxShadow: `0 0 12px ${color}`,
        }}
      />
    </div>
  );
}
