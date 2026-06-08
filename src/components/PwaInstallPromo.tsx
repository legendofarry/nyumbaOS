import { AnimatePresence, motion } from "framer-motion";
import { Smartphone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";

import { usePwaInstallPrompt } from "@/lib/use-pwa-install";
import { cn } from "@/lib/utils";
import { PhysicsButton } from "./PhysicsButton";

type Props = {
  variant?: "hero" | "compact";
  className?: string;
  timed?: boolean;
};

const VISIBLE_MS = 4000000;
const REPEAT_MS = 10 * 60 * 1000;

function FeatureChip({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </span>
  );
}

function PhoneMock() {
  return (
    <div className="relative mx-auto w-[182px]">
      <div className="absolute inset-0 rounded-[2.1rem] bg-teal/20 blur-3xl" />
      <div className="relative rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#133430] to-[#091513] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <div className="mx-auto h-1.5 w-14 rounded-full bg-white/12" />
          <div className="mt-4 rounded-[1.35rem] bg-white/5 p-3 ring-1 ring-white/8">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal/20 text-teal ring-1 ring-teal/30">
                <Smartphone className="h-4 w-4" />
              </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Android feel</div>
              <div className="mt-0.5 text-sm font-semibold text-foreground">Apartment installed</div>
            </div>
          </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-teal/18 p-2.5 ring-1 ring-teal/20">
                <div className="text-[10px] uppercase tracking-[0.16em] text-teal">Full screen</div>
                <div className="mt-1 text-xs text-foreground/90">Feels native on Android</div>
              </div>
              <div className="rounded-2xl bg-white/6 p-2.5 ring-1 ring-white/8">
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Launch</div>
                <div className="mt-1 text-xs text-foreground/90">Opens from your home screen</div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

export function PwaInstallPromo({ variant = "compact", className, timed = false }: Props) {
  const { canPrompt, installed, promptInstall } = usePwaInstallPrompt();
  const [visible, setVisible] = useState(!timed);
  const [showInstallHint, setShowInstallHint] = useState(false);
  const installHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashInstallHint = () => {
    if (installHintTimerRef.current) {
      clearTimeout(installHintTimerRef.current);
    }

    setShowInstallHint(true);
    installHintTimerRef.current = setTimeout(() => {
      setShowInstallHint(false);
      installHintTimerRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    if (!timed) {
      setVisible(true);
      return;
    }

    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let repeatTimer: ReturnType<typeof setInterval> | undefined;

    const showCycle = () => {
      setVisible(true);
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
      hideTimer = setTimeout(() => {
        setVisible(false);
      }, VISIBLE_MS);
    };

    showCycle();
    repeatTimer = setInterval(showCycle, REPEAT_MS);

    return () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
      if (repeatTimer) {
        clearInterval(repeatTimer);
      }
    };
  }, [timed]);

  useEffect(() => {
    return () => {
      if (installHintTimerRef.current) {
        clearTimeout(installHintTimerRef.current);
      }
    };
  }, []);

  if (installed || !visible || !canPrompt) {
    return null;
  }

  const isHero = variant === "hero";

  const handlePwaInstall = async () => {
    flashInstallHint();

    const outcome = await promptInstall();

    if (outcome === "accepted") {
      toast.success("Installed. Launch from your home screen for the full Android-style experience.");
      return;
    }

    if (outcome === "dismissed") {
      toast.message("Install popup was closed. You can try again anytime.");
      return;
    }

    toast.message("Install prompt is not ready yet. Try again in a moment.");
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={cn("glass-strong relative overflow-hidden rounded-[2rem] p-5 sm:p-6", className)}
    >
      <AnimatePresence>
        {showInstallHint ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-3 py-2 text-center text-[11px] font-medium text-foreground shadow-lg backdrop-blur-md"
          >
            Tap Install in the popup to add the app
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-br from-teal/15 via-transparent to-transparent" />
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal/20 blur-3xl" />

      {isHero ? (
        <div className="relative grid gap-5 md:grid-cols-[1.15fr_0.85fr] md:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-teal" />
              Install option
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">Install the app</h2>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                Use the native install prompt from Chrome on Android to add the app to your home screen.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <FeatureChip>Native install</FeatureChip>
              <FeatureChip>Better</FeatureChip>
              <FeatureChip>Experience</FeatureChip>
            </div>
            <div className="flex flex-wrap gap-2">
              <PhysicsButton size="sm" onClick={handlePwaInstall}>
                <Sparkles className="h-4 w-4" />
                Install app (recommended)
              </PhysicsButton>
            </div>
          </div>
          <PhoneMock />
        </div>
      ) : (
        <div className="relative flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal/20 ring-1 ring-teal/30">
            <Smartphone className="h-5 w-5 text-teal" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-teal" />
              Install options
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Use the native prompt to add the app to your home screen.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <FeatureChip>Native</FeatureChip>
              <FeatureChip>Better</FeatureChip>
              <FeatureChip>Experience</FeatureChip>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <PhysicsButton size="sm" onClick={handlePwaInstall}>
                <Sparkles className="h-4 w-4" />
                Install app (recommended)
              </PhysicsButton>
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}
