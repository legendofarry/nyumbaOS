import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm grid place-items-end sm:place-items-center p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-surface rounded-[2rem] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black">{title}</h2>
              <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-2xl bg-muted hover:bg-foreground hover:text-background transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "w-full px-4 py-3 rounded-2xl bg-muted border border-transparent focus:border-foreground focus:bg-surface outline-none text-sm font-medium transition-colors";

export function PrimaryBtn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className="w-full px-4 py-3 rounded-2xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-opacity">{children}</button>;
}
