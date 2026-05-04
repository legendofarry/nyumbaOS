import { r as reactExports, W as jsxRuntimeExports } from "./worker-entry-B4jK-wDu.js";
import { a as useNavigate, m as motion, H as House, L as LoaderCircle, d as Link, f as firebaseClient, t as toast } from "./router-DRMkp4_G.js";
import { F as Field, i as inputCls, P as PrimaryBtn } from "./Modal-8BinRw0y.js";
import { c as canUseDeviceCredentials, s as saveDeviceCredential } from "./deviceCredentials-4GYlRYFK.js";
import { a as tenantSignupEmail } from "./tenantEmail-DWSiCO4G.js";
import { F as FingerprintPattern } from "./fingerprint-pattern-D-xCcVFT.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./x-DMSthfi5.js";
function TenantSignup() {
  const nav = useNavigate();
  const [form, setForm] = reactExports.useState({ full_name: "", phone: "", password: "" });
  const [rememberForWeek, setRememberForWeek] = reactExports.useState(false);
  const [enableDeviceLogin, setEnableDeviceLogin] = reactExports.useState(false);
  const [busy, setBusy] = reactExports.useState(false);
  const showDeviceLogin = canUseDeviceCredentials();
  const submit = async (e) => {
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
            phone: form.phone
          }
        }
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
    } catch (err) {
      toast.error(err.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen grid place-items-center bg-background p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, className: "w-full max-w-md tile p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-2xl bg-foreground text-background grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-black text-xl", children: "Create tenant account" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "You will wait for unit assignment" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Full name", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: inputCls, value: form.full_name, onChange: (e) => setForm({ ...form, full_name: e.target.value }), required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Phone number", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: inputCls, value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }), required: true, placeholder: "+254..." }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Password", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "password",
          className: inputCls,
          value: form.password,
          onChange: (e) => setForm({ ...form, password: e.target.value }),
          minLength: 6,
          required: true,
          autoComplete: "new-password"
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 text-sm font-semibold text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", className: "h-4 w-4", checked: rememberForWeek, onChange: (e) => setRememberForWeek(e.target.checked) }),
        "Remember me for 1 week"
      ] }),
      showDeviceLogin && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 text-sm font-semibold text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", className: "h-4 w-4", checked: enableDeviceLogin, onChange: (e) => setEnableDeviceLogin(e.target.checked) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FingerprintPattern, { className: "h-4 w-4" }),
        "Save device login for biometrics"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryBtn, { type: "submit", disabled: busy, children: busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mx-auto" }) : "Create account" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground text-center mt-6", children: [
      "Already have an account?",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "font-bold text-foreground hover:underline", children: "Sign in" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
      "Owner or assistant?",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", search: { mode: "signup" }, className: "font-bold text-foreground hover:underline", children: "Create privileged account" })
    ] })
  ] }) });
}
const SplitComponent = TenantSignup;
export {
  SplitComponent as component
};
