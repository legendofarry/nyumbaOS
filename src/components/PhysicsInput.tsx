import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  prefix?: string;
}

export const PhysicsInput = forwardRef<HTMLInputElement, Props>(function PhysicsInput(
  { label, prefix, className, ...rest }, ref,
) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-muted-foreground mb-1.5 px-1">{label}</span>}
      <span className="flex items-center gap-2 h-12 px-4 rounded-2xl glass focus-within:ring-1 focus-within:ring-teal/60 transition">
        {prefix && <span className="text-xs text-muted-foreground font-semibold">{prefix}</span>}
        <input
          ref={ref}
          className={cn("flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70", className)}
          {...rest}
        />
      </span>
    </label>
  );
});