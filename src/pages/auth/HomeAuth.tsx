import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Building2, Home, Loader2 } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { Field, inputCls, PrimaryBtn } from "@/components/Modal";
import type { TenantLoginRef, Unit } from "@/lib/types";
import { tenantEmail, tenantSignupEmail } from "@/lib/tenantEmail";
import { toast } from "sonner";

type Flow = "login" | "signup";
type Actor = "tenant" | "management";
type ManagementRole = "owner" | "assistant";

const roleCopy = {
  owner: { label: "Owner", dataKey: "owner_code", placeholder: "OWNER2026" },
  assistant: { label: "Assistant", dataKey: "assistant_code", placeholder: "ASSISTANT2026" },
} as const;

export function HomeAuth({ initialFlow = "login" }: { initialFlow?: Flow }) {
  const nav = useNavigate();
  const [flow, setFlow] = useState<Flow>(initialFlow);
  const [actor, setActor] = useState<Actor>("tenant");
  const [managementRole, setManagementRole] = useState<ManagementRole>("owner");
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenant, setTenant] = useState({ unit_id: "", phone: "", full_name: "", password: "" });
  const [management, setManagement] = useState({ email: "", password: "", full_name: "", code: "" });
  const [rememberForWeek, setRememberForWeek] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ owner: true, assistant: true, loading: true });

  useEffect(() => {
    firebaseClient.from("units").select("*").order("floor").order("number").then(({ data }) => {
      setUnits(((data as Unit[]) ?? []).filter((unit) => unit.status !== "Vacant"));
    });
    firebaseClient.privilegedAccountStatus().then((next) => setStatus({ ...next, loading: false }));
  }, []);

  useEffect(() => {
    if (actor !== "management" || flow !== "signup") return;
    if (managementRole === "owner" && status.owner && !status.assistant) setManagementRole("assistant");
    if (managementRole === "assistant" && status.assistant && !status.owner) setManagementRole("owner");
  }, [actor, flow, managementRole, status]);

  const switchFlow = (next: Flow) => {
    setFlow(next);
    setActor("tenant");
  };

  const signInTenant = async () => {
    const unit = units.find((item) => item.id === tenant.unit_id);
    if (!unit) throw new Error("Select your unit.");

    const { data: loginRef } = await firebaseClient.from("tenant_logins").select("*").eq("id", unit.id).maybeSingle();
    const mappedEmail = (loginRef as TenantLoginRef | null)?.login_email;
    const email = mappedEmail || tenantEmail(unit.id);
    const { error } = await firebaseClient.auth.signInWithPassword({
      email,
      password: tenant.password,
      rememberForWeek,
    });
    if (error) throw error;
    nav({ to: "/tenant" });
  };

  const signUpTenant = async () => {
    const email = tenantSignupEmail(tenant.phone);
    const { error } = await firebaseClient.auth.signUp({
      email,
      password: tenant.password,
      rememberForWeek,
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
    nav({ to: "/tenant" });
  };

  const signInManagement = async () => {
    const { error } = await firebaseClient.auth.signInWithPassword({
      email: management.email,
      password: management.password,
      rememberForWeek,
    });
    if (error) throw error;
    nav({ to: "/dashboard" });
  };

  const signUpManagement = async () => {
    const copy = roleCopy[managementRole];
    const { error } = await firebaseClient.auth.signUp({
      email: management.email,
      password: management.password,
      rememberForWeek,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: management.full_name, [copy.dataKey]: management.code },
      },
    });
    if (error) throw error;
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
            {actor === "tenant" && flow === "login" && (
              <>
                <Field label="Your unit">
                  <select className={inputCls} value={tenant.unit_id} onChange={(e) => setTenant({ ...tenant, unit_id: e.target.value })} required>
                    <option value="">Select your unit...</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        Unit {unit.number} - {unit.bedrooms}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Password">
                  <input type="password" className={inputCls} value={tenant.password} onChange={(e) => setTenant({ ...tenant, password: e.target.value })} required />
                </Field>
              </>
            )}

            {actor === "tenant" && flow === "signup" && (
              <>
                <Field label="Full name">
                  <input className={inputCls} value={tenant.full_name} onChange={(e) => setTenant({ ...tenant, full_name: e.target.value })} required />
                </Field>
                <Field label="Phone number">
                  <input className={inputCls} value={tenant.phone} onChange={(e) => setTenant({ ...tenant, phone: e.target.value })} required placeholder="+254..." />
                </Field>
                <Field label="Password">
                  <input type="password" className={inputCls} value={tenant.password} onChange={(e) => setTenant({ ...tenant, password: e.target.value })} minLength={6} required />
                </Field>
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
                <Field label="Password">
                  <input type="password" className={inputCls} value={management.password} onChange={(e) => setManagement({ ...management, password: e.target.value })} minLength={6} required />
                </Field>
                {flow === "signup" && (
                  <Field label={`${roleCopy[managementRole].label} code`}>
                    <input className={inputCls} value={management.code} onChange={(e) => setManagement({ ...management, code: e.target.value })} placeholder={roleCopy[managementRole].placeholder} required />
                  </Field>
                )}
              </>
            )}

            <label className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
              <input type="checkbox" className="h-4 w-4" checked={rememberForWeek} onChange={(e) => setRememberForWeek(e.target.checked)} />
              Remember me for 1 week
            </label>

            {managementSignupClosed && (
              <div className="rounded-2xl bg-muted p-3 text-xs text-muted-foreground">
                This management account already exists. Please log in instead.
              </div>
            )}

            <PrimaryBtn type="submit" disabled={busy || managementSignupClosed || (actor === "management" && flow === "signup" && status.loading)}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : flow === "login" ? "Login" : "Create account"}
            </PrimaryBtn>

            <button
              type="button"
              onClick={() => setActor(actor === "tenant" ? "management" : "tenant")}
              className="text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              {actor === "tenant"
                ? flow === "login" ? "Sign in as management" : "Create management account"
                : flow === "login" ? "Back to tenant login" : "Back to tenant signup"}
            </button>
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
