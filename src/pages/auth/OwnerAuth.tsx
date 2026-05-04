import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Building2, Fingerprint, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { Field, inputCls, PrimaryBtn } from "@/components/Modal";
import {
  canUseDeviceCredentials,
  getDeviceCredential,
  saveDeviceCredential,
} from "@/lib/deviceCredentials";
import { toast } from "sonner";

type AuthMode = "login" | "owner" | "assistant";

const ROLE_COPY = {
  owner: {
    label: "Create owner",
    title: "Owner code",
    placeholder: "OWNER2026",
    dataKey: "owner_code",
    success: "Owner account created",
  },
  assistant: {
    label: "Create assistant",
    title: "Assistant code",
    placeholder: "ASSISTANT2026",
    dataKey: "assistant_code",
    success: "Owner assistant account created",
  },
} as const;

export function OwnerAuth() {
  const nav = useNavigate();
  const search = useSearch({ strict: false }) as { mode?: string };
  const [mode, setMode] = useState<AuthMode>(search.mode === "signup" ? "owner" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [rememberForWeek, setRememberForWeek] = useState(false);
  const [enableDeviceLogin, setEnableDeviceLogin] = useState(false);
  const [status, setStatus] = useState({ owner: true, assistant: true, loading: true });
  const [busy, setBusy] = useState(false);

  const availableModes = useMemo(() => {
    const modes: AuthMode[] = ["login"];
    if (!status.owner) modes.push("owner");
    if (!status.assistant) modes.push("assistant");
    return modes;
  }, [status.owner, status.assistant]);

  useEffect(() => {
    let alive = true;

    firebaseClient
      .privilegedAccountStatus()
      .then((next) => {
        if (!alive) return;
        setStatus({ ...next, loading: false });

        if (mode === "owner" && next.owner) setMode("login");
        if (mode === "assistant" && next.assistant) setMode("login");
      })
      .catch(() => {
        if (alive) setStatus({ owner: true, assistant: true, loading: false });
      });

    return () => {
      alive = false;
    };
  }, [mode]);

  const signIn = async (loginEmail = email, loginPassword = password) => {
    const { error } = await firebaseClient.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
      rememberForWeek,
    });
    if (error) throw error;
    nav({ to: "/" });
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
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn();
        return;
      }

      const copy = ROLE_COPY[mode];
      const { error } = await firebaseClient.auth.signUp({
        email,
        password,
        rememberForWeek,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: name, [copy.dataKey]: code },
        },
      });
      if (error) throw error;

      if (enableDeviceLogin) {
        try {
          await saveDeviceCredential({ email, password, name });
        } catch {
          toast.warning("Account created, but this browser could not save device login.");
        }
      }

      toast.success(copy.success);
      nav({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  const signupMode = mode === "owner" || mode === "assistant" ? mode : null;
  const signupCopy = signupMode ? ROLE_COPY[signupMode] : null;
  const showDeviceLogin = canUseDeviceCredentials();

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md tile p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-foreground text-background grid place-items-center">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="font-black text-xl">PropertyHQ</div>
            <div className="text-xs text-muted-foreground">Owner portal</div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-muted rounded-2xl">
          {availableModes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold ${mode === item ? "bg-foreground text-background" : "text-muted-foreground"}`}
              disabled={status.loading}
            >
              {item === "login" ? "Sign in" : ROLE_COPY[item].label}
            </button>
          ))}
        </div>

        {status.loading ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            {signupMode && (
              <Field label="Full name">
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
            )}

            <Field label="Email">
              <input
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={signupMode ? "new-password" : "current-password"}
              />
            </Field>

            {signupCopy && (
              <Field label={signupCopy.title}>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    className={`${inputCls} pl-11`}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={signupCopy.placeholder}
                    required
                  />
                </div>
              </Field>
            )}

            <label className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={rememberForWeek}
                onChange={(e) => setRememberForWeek(e.target.checked)}
              />
              Remember me for 1 week
            </label>

            {signupMode && showDeviceLogin && (
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
              {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : mode === "login" ? "Sign in" : "Create account"}
            </PrimaryBtn>

            {mode === "login" && showDeviceLogin && (
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

            {status.owner && status.assistant && (
              <div className="flex items-center gap-2 rounded-2xl bg-muted p-3 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Owner and assistant accounts already exist. Only sign-in is available.
              </div>
            )}
          </form>
        )}

        <p className="text-xs text-muted-foreground text-center mt-6">
          Tenant?{" "}
          <Link to="/login" className="font-bold text-foreground hover:underline">Sign in here</Link>
          {" . "}
          <Link to="/signup" className="font-bold text-foreground hover:underline">Create tenant account</Link>
        </p>
      </motion.div>
    </div>
  );
}
