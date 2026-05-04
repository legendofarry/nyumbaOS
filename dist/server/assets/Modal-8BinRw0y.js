import { r as reactExports, W as jsxRuntimeExports } from "./worker-entry-B4jK-wDu.js";
import { A as AnimatePresence, X } from "./x-DMSthfi5.js";
import { m as motion } from "./router-DRMkp4_G.js";
function Modal({ open, onClose, title, children }) {
  reactExports.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: open && /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.div,
    {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      className: "fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm grid place-items-end sm:place-items-center p-3",
      onClick: onClose,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          initial: { y: 40, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: 40, opacity: 0 },
          transition: { type: "spring", stiffness: 400, damping: 35 },
          onClick: (e) => e.stopPropagation(),
          className: "w-full sm:max-w-md bg-surface rounded-[2rem] p-6 shadow-2xl max-h-[90vh] overflow-y-auto",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-black", children: title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "h-9 w-9 grid place-items-center rounded-2xl bg-muted hover:bg-foreground hover:text-background transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
            ] }),
            children
          ]
        }
      )
    }
  ) });
}
function Field({ label, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] uppercase tracking-widest font-bold text-muted-foreground", children: label }),
    children
  ] });
}
const inputCls = "w-full px-4 py-3 rounded-2xl bg-muted border border-transparent focus:border-foreground focus:bg-surface outline-none text-sm font-medium transition-colors";
function PrimaryBtn({ children, ...p }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { ...p, className: "w-full px-4 py-3 rounded-2xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-opacity", children });
}
export {
  Field as F,
  Modal as M,
  PrimaryBtn as P,
  inputCls as i
};
