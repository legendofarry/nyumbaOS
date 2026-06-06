import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, ArrowUpRight, KeyRound, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/client";
import { ensureOwner } from "@/lib/apt.functions";
import { useServerFn } from "@tanstack/react-start";
import { emailForCode, passwordForCode } from "@/lib/codes";
import { biometricsSupported, getStoredBiometric, unlockWithBiometric, registerBiometric, clearBiometric } from "@/lib/biometrics";
import { Blobs } from "@/components/Blobs";
import { PhysicsButton } from "@/components/PhysicsButton";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Welcome — Apartment" },
      { name: "description", content: "Modern apartment app for tenants and owner." },
    ],
  }),
  component: LoginScreen,
});

function LoginScreen() {
  const navigate = useNavigate();
  const ensure = useServerFn(ensureOwner);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"bio" | "code">(getStoredBiometric() ? "bio" : "code");
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const hasBio = !!getStoredBiometric();

  useEffect(() => { ensure({ data: undefined as never }).catch(() => {}); }, [ensure]);

  // If already signed in, redirect
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  async function signInWithCode(c: string) {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailForCode(c),
        password: passwordForCode(c),
      });
      if (error) throw error;
      toast.success("Welcome back");
      navigate({ to: "/app" });
    } catch (e: any) {
      toast.error(e.message || "Invalid code");
    } finally { setBusy(false); }
  }

  async function handleBiometric() {
    setBusy(true);
    try {
      const c = await unlockWithBiometric();
      if (!c) { toast.error("Biometric unlock failed"); setMode("code"); return; }
      await signInWithCode(c);
    } finally { setBusy(false); }
  }

  function setDigit(i: number, v: string) {
    const ch = v.replace(/\D/g, "").slice(0, 1);
    const arr = code.padEnd(4, " ").split("");
    arr[i] = ch || " ";
    const next = arr.join("").replace(/\s+$/, "");
    setCode(next.trim());
    if (ch && i < 3) inputs.current[i + 1]?.focus();
    if (next.replace(/\s/g, "").length === 4) {
      void signInWithCode(next.replace(/\s/g, ""));
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-between px-5 py-8 text-foreground relative">
      <Blobs />

      <header className="w-full max-w-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-teal/20 ring-1 ring-teal/40 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-teal" />
          </div>
          <span className="font-display font-bold tracking-tight">Apartment</span>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span>End-to-end secure</span><ArrowUpRight className="h-3 w-3" />
        </div>
      </header>

      <main className="w-full max-w-md flex-1 flex flex-col items-center justify-center gap-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-full px-3.5 py-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
          {hasBio ? "Welcome back" : "Sign in"}
        </motion.div>

        <AnimatePresence mode="wait">
          {mode === "bio" ? (
            <motion.div key="bio" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="relative flex flex-col items-center gap-6">
              {/* orbit rings */}
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                {[1,2,3].map((r) => (
                  <motion.div key={r}
                    className="absolute rounded-full border border-teal/15"
                    style={{ width: 180 + r*70, height: 180 + r*70 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30 + r*10, repeat: Infinity, ease: "linear" }}
                  />
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.04 }}
                disabled={busy}
                onClick={handleBiometric}
                className="h-44 w-44 rounded-full bg-teal/25 ring-1 ring-teal/60 teal-glow flex items-center justify-center relative overflow-hidden"
              >
                <motion.div className="absolute inset-0 bg-teal/20"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.15, 0.4] }}
                  transition={{ duration: 2.4, repeat: Infinity }} />
                <Fingerprint className="h-20 w-20 text-foreground relative z-10" strokeWidth={1.4} />
              </motion.button>
              <div className="text-center">
                <div className="font-semibold">Tap to enter</div>
                <div className="text-xs text-muted-foreground mt-1">Face ID · Touch ID</div>
              </div>
              <div className="flex gap-2">
                <PhysicsButton variant="glass" size="sm" onClick={() => setMode("code")}><KeyRound className="h-3.5 w-3.5" /> Use code instead</PhysicsButton>
                <PhysicsButton variant="ghost" size="sm" onClick={() => { clearBiometric(); setMode("code"); toast.message("Biometric removed"); }}>Reset</PhysicsButton>
              </div>
            </motion.div>
          ) : (
            <motion.div key="code" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-7">
              <div className="text-center">
                <h1 className="text-3xl font-display font-bold">Enter your code</h1>
                <p className="text-xs text-muted-foreground mt-1.5">4-digit access code from the owner</p>
              </div>
              <div className="flex gap-3">
                {[0,1,2,3].map((i) => (
                  <input
                    key={i}
                    ref={(el) => { inputs.current[i] = el; }}
                    inputMode="numeric"
                    autoFocus={i === 0}
                    maxLength={1}
                    value={code[i] ?? ""}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !code[i] && i > 0) inputs.current[i-1]?.focus();
                    }}
                    className="h-16 w-14 rounded-2xl glass text-center text-2xl font-display font-bold tracking-tight outline-none focus:ring-2 focus:ring-teal/60"
                  />
                ))}
              </div>
              <div className="flex gap-2 items-center">
                {biometricsSupported() && (
                  <PhysicsButton variant="glass" size="sm" onClick={async () => {
                    if (!code || code.length !== 4) { toast.error("Enter your 4-digit code first"); return; }
                    try {
                      await registerBiometric(code, "Apartment");
                      toast.success("Biometric enabled");
                      setMode("bio");
                    } catch (e: any) { toast.error(e.message); }
                  }}><Fingerprint className="h-3.5 w-3.5" /> Enable biometrics</PhysicsButton>
                )}
                {hasBio && <PhysicsButton variant="ghost" size="sm" onClick={() => setMode("bio")}>Back</PhysicsButton>}
              </div>
              {busy && <div className="text-xs text-muted-foreground">Signing you in…</div>}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="w-full max-w-md text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
        Private by design · KSh
      </footer>
    </div>
  );
}
