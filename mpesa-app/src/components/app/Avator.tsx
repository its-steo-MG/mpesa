import { getInitials, colorForName } from "@/lib/initials";

type Props = {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
};

export function Avatar({ name, src, size = 40, className = "" }: Props) {
  const c = colorForName(name);
  const initials = getInitials(name);
  const style: React.CSSProperties = {
    width: size,
    height: size,
    background: c.bg,
    color: c.fg,
    fontSize: Math.round(size * 0.36),
  };
  if (src) {
    return (
      <img
        src={src}
        alt={name || ""}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      style={style}
      className={`rounded-full flex items-center justify-center font-bold ${className}`}
    >
      {initials}
    </div>
  );
}
