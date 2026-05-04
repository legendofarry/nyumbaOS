import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Ticket, Loader2, ArrowRight } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { Field, inputCls, PrimaryBtn } from "@/components/Modal";
import { toast } from "sonner";
import { tenantEmail } from "@/lib/tenantEmail";
import { canUseDeviceCredentials, saveDeviceCredential } from "@/lib/deviceCredentials";

export function TenantAcceptInvite() {
  const nav = useNavigate();
  const search = useSearch({ strict: false }) as { code?: string };
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState(search.code ?? "");
  const [invite, setInvite] = useState<{ id: string; unit_id: string; unit_number: string; full_name: string; used: boolean } | null>(null);
  const [password, setPassword] = useState("");
  const [rememberForWeek, setRememberForWeek] = useState(false);
  const [enableDeviceLogin, setEnableDeviceLogin] = useState(false);
  const [busy, setBusy] = useState(false);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await firebaseClient.rpc("lookup_invite", { _code: code.trim() });
      if (error) throw error;
      const inv = (data as any[])?.[0];
      if (!inv) { toast.error("Invalid invite code"); return; }
      if (inv.used) { toast.error("This invite has already been used"); return; }
      setInvite(inv);
      setStep(2);
    } catch (err: any) {
      toast.error(err.message ?? "Lookup failed");
    } finally {
      setBusy(false);
    }
  };

  const accept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;
    setBusy(true);
    try {
      const email = tenantEmail(invite.unit_id);
      const { error } = await firebaseClient.auth.signUp({
        email,
        password,
        rememberForWeek,
        options: {
          emailRedirectTo: `${window.location.origin}/tenant`,
          data: { invite_code: code.trim(), full_name: invite.full_name },
        },
      });
      if (error) throw error;
      if (enableDeviceLogin) {
        try {
          await saveDeviceCredential({ email, password, name: invite.full_name });
        } catch {
          toast.warning("Account created, but this browser could not save device login.");
        }
      }
      toast.success("Welcome! You're all set.");
      nav({ to: "/tenant" });
    } catch (err: any) {
      toast.error(err.message ?? "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  const showDeviceLogin = canUseDeviceCredentials();

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md tile p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-foreground text-background grid place-items-center">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <div className="font-black text-xl">Accept invite</div>
            <div className="text-xs text-muted-foreground">Tenant onboarding</div>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={lookup} className="flex flex-col gap-4">
            <Field label="Invite code">
              <input className={`${inputCls} uppercase tracking-widest font-mono`} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX" required />
            </Field>
            <PrimaryBtn type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : <span className="inline-flex items-center gap-2 justify-center">Continue <ArrowRight className="h-4 w-4" /></span>}
            </PrimaryBtn>
          </form>
        ) : (
          <form onSubmit={accept} className="flex flex-col gap-4">
            <div className="bg-muted rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">You're joining</div>
              <div className="font-black text-lg mt-1">Unit {invite?.unit_number}</div>
              <div className="text-sm text-muted-foreground">{invite?.full_name}</div>
            </div>
            <Field label="Choose a password">
              <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoComplete="new-password" />
            </Field>
            <label className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={rememberForWeek}
                onChange={(e) => setRememberForWeek(e.target.checked)}
              />
              Remember me for 1 week
            </label>
            {showDeviceLogin && (
              <label className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={enableDeviceLogin}
                  onChange={(e) => setEnableDeviceLogin(e.target.checked)}
                />
                Save device login for biometrics
              </label>
            )}
            <PrimaryBtn type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Create my account"}
            </PrimaryBtn>
          </form>
        )}

        <p className="text-xs text-muted-foreground text-center mt-6">
          Already registered? <Link to="/login" className="font-bold text-foreground hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
