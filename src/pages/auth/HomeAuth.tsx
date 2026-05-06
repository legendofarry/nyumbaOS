import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Building2, Home, Loader2, Fingerprint } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { Field, inputCls, PrimaryBtn } from "@/components/Modal";
import type { TenantLoginRef, Unit } from "@/lib/types";
import { tenantSignupEmail } from "@/lib/tenantEmail";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

type Flow = "login" | "signup";
type Actor = "tenant" | "management";
type ManagementRole = "owner" | "assistant";
const roleCopy = {
  owner: { label: "Owner", dataKey: "owner_code", placeholder: "OWNER2026" },
  assistant: { label: "Assistant", dataKey: "assistant_code", placeholder: "ASSISTANT2026" },
} as const;

export function HomeAuth({ initialFlow = "login" }: { initialFlow?: Flow }) {
  const nav = useNavigate();
  const { loading: authLoading, user, role } = useAuth();
  const [flow, setFlow] = useState<Flow>(initialFlow);
  const [actor, setActor] = useState<Actor>("tenant");
  const [tenantStep, setTenantStep] = useState<"entry" | "password" | "signup">("entry");
  const [tenantAuthEmail, setTenantAuthEmail] = useState<string | null>(null);
  const [detectedUnitId, setDetectedUnitId] = useState<string | null>(null);
  const [managementRole, setManagementRole] = useState<ManagementRole>("owner");
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenant, setTenant] = useState({ unit_id: "", phone: "+254", full_name: "", password: "" });
  const [management, setManagement] = useState({ email: "", password: "", full_name: "", code: "" });
  // remember-for-week removed — biometric used instead
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [managementBiometricAvailable, setManagementBiometricAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ owner: true, assistant: true, loading: true });

  useEffect(() => {
    firebaseClient.from("units").select("*").order("floor").order("number").then(({ data, error }: any) => {
      if (error) toast.error(error.message ?? "Could not load units");
      setUnits((data as Unit[]) ?? []);
    });
    firebaseClient.privilegedAccountStatus().then((next) => setStatus({ ...next, loading: false }));
  }, []);

  useEffect(() => {
    if (authLoading || !user || !role) return;
    nav({ to: role === "tenant" ? "/tenant" : "/dashboard", replace: true });
  }, [authLoading, user, role, nav]);

  useEffect(() => {
    if (actor !== "management" || flow !== "signup") return;
    if (status.owner && status.assistant) {
      setFlow("login");
      return;
    }
    if (managementRole === "owner" && status.owner && !status.assistant) setManagementRole("assistant");
    if (managementRole === "assistant" && status.assistant && !status.owner) setManagementRole("owner");
  }, [actor, flow, managementRole, status]);

  const switchFlow = (next: Flow) => {
    setFlow(next);
    setActor("tenant");
    setTenantStep(next === "signup" ? "signup" : "entry");
  };

  const signInTenant = async () => {
    if (!tenantAuthEmail) throw new Error("Please enter your phone and press Continue first.");
    const { error } = await firebaseClient.auth.signInWithPassword({
      email: tenantAuthEmail,
      password: tenant.password,
    });
    if (error) throw error;
    nav({ to: "/tenant" });
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const base64ToArrayBuffer = (b64: string) => {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  };

  const biometricSignIn = async (emailArg?: string) => {
    try {
      const email = emailArg ?? tenantAuthEmail ?? tenantSignupEmail(tenant.phone);
      const credKey = `nyumbaos:bio:credId:${email}`;
      const pwKey = `nyumbaos:bio:pw:${email}`;
      const b64 = localStorage.getItem(credKey);
      const pw = localStorage.getItem(pwKey);
      if (!b64 || !pw) throw new Error("No biometric credentials found for this account.");
      if (!window.PublicKeyCredential) throw new Error("Biometric authentication not supported on this device.");

      const publicKey: any = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ id: base64ToArrayBuffer(b64), type: "public-key" }],
        userVerification: "required",
        timeout: 60000,
      };

      // trigger platform authenticator (fingerprint/pin)
      const assertion = await (navigator.credentials as any).get({ publicKey });
      if (!assertion) throw new Error("Authentication failed");

      // use stored password to sign in
      const { error } = await firebaseClient.auth.signInWithPassword({ email, password: pw });
      if (error) throw error;
      // redirect based on role (best-effort)
      const roleRes = await firebaseClient.auth.getUser();
      const userEmail = roleRes?.data?.user?.email ?? email;
      // navigate to tenant by default — backend auth state will redirect appropriately via useAuth effect
      nav({ to: "/tenant" });
    } catch (err: any) {
      toast.error(err?.message ?? "Biometric sign-in failed");
    }
  };

  const getSavedBiometricEmails = () => {
    const emails: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith("nyumbaos:bio:credId:")) {
        emails.push(key.replace("nyumbaos:bio:credId:", ""));
      }
    }
    return emails;
  };

  const handleBiometricClick = async () => {
    try {
      if (!window.PublicKeyCredential) { toast.error("Biometric authentication not supported on this device."); return; }
      const saved = getSavedBiometricEmails();
      if (!saved.length) {
        toast.error("No biometric credentials saved for this device. Please sign in manually.");
        return;
      }

      let chosenEmail: string | null = null;
      if (actor === "tenant") {
        // prefer matching tenant phone if present
        try {
          const normalized = normalizePhoneToPlus254(tenant.phone || "");
          const candidate = tenantSignupEmail(normalized);
          if (saved.includes(candidate)) chosenEmail = candidate;
        } catch {}
        if (!chosenEmail) chosenEmail = saved[0];
      } else {
        // management: prefer typed email if it matches saved creds
        if (management.email && saved.includes(management.email)) chosenEmail = management.email;
        if (!chosenEmail) chosenEmail = saved[0];
      }

      if (!chosenEmail) { toast.error("No biometric credential found for this user. Please sign in manually."); return; }
      await biometricSignIn(chosenEmail);
    } catch (err: any) {
      toast.error(err?.message ?? "Biometric sign-in failed");
    }
  };

  const MAX_LOCAL_DIGITS = 9;
  const normalizePhoneToPlus254 = (raw: string) => {
    const digits = String(raw ?? "").replace(/\D/g, "");
    let d = digits;
    if (d.startsWith("254")) d = d.slice(3);
    if (d.startsWith("0")) d = d.replace(/^0+/, "");
    // cap to allowed local digits
    d = d.slice(0, MAX_LOCAL_DIGITS);
    return "+254" + d;
  };

  const checkTenantStatus = async () => {
    if (!tenant.phone.trim()) {
      toast.error("Enter a phone number");
      return;
    }
    setBusy(true);
    try {
      const input = tenant.phone.trim();
      const normalized = normalizePhoneToPlus254(input);
      // ensure the local digits are complete
      const localDigits = normalized.replace(/\D/g, "").slice(3);
      if (localDigits.length < MAX_LOCAL_DIGITS) {
        toast.error("Enter a full phone number");
        setTenant((t) => ({ ...t, phone: normalized }));
        setBusy(false);
        return;
      }
      setTenant((t) => ({ ...t, phone: normalized }));
      const email = tenantSignupEmail(normalized);
      // check for biometric credential for this email
      setBiometricAvailable(Boolean(localStorage.getItem(`nyumbaos:bio:credId:${email}`)));
      const { data: profile } = await firebaseClient.from("profiles").select("*").eq("login_email", email).maybeSingle();
      if (profile) {
        const prof: any = profile;
        if (prof.unit_id) {
          const { data: loginRef } = await firebaseClient.from("tenant_logins").select("*").eq("id", prof.unit_id).maybeSingle();
          const mappedEmail = (loginRef as TenantLoginRef | null)?.login_email ?? prof.login_email ?? email;
          setTenantAuthEmail(mappedEmail);
          setDetectedUnitId(prof.unit_id ?? null);
          setTenantStep("password");
          return;
        }

        // Account exists but not attached to a unit (waiting)
        setTenantAuthEmail((profile as any).login_email ?? email);
        setTenantStep("password");
        toast.success("Account found — enter your password to sign in");
        return;
      }

      // No account — switch to signup
      setTenantAuthEmail(null);
      setTenantStep("signup");
      setFlow("signup");
    } catch (err: any) {
      toast.error(err.message ?? "Could not check tenant status");
    } finally {
      setBusy(false);
    }
  };

  const signUpTenant = async () => {
    const normalized = normalizePhoneToPlus254(tenant.phone);
    const localDigits = normalized.replace(/\D/g, "").slice(3);
    if (localDigits.length < MAX_LOCAL_DIGITS) throw new Error("Enter a full phone number");
    const email = tenantSignupEmail(normalized);
    // duplication check: ensure a profile with this login email does not already exist
    const { data: existing } = await firebaseClient.from("profiles").select("*").eq("login_email", email).maybeSingle();
    if (existing) throw new Error("An account already exists for this phone. Try signing in.");
    const { error } = await firebaseClient.auth.signUp({
      email,
      password: tenant.password,
      options: {
        emailRedirectTo: `${window.location.origin}/tenant`,
        data: {
          account_type: "tenant",
          full_name: tenant.full_name,
          phone: tenant.phone,
        },
      },
    });
    if (error) throw error;
    // prompt later in the tenant shell to enable biometrics — stash pending creds
    try { localStorage.setItem("nyumbaos:bio:pending", JSON.stringify({ email, password: tenant.password })); } catch {}
    nav({ to: "/tenant" });
  };

  const signInManagement = async () => {
    const { error } = await firebaseClient.auth.signInWithPassword({
      email: management.email,
      password: management.password,
    });
    if (error) throw error;
    nav({ to: "/dashboard" });
  };

  useEffect(() => {
    // update biometric availability for management email
    if (!management.email) { setManagementBiometricAvailable(false); return; }
    const key = `nyumbaos:bio:credId:${management.email}`;
    setManagementBiometricAvailable(Boolean(localStorage.getItem(key)));
  }, [management.email]);

  const signUpManagement = async () => {
    const copy = roleCopy[managementRole];
    const { error } = await firebaseClient.auth.signUp({
      email: management.email,
      password: management.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: management.full_name, [copy.dataKey]: management.code },
      },
    });
    if (error) throw error;
    try { localStorage.setItem("nyumbaos:bio:pending", JSON.stringify({ email: management.email, password: management.password })); } catch {}
    nav({ to: "/dashboard" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (actor === "tenant" && flow === "login") await signInTenant();
      if (actor === "tenant" && flow === "signup") await signUpTenant();
      if (actor === "management" && flow === "login") await signInManagement();
      if (actor === "management" && flow === "signup") await signUpManagement();
    } catch (err: any) {
      toast.error(err.message ?? "Could not continue");
    } finally {
      setBusy(false);
    }
  };

  const managementSignupClosed =
    actor === "management" &&
    flow === "signup" &&
    ((managementRole === "owner" && status.owner) || (managementRole === "assistant" && status.assistant));
  const allManagementAccountsExist = !status.loading && status.owner && status.assistant;

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <motion.div layout className="w-full max-w-md tile p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-foreground text-background grid place-items-center">
            {actor === "tenant" ? <Home className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
          </div>
          <div>
            <div className="font-black text-xl">NyumbaOS</div>
            <div className="text-xs text-muted-foreground">{actor === "tenant" ? "Tenant access" : "Management access"}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3 p-1 bg-muted rounded-2xl">
          {(["login", "signup"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => switchFlow(item)}
              className={`py-2 rounded-xl text-sm font-bold capitalize ${flow === item ? "bg-foreground text-background" : "text-muted-foreground"}`}
            >
              {item === "login" ? "Login" : "Sign up"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={`${flow}-${actor}-${managementRole}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            onSubmit={submit}
            className="flex flex-col gap-4"
          >
            {actor === "tenant" && (flow === "login" || flow === "signup") && (
              <>
                {tenantStep === "entry" && (
                  <>
                    <Field label="Phone number">
                      <input
                        type="tel"
                        inputMode="tel"
                        maxLength={13}
                        className={inputCls}
                        value={tenant.phone}
                        onChange={(e) => setTenant({ ...tenant, phone: normalizePhoneToPlus254(e.target.value) })}
                        placeholder="+2547..."
                      />
                    </Field>
                    <div className="flex items-center gap-3">
                      <PrimaryBtn type="button" onClick={checkTenantStatus} disabled={busy}>
                        {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Continue"}
                      </PrimaryBtn>
                    </div>
                    <div className="mt-3 flex justify-center">
                      <button type="button" onClick={() => handleBiometricClick()} title="Sign in with fingerprint" className="h-10 w-10 rounded-xl bg-muted grid place-items-center">
                        <Fingerprint className="h-5 w-5" />
                      </button>
                    </div>
                  </>
                )}

                {tenantStep === "password" && (
                  <>
                    <div className="text-sm text-muted-foreground">{detectedUnitId ? `Sign in to unit ${units.find((u) => u.id === detectedUnitId)?.number ?? detectedUnitId}` : "Sign in to your account"}</div>
                    <Field label="Phone number">
                      <input
                        type="tel"
                        inputMode="tel"
                        maxLength={13}
                        className={inputCls}
                        value={tenant.phone}
                        onChange={(e) => setTenant({ ...tenant, phone: normalizePhoneToPlus254(e.target.value) })}
                        placeholder="+2547..."
                      />
                    </Field>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Field label="Password">
                          <input type="password" className={inputCls} value={tenant.password} onChange={(e) => setTenant({ ...tenant, password: e.target.value })} required />
                        </Field>
                      </div>
                      
                    </div>
                  </>
                )}

                {tenantStep === "signup" && (
                  <>
                    <Field label="Full name">
                      <input className={inputCls} value={tenant.full_name} onChange={(e) => setTenant({ ...tenant, full_name: e.target.value })} required />
                    </Field>
                    <Field label="Phone number">
                      <input
                        type="tel"
                        inputMode="tel"
                        maxLength={13}
                        className={inputCls}
                        value={tenant.phone}
                        onChange={(e) => setTenant({ ...tenant, phone: normalizePhoneToPlus254(e.target.value) })}
                        required
                        placeholder="+2547..."
                      />
                    </Field>
                    <Field label="Password">
                      <input type="password" className={inputCls} value={tenant.password} onChange={(e) => setTenant({ ...tenant, password: e.target.value })} minLength={6} required />
                    </Field>
                  </>
                )}
              </>
            )}

            

            {actor === "management" && flow === "signup" && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-2xl">
                {(["owner", "assistant"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setManagementRole(item)}
                    disabled={(item === "owner" && status.owner) || (item === "assistant" && status.assistant)}
                    className={`py-2 rounded-xl text-sm font-bold disabled:opacity-40 ${managementRole === item ? "bg-foreground text-background" : "text-muted-foreground"}`}
                  >
                    {roleCopy[item].label}
                  </button>
                ))}
              </div>
            )}

            {actor === "management" && (
              <>
                {flow === "signup" && (
                  <Field label="Full name">
                    <input className={inputCls} value={management.full_name} onChange={(e) => setManagement({ ...management, full_name: e.target.value })} required />
                  </Field>
                )}
                <Field label="Email">
                  <input type="email" className={inputCls} value={management.email} onChange={(e) => setManagement({ ...management, email: e.target.value })} required />
                </Field>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Field label="Password">
                      <input type="password" className={inputCls} value={management.password} onChange={(e) => setManagement({ ...management, password: e.target.value })} minLength={6} required />
                    </Field>
                  </div>
                  
                </div>
                {flow === "signup" && (
                  <Field label={`${roleCopy[managementRole].label} code`}>
                    <input className={inputCls} value={management.code} onChange={(e) => setManagement({ ...management, code: e.target.value })} placeholder={roleCopy[managementRole].placeholder} required />
                  </Field>
                )}
              </>
            )}

            {/* remember-me removed */}

            {managementSignupClosed && (
              <div className="rounded-2xl bg-muted p-3 text-xs text-muted-foreground">
                This management account already exists. Please log in instead.
              </div>
            )}

            {!(actor === "tenant" && flow === "login" && tenantStep === "entry") && (
              <PrimaryBtn type="submit" disabled={busy || managementSignupClosed || (actor === "management" && flow === "signup" && status.loading)}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : flow === "login" ? "Login" : "Create account"}
              </PrimaryBtn>
            )}

            {!(actor === "tenant" && flow === "signup" && allManagementAccountsExist) && (
              <button
                type="button"
                onClick={() => setActor(actor === "tenant" ? "management" : "tenant")}
                className="text-sm font-bold text-muted-foreground hover:text-foreground"
              >
                {actor === "tenant"
                  ? flow === "login" ? "Sign in as management" : allManagementAccountsExist ? "Sign in as management" : "Create management account"
                  : flow === "login" ? "Back to tenant login" : "Back to tenant signup"}
              </button>
            )}
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
