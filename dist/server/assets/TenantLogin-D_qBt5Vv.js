import { r as reactExports, W as jsxRuntimeExports } from "./worker-entry-B4jK-wDu.js";
import { a as useNavigate, f as firebaseClient, m as motion, H as House, L as LoaderCircle, d as Link, t as toast } from "./router-DRMkp4_G.js";
import { F as Field, i as inputCls, P as PrimaryBtn } from "./Modal-8BinRw0y.js";
import { t as tenantEmail } from "./tenantEmail-DWSiCO4G.js";
import { c as canUseDeviceCredentials, g as getDeviceCredential } from "./deviceCredentials-4GYlRYFK.js";
import { F as FingerprintPattern } from "./fingerprint-pattern-D-xCcVFT.js";
function TenantLogin() {
  const nav = useNavigate();
  const [units, setUnits] = reactExports.useState([]);
  const [unitId, setUnitId] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [rememberForWeek, setRememberForWeek] = reactExports.useState(false);
  const [busy, setBusy] = reactExports.useState(false);
  reactExports.useEffect(() => {
    firebaseClient.from("units").select("*").order("floor").order("number").then(({ data }) => {
      setUnits((data ?? []).filter((unit) => unit.status !== "Vacant"));
    });
  }, []);
  const signIn = async (email, nextPassword) => {
    const { error } = await firebaseClient.auth.signInWithPassword({
      email,
      password: nextPassword,
      rememberForWeek
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
    } catch (err) {
      toast.error(err.message ?? "Device login failed");
    } finally {
      setBusy(false);
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    const unit = units.find((u) => u.id === unitId);
    if (!unit) {
      toast.error("Pick your unit");
      return;
    }
    setBusy(true);
    try {
      const { data: loginRef } = await firebaseClient.from("tenant_logins").select("*").eq("id", unit.id).maybeSingle();
      const mappedEmail = loginRef?.login_email;
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
    } catch (err) {
      toast.error(err.message ?? "Sign in failed");
    } finally {
      setBusy(false);
    }
  };
  const showDeviceLogin = canUseDeviceCredentials();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen grid place-items-center bg-background p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, className: "w-full max-w-md tile p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-2xl bg-foreground text-background grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-black text-xl", children: "Welcome back" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Tenant sign in" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Your unit", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: inputCls, value: unitId, onChange: (e) => setUnitId(e.target.value), required: true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select your unit..." }),
        units.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: u.id, children: [
          "Unit ",
          u.number,
          " - ",
          u.floor === 0 ? "Ground" : "First",
          " floor - ",
          u.bedrooms
        ] }, u.id))
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Password", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "password",
          className: inputCls,
          value: password,
          onChange: (e) => setPassword(e.target.value),
          required: true,
          autoComplete: "current-password"
        }
      ) }),
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
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryBtn, { type: "submit", disabled: busy, children: busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mx-auto" }) : "Sign in" }),
      showDeviceLogin && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: signInWithDevice,
          disabled: busy,
          className: "inline-flex items-center justify-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm font-bold disabled:opacity-50",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FingerprintPattern, { className: "h-4 w-4" }),
            "Use saved device login"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground text-center mt-6", children: [
      "New tenant?",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/signup", className: "font-bold text-foreground hover:underline", children: "Create account" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
      "Got an invite code?",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/tenant-accept", className: "font-bold text-foreground hover:underline", children: "Set password" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
      "Owner?",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", className: "font-bold text-foreground hover:underline", children: "Sign in here" })
    ] })
  ] }) });
}
export {
  TenantLogin as T
};
