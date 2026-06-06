import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "glass" | "danger";

interface Props extends HTMLMotionProps<"button"> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

const variants: Record<Variant, string> = {
  primary: "bg-teal text-primary-foreground teal-glow",
  ghost: "bg-transparent text-foreground hover:bg-white/5",
  glass: "glass text-foreground",
  danger: "bg-destructive text-destructive-foreground",
};

export const PhysicsButton = forwardRef<HTMLButtonElement, Props>(function PhysicsButton(
  { variant = "primary", size = "md", className, children, ...rest }, ref,
) {
  const sz =
    size === "sm" ? "h-9 px-4 text-sm" :
    size === "lg" ? "h-14 px-7 text-base" : "h-11 px-5 text-sm";
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.94 }}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight select-none",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60",
        sz, variants[variant], className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
});