export function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Stable color from name
const PALETTE = [
  { bg: "rgba(34,197,94,0.18)", fg: "#22c55e" },   // green
  { bg: "rgba(59,130,246,0.18)", fg: "#60a5fa" },  // blue
  { bg: "rgba(168,85,247,0.18)", fg: "#a78bfa" },  // purple
  { bg: "rgba(244,63,94,0.18)", fg: "#fb7185" },   // rose
  { bg: "rgba(234,179,8,0.18)", fg: "#facc15" },   // yellow
  { bg: "rgba(20,184,166,0.18)", fg: "#2dd4bf" },  // teal
];
export function colorForName(name?: string | null) {
  const s = (name || "?").toUpperCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
