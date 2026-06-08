import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { onAuthStateChanged } from "firebase/auth";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Fingerprint, KeyRound, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Blobs } from "@/components/Blobs";
import { PhysicsButton } from "@/components/PhysicsButton";
import { auth } from "@/integrations/client";
import { signInWithCode } from "@/lib/apt.functions";
import {
  biometricsSupported,
  clearBiometric,
  getStoredBiometric,
  registerBiometric,
  unlockWithBiometric,
} from "@/lib/biometrics";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Welcome - Makazi" },
      { name: "description", content: "Modern apartment app for tenants and owner." },
    ],
  }),
  component: LoginScreen,
});

function LoginScreen() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"bio" | "code">(getStoredBiometric() ? "bio" : "code");
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const hasBio = !!getStoredBiometric();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate({ to: "/app" });
      }
    });

    return unsubscribe;
  }, [navigate]);

  async function signInWithTenantCode(c: string) {
    setBusy(true);
    try {
      await signInWithCode(c);
      toast.success("Welcome back");
      navigate({ to: "/app" });
    } catch (error: any) {
      toast.error(error?.message || "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  async function handleBiometric() {
    setBusy(true);
    try {
      const c = await unlockWithBiometric();
      if (!c) {
        toast.error("Biometric unlock failed");
        setMode("code");
        return;
      }
      await signInWithTenantCode(c);
    } finally {
      setBusy(false);
    }
  }

  function setDigit(i: number, value: string) {
    const ch = value.replace(/\D/g, "").slice(0, 1);
    const arr = code.padEnd(4, " ").split("");
    arr[i] = ch || " ";
    const next = arr.join("").replace(/\s+$/, "");
    setCode(next.trim());
    if (ch && i < 3) inputs.current[i + 1]?.focus();
    if (next.replace(/\s/g, "").length === 4) {
      void signInWithTenantCode(next.replace(/\s/g, ""));
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-between px-5 py-8 text-foreground">
      <Blobs />

      <header className="flex w-full max-w-md items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal/20 ring-1 ring-teal/40">
            <Sparkles className="h-4 w-4 text-teal" />
          </div>
          <span className="font-display font-bold tracking-tight">Makazi</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>End-to-end secure</span>
          <ArrowUpRight className="h-3 w-3" />
        </div>
      </header>

      <main className="flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
          {hasBio ? "Welcome back" : "Sign in"}
        </motion.div>

        <AnimatePresence mode="wait">
          {mode === "bio" ? (
            <motion.div
              key="bio"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="relative flex flex-col items-center gap-6"
            >
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                {[1, 2, 3].map((ring) => (
                  <motion.div
                    key={ring}
                    className="absolute rounded-full border border-teal/15"
                    style={{ width: 180 + ring * 70, height: 180 + ring * 70 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30 + ring * 10, repeat: Infinity, ease: "linear" }}
                  />
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.04 }}
                disabled={busy}
                onClick={handleBiometric}
                className="relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-full bg-teal/25 ring-1 ring-teal/60 teal-glow"
              >
                <motion.div
                  className="absolute inset-0 bg-teal/20"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.15, 0.4] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                />
                <Fingerprint className="relative z-10 h-20 w-20 text-foreground" strokeWidth={1.4} />
              </motion.button>
              <div className="text-center">
                <div className="font-semibold">Tap to enter</div>
                <div className="mt-1 text-xs text-muted-foreground">Face ID / Touch ID</div>
              </div>
              <div className="flex gap-2">
                <PhysicsButton variant="glass" size="sm" onClick={() => setMode("code")}>
                  <KeyRound className="h-3.5 w-3.5" /> Use code instead
                </PhysicsButton>
                <PhysicsButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearBiometric();
                    setMode("code");
                    toast.message("Biometric removed");
                  }}
                >
                  Reset
                </PhysicsButton>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-7"
            >
              <div className="text-center">
                <h1 className="font-display text-3xl font-bold">Enter your code</h1>
                <p className="mt-1.5 text-xs text-muted-foreground">4-digit access code</p>
              </div>
              <div className="flex gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    inputMode="numeric"
                    autoFocus={i === 0}
                    maxLength={1}
                    value={code[i] ?? ""}
                    onChange={(event) => setDigit(i, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Backspace" && !code[i] && i > 0) {
                        inputs.current[i - 1]?.focus();
                      }
                    }}
                    className="h-16 w-14 rounded-2xl glass text-center text-2xl font-display font-bold tracking-tight outline-none focus:ring-2 focus:ring-teal/60"
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {biometricsSupported() && (
                  <PhysicsButton
                    variant="glass"
                    size="sm"
                    onClick={async () => {
                      if (!code || code.length !== 4) {
                        toast.error("Enter your 4-digit code first");
                        return;
                      }
                      try {
                        await registerBiometric(code, "Apartment");
                        toast.success("Biometric enabled");
                        setMode("bio");
                      } catch (error: any) {
                        toast.error(error.message);
                      }
                    }}
                  >
                    <Fingerprint className="h-3.5 w-3.5" /> Enable biometrics
                  </PhysicsButton>
                )}
                {hasBio && (
                  <PhysicsButton variant="ghost" size="sm" onClick={() => setMode("bio")}>
                    Back
                  </PhysicsButton>
                )}
              </div>
              {busy && <div className="text-xs text-muted-foreground">Signing you in...</div>}
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      <footer className="w-full max-w-md text-center font-bold text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
  {new Date().getFullYear()} &copy; Makazi.
</footer>
    </div>
  );
}
