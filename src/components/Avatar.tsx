import { cn } from "@/lib/utils";

function colorFor(name: string) {
  const hues = [165, 180, 195, 200, 145, 215];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % hues.length;
  return hues[h];
}

export function Avatar({
  name,
  url,
  size = 40,
  className,
}: {
  name?: string | null;
  url?: string | null;
  size?: number;
  className?: string;
}) {
  const safeName = name?.trim() || "Unknown";
  const initials = safeName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hue = colorFor(safeName);
  return (
      <div
      className={cn("relative inline-flex items-center justify-center rounded-full font-semibold overflow-hidden text-primary-foreground", className)}
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, oklch(0.85 0.16 ${hue}), oklch(0.70 0.16 ${hue + 20}))`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.25), 0 4px 14px -6px oklch(0.7 0.16 ${hue} / 0.6)`,
        fontSize: size * 0.38,
      }}
    >
      {url ? <img src={url} alt={safeName} className="w-full h-full object-cover" /> : <span>{initials || "?"}</span>}
    </div>
  );
}
