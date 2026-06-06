import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const PhysicsTextarea = forwardRef<HTMLTextAreaElement, Props>(function PhysicsTextarea(
  { label, className, ...rest }, ref,
) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-muted-foreground mb-1.5 px-1">{label}</span>}
      <span className="block rounded-2xl glass focus-within:ring-1 focus-within:ring-teal/60 transition p-3">
        <textarea
          ref={ref}
          className={cn("w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/70 resize-none min-h-[80px]", className)}
          {...rest}
        />
      </span>
    </label>
  );
});