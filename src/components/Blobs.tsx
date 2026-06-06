export function Blobs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 -left-24 h-[55vmax] w-[55vmax] rounded-full"
        style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--teal) 35%, transparent), transparent 70%)", animation: "float-blob 14s ease-in-out infinite" }} />
      <div className="absolute -bottom-40 -right-32 h-[60vmax] w-[60vmax] rounded-full"
        style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--teal) 28%, transparent), transparent 70%)", animation: "float-blob 18s ease-in-out infinite reverse" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 0%, transparent 50%, oklch(0.10 0.03 180 / 0.6) 100%)" }} />
    </div>
  );
}