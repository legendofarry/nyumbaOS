export const KSH = (n: number) =>
  `KSh ${Math.abs(n).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

export const KSHSigned = (n: number) =>
  `${n < 0 ? "-" : ""}${KSH(n)}`;

export const floorLabel = (f: number) =>
  f === 0 ? "Ground" : f === 1 ? "First" : `${f}th`;

export const floorShort = (f: number) => (f === 0 ? "G" : `${f}`);

export const fmtDate = (d?: string | Date | null) => {
  if (!d) return "Unknown date";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
};
