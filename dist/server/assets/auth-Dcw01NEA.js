import { r as reactExports, W as jsxRuntimeExports } from "./worker-entry-B4jK-wDu.js";
import { c as createLucideIcon, a as useNavigate, b as useSearch, f as firebaseClient, m as motion, B as Building2, L as LoaderCircle, d as Link, t as toast } from "./router-DRMkp4_G.js";
import { F as Field, i as inputCls, P as PrimaryBtn } from "./Modal-8BinRw0y.js";
import { c as canUseDeviceCredentials, s as saveDeviceCredential, g as getDeviceCredential } from "./deviceCredentials-4GYlRYFK.js";
import { F as FingerprintPattern } from "./fingerprint-pattern-D-xCcVFT.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./x-DMSthfi5.js";
const __iconNode$1 = [
  [
    "path",
    {
      d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
      key: "1s6t7t"
    }
  ],
  ["circle", { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor", key: "w0ekpg" }]
];
const KeyRound = createLucideIcon("key-round", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      key: "oel41y"
    }
  ],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
];
const ShieldCheck = createLucideIcon("shield-check", __iconNode);
const ROLE_COPY = {
  owner: {
    label: "Create owner",
    title: "Owner code",
    placeholder: "OWNER2026",
    dataKey: "owner_code",
    success: "Owner account created"
  },
  assistant: {
    label: "Create assistant",
    title: "Assistant code",
    placeholder: "ASSISTANT2026",
    dataKey: "assistant_code",
    success: "Owner assistant account created"
  }
};
function OwnerAuth() {
  const nav = useNavigate();
  const search = useSearch({ strict: false });
  const [mode, setMode] = reactExports.useState(search.mode === "signup" ? "owner" : "login");
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [name, setName] = reactExports.useState("");
  const [code, setCode] = reactExports.useState("");
  const [rememberForWeek, setRememberForWeek] = reactExports.useState(false);
  const [enableDeviceLogin, setEnableDeviceLogin] = reactExports.useState(false);
  const [status, setStatus] = reactExports.useState({ owner: true, assistant: true, loading: true });
  const [busy, setBusy] = reactExports.useState(false);
  const availableModes = reactExports.useMemo(() => {
    const modes = ["login"];
    if (!status.owner) modes.push("owner");
    if (!status.assistant) modes.push("assistant");
    return modes;
  }, [status.owner, status.assistant]);
  reactExports.useEffect(() => {
    let alive = true;
    firebaseClient.privilegedAccountStatus().then((next) => {
      if (!alive) return;
      setStatus({ ...next, loading: false });
      if (mode === "owner" && next.owner) setMode("login");
      if (mode === "assistant" && next.assistant) setMode("login");
    }).catch(() => {
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
      rememberForWeek
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
    } catch (err) {
      toast.error(err.message ?? "Device login failed");
    } finally {
      setBusy(false);
    }
  };
  const submit = async (e) => {
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
          data: { full_name: name, [copy.dataKey]: code }
        }
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
    } catch (err) {
      toast.error(err.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };
  const signupMode = mode === "owner" || mode === "assistant" ? mode : null;
  const signupCopy = signupMode ? ROLE_COPY[signupMode] : null;
  const showDeviceLogin = canUseDeviceCredentials();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen grid place-items-center bg-background p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, className: "w-full max-w-md tile p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-2xl bg-foreground text-background grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-black text-xl", children: "PropertyHQ" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Owner portal" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 mb-6 p-1 bg-muted rounded-2xl", children: availableModes.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: () => setMode(item),
        className: `flex-1 py-2 px-2 rounded-xl text-xs font-bold ${mode === item ? "bg-foreground text-background" : "text-muted-foreground"}`,
        disabled: status.loading,
        children: item === "login" ? "Sign in" : ROLE_COPY[item].label
      },
      item
    )) }),
    status.loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "flex flex-col gap-4", children: [
      signupMode && /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Full name", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: inputCls, value: name, onChange: (e) => setName(e.target.value), required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Email", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "email",
          className: inputCls,
          value: email,
          onChange: (e) => setEmail(e.target.value),
          required: true,
          autoComplete: "email"
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Password", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "password",
          className: inputCls,
          value: password,
          onChange: (e) => setPassword(e.target.value),
          required: true,
          minLength: 6,
          autoComplete: signupMode ? "new-password" : "current-password"
        }
      ) }),
      signupCopy && /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: signupCopy.title, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: `${inputCls} pl-11`,
            value: code,
            onChange: (e) => setCode(e.target.value),
            placeholder: signupCopy.placeholder,
            required: true
          }
        )
      ] }) }),
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
      signupMode && showDeviceLogin && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 text-sm font-semibold text-muted-foreground", children: [
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
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryBtn, { type: "submit", disabled: busy, children: busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mx-auto" }) : mode === "login" ? "Sign in" : "Create account" }),
      mode === "login" && showDeviceLogin && /* @__PURE__ */ jsxRuntimeExports.jsxs(
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
      ),
      status.owner && status.assistant && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-2xl bg-muted p-3 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4 shrink-0" }),
        "Owner and assistant accounts already exist. Only sign-in is available."
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground text-center mt-6", children: [
      "Tenant?",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "font-bold text-foreground hover:underline", children: "Sign in here" }),
      " . ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/signup", className: "font-bold text-foreground hover:underline", children: "Create tenant account" })
    ] })
  ] }) });
}
const SplitComponent = OwnerAuth;
export {
  SplitComponent as component
};
