import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { usePwaInstallPrompt } from "@/lib/use-pwa-install";
import { cn } from "@/lib/utils";
import { PhysicsButton } from "./PhysicsButton";

type Props = {
  variant?: "hero" | "compact";
  className?: string;
};

function FeatureChip({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </span>
  );
}



export function PwaInstallPromo({ variant = "compact", className }: Props) {
  const { canPrompt, dismiss, installed, promptInstall, showPrompt } = usePwaInstallPrompt();

  if (installed || !showPrompt) {
    return null;
  }

  const isHero = variant === "hero";
  const installBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (showPrompt) {
      // focus primary action and prevent background scroll while modal is shown
      installBtnRef.current?.focus();
      try {
        document.body.style.overflow = "hidden";
      } catch {}
    }

    return () => {
      try {
        document.body.style.overflow = "";
      } catch {}
    };
  }, [showPrompt]);

  const onInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      toast.success("Installed. Launch from your home screen for the full Android-style experience.");
      return;
    }

    if (outcome === "dismissed") {
      toast.message("No problem. You can install it later from your browser menu.");
      return;
    }

    toast.message("In Chrome on Android, use the browser menu and choose Install app.");
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      <div className="mx-4 w-full max-w-3xl">
        <motion.section
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className={cn("glass-strong relative overflow-hidden rounded-[2rem] p-5 sm:p-6", className)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal/15 via-transparent to-transparent" />
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal/20 blur-3xl" />
          <div className="relative">
            <div className="grid gap-5 md:grid-cols-1 md:items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-teal" />
                  PWA ready
                </div>
                <div>
                  <h2 id="pwa-install-title" className="font-display text-2xl font-bold tracking-tight">Install the app for the Android feel</h2>
                  <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                    Add Apartment to your home screen so it launches full screen, opens faster, and feels like a native Android app.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <FeatureChip>Home screen</FeatureChip>
                  <FeatureChip>Full screen</FeatureChip>
                  <FeatureChip>Fast reopen</FeatureChip>
                </div>
                <div className="flex flex-wrap gap-2">
                  <PhysicsButton size="sm" onClick={onInstall} ref={installBtnRef}>
                    <Download className="h-4 w-4" />
                    {canPrompt ? "Install now" : "Install app"}
                  </PhysicsButton>
                  <PhysicsButton
                    size="sm"
                    variant="ghost"
                    onClick={dismiss}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Maybe later
                  </PhysicsButton>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
