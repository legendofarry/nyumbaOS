const KSH = (n) => `KSh ${Math.abs(n).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
const floorLabel = (f) => f === 0 ? "Ground" : f === 1 ? "First" : `${f}th`;
const fmtDate = (d) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
};
export {
  KSH as K,
  floorLabel as a,
  fmtDate as f
};
