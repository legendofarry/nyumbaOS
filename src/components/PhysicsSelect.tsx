import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface Option { value: string; label: string; hint?: string }

interface Props {
  value: string | null;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export function PhysicsSelect({ value, onChange, options, placeholder = "Select", label, className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className={cn("relative", className)} ref={ref}>
      {label && <label className="block text-xs font-medium text-muted-foreground mb-1.5 px-1">{label}</label>}
      <motion.button
        type="button"
        whileTap={{ scale: 0.985 }}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full h-12 px-4 rounded-2xl glass flex items-center justify-between gap-3 text-left",
          "transition-colors hover:bg-white/[0.06]",
          open && "ring-1 ring-teal/50",
        )}
      >
        <span className={cn("truncate text-sm", !current && "text-muted-foreground")}>
          {current?.label ?? placeholder}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="absolute z-50 left-0 right-0 mt-1 glass-strong rounded-2xl p-1.5 shadow-2xl max-h-72 overflow-auto no-scrollbar"
          >
            {options.map((o, i) => {
              const active = o.value === value;
              return (
                <motion.button
                  key={o.value}
                  type="button"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-left",
                    "hover:bg-white/[0.06] transition-colors",
                    active && "bg-teal/15",
                  )}
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{o.label}</span>
                    {o.hint && <span className="text-[11px] text-muted-foreground">{o.hint}</span>}
                  </span>
                  {active && <Check className="h-4 w-4 text-teal" />}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}