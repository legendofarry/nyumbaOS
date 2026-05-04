import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Fingerprint, Home, Loader2 } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { Field, inputCls, PrimaryBtn } from "@/components/Modal";
import { toast } from "sonner";
import type { TenantLoginRef, Unit } from "@/lib/types";
import { tenantEmail } from "@/lib/tenantEmail";
import { canUseDeviceCredentials, getDeviceCredential } from "@/lib/deviceCredentials";

export function TenantLogin() {
  const nav = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitId, setUnitId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberForWeek, setRememberForWeek] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    firebaseClient.from("units").select("*").order("floor").order("number").then(({ data }) => {
      setUnits(((data as Unit[]) ?? []).filter((unit) => unit.status !== "Vacant"));
    });
  }, []);

  const signIn = async (email: string, nextPassword: string) => {
    const { error } = await firebaseClient.auth.signInWithPassword({
      email,
      password: nextPassword,
      rememberForWeek,
    });
    if (error) throw error;
    nav({ to: "/tenant" });
  };

  const signInWithDevice = async () => {
    setBusy(true);
    try {
      const credential = await getDeviceCredential();
      if (!credential) {
        toast.error("No saved device login found.");
        return;
      }

      await signIn(credential.email, credential.password);
    } catch (err: any) {
      toast.error(err.message ?? "Device login failed");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const unit = units.find((u) => u.id === unitId);
    if (!unit) {
      toast.error("Pick your unit");
      return;
    }

    setBusy(true);
    try {
      const { data: loginRef } = await firebaseClient.from("tenant_logins").select("*").eq("id", unit.id).maybeSingle();
      const mappedEmail = (loginRef as TenantLoginRef | null)?.login_email;

      if (mappedEmail) {
        await signIn(mappedEmail, password);
      } else {
        try {
          await signIn(tenantEmail(unit.id), password);
        } catch (primaryError) {
          if (tenantEmail(unit.id) === tenantEmail(unit.number)) throw primaryError;
          await signIn(tenantEmail(unit.number), password);
        }
      }
    } catch (err: any) {
      toast.error(err.message ?? "Sign in failed");
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
            <Home className="h-5 w-5" />
          </div>
          <div>
            <div className="font-black text-xl">Welcome back</div>
            <div className="text-xs text-muted-foreground">Tenant sign in</div>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Your unit">
            <select className={inputCls} value={unitId} onChange={(e) => setUnitId(e.target.value)} required>
              <option value="">Select your unit...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  Unit {u.number} - {u.floor === 0 ? "Ground" : "First"} floor - {u.bedrooms}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Password">
            <input
              type="password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
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

          <PrimaryBtn type="submit" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Sign in"}
          </PrimaryBtn>

          {showDeviceLogin && (
            <button
              type="button"
              onClick={signInWithDevice}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm font-bold disabled:opacity-50"
            >
              <Fingerprint className="h-4 w-4" />
              Use saved device login
            </button>
          )}
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          New tenant?{" "}
          <Link to="/signup" className="font-bold text-foreground hover:underline">Create account</Link>
          <br />
          Got an invite code?{" "}
          <Link to="/tenant-accept" className="font-bold text-foreground hover:underline">Set password</Link>
          <br />
          Owner?{" "}
          <Link to="/auth" className="font-bold text-foreground hover:underline">Sign in here</Link>
        </p>
      </motion.div>
    </div>
  );
}
