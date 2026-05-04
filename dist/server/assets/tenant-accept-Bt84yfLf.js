import { r as reactExports, W as jsxRuntimeExports } from "./worker-entry-B4jK-wDu.js";
import { c as createLucideIcon, a as useNavigate, b as useSearch, m as motion, L as LoaderCircle, d as Link, f as firebaseClient, t as toast } from "./router-DRMkp4_G.js";
import { F as Field, i as inputCls, P as PrimaryBtn } from "./Modal-8BinRw0y.js";
import { t as tenantEmail } from "./tenantEmail-DWSiCO4G.js";
import { c as canUseDeviceCredentials, s as saveDeviceCredential } from "./deviceCredentials-4GYlRYFK.js";
import { T as Ticket } from "./ticket-Ch0cwBcx.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./x-DMSthfi5.js";
const __iconNode = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "m12 5 7 7-7 7", key: "xquz4c" }]
];
const ArrowRight = createLucideIcon("arrow-right", __iconNode);
function TenantAcceptInvite() {
  const nav = useNavigate();
  const search = useSearch({ strict: false });
  const [step, setStep] = reactExports.useState(1);
  const [code, setCode] = reactExports.useState(search.code ?? "");
  const [invite, setInvite] = reactExports.useState(null);
  const [password, setPassword] = reactExports.useState("");
  const [rememberForWeek, setRememberForWeek] = reactExports.useState(false);
  const [enableDeviceLogin, setEnableDeviceLogin] = reactExports.useState(false);
  const [busy, setBusy] = reactExports.useState(false);
  const lookup = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await firebaseClient.rpc("lookup_invite", { _code: code.trim() });
      if (error) throw error;
      const inv = data?.[0];
      if (!inv) {
        toast.error("Invalid invite code");
        return;
      }
      if (inv.used) {
        toast.error("This invite has already been used");
        return;
      }
      setInvite(inv);
      setStep(2);
    } catch (err) {
      toast.error(err.message ?? "Lookup failed");
    } finally {
      setBusy(false);
    }
  };
  const accept = async (e) => {
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
          data: { invite_code: code.trim(), full_name: invite.full_name }
        }
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
    } catch (err) {
      toast.error(err.message ?? "Could not create account");
    } finally {
      setBusy(false);
    }
  };
  const showDeviceLogin = canUseDeviceCredentials();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen grid place-items-center bg-background p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, className: "w-full max-w-md tile p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-2xl bg-foreground text-background grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ticket, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-black text-xl", children: "Accept invite" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Tenant onboarding" })
      ] })
    ] }),
    step === 1 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: lookup, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Invite code", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: `${inputCls} uppercase tracking-widest font-mono`, value: code, onChange: (e) => setCode(e.target.value.toUpperCase()), placeholder: "XXXX-XXXX", required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryBtn, { type: "submit", disabled: busy, children: busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mx-auto" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2 justify-center", children: [
        "Continue ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
      ] }) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: accept, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted rounded-2xl p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-widest text-muted-foreground", children: "You're joining" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-black text-lg mt-1", children: [
          "Unit ",
          invite?.unit_number
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: invite?.full_name })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Choose a password", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", className: inputCls, value: password, onChange: (e) => setPassword(e.target.value), minLength: 6, required: true, autoComplete: "new-password" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 text-sm font-semibold text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            className: "h-4 w-4",
            checked: rememberForWeek,
            onChange: (e) => setRememberForWeek(e.target.checked)
          }
        ),
        "Remember me for 1 week"
      ] }),
      showDeviceLogin && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 text-sm font-semibold text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            className: "h-4 w-4",
            checked: enableDeviceLogin,
            onChange: (e) => setEnableDeviceLogin(e.target.checked)
          }
        ),
        "Save device login for biometrics"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryBtn, { type: "submit", disabled: busy, children: busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mx-auto" }) : "Create my account" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground text-center mt-6", children: [
      "Already registered? ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "font-bold text-foreground hover:underline", children: "Sign in" })
    ] })
  ] }) });
}
const SplitComponent = TenantAcceptInvite;
export {
  SplitComponent as component
};
