import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Fingerprint, Home, Loader2 } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { Field, inputCls, PrimaryBtn } from "@/components/Modal";
import { canUseDeviceCredentials, saveDeviceCredential } from "@/lib/deviceCredentials";
import { tenantSignupEmail } from "@/lib/tenantEmail";
import { toast } from "sonner";

export function TenantSignup() {
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", phone: "", password: "" });
  const [rememberForWeek, setRememberForWeek] = useState(false);
  const [enableDeviceLogin, setEnableDeviceLogin] = useState(false);
  const [busy, setBusy] = useState(false);
  const showDeviceLogin = canUseDeviceCredentials();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const email = tenantSignupEmail(form.phone);

    try {
      const { error } = await firebaseClient.auth.signUp({
        email,
        password: form.password,
        rememberForWeek,
        options: {
          emailRedirectTo: `${window.location.origin}/tenant`,
          data: {
            account_type: "tenant",
            full_name: form.full_name,
            phone: form.phone,
          },
        },
      });
      if (error) throw error;

      if (enableDeviceLogin) {
        try {
          await saveDeviceCredential({ email, password: form.password, name: form.full_name });
        } catch {
          toast.warning("Account created, but this browser could not save device login.");
        }
      }

      toast.success("Account created");
      nav({ to: "/tenant" });
    } catch (err: any) {
      toast.error(err.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md tile p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-foreground text-background grid place-items-center">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <div className="font-black text-xl">Create tenant account</div>
            <div className="text-xs text-muted-foreground">You will wait for unit assignment</div>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Full name">
            <input className={inputCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </Field>
          <Field label="Phone number">
            <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="+254..." />
          </Field>
          <Field label="Password">
            <input
              type="password"
              className={inputCls}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </Field>

          <label className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
            <input type="checkbox" className="h-4 w-4" checked={rememberForWeek} onChange={(e) => setRememberForWeek(e.target.checked)} />
            Remember me for 1 week
          </label>

          {showDeviceLogin && (
            <label className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
              <input type="checkbox" className="h-4 w-4" checked={enableDeviceLogin} onChange={(e) => setEnableDeviceLogin(e.target.checked)} />
              <Fingerprint className="h-4 w-4" />
              Save device login for biometrics
            </label>
          )}

          <PrimaryBtn type="submit" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Create account"}
          </PrimaryBtn>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-foreground hover:underline">Sign in</Link>
          <br />
          Owner or assistant?{" "}
          <Link to="/auth" search={{ mode: "signup" }} className="font-bold text-foreground hover:underline">Create privileged account</Link>
        </p>
      </motion.div>
    </div>
  );
}
