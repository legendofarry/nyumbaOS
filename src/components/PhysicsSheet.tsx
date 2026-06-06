import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function PhysicsSheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial="hidden" animate="show" exit="hidden"
        >
          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />
          <motion.div
            variants={{ hidden: { y: "100%" }, show: { y: 0 } }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => { if (info.offset.y > 120) onClose(); }}
            className="relative w-full max-w-md glass-strong rounded-t-[28px] shadow-2xl pb-[max(env(safe-area-inset-bottom),1rem)]"
          >
            <div className="flex justify-center pt-2.5"><div className="h-1.5 w-12 rounded-full bg-white/15" /></div>
            {title && (
              <div className="flex items-center justify-between px-5 pt-3">
                <h3 className="text-lg font-semibold">{title}</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5"><X className="h-4 w-4" /></button>
              </div>
            )}
            <div className="px-5 pt-3 pb-5 max-h-[85dvh] overflow-y-auto no-scrollbar">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}