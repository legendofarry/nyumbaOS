import { r as reactExports, W as jsxRuntimeExports } from "./worker-entry-B4jK-wDu.js";
import { a as useNavigate, m as motion, H as House, L as LoaderCircle, d as Link, f as firebaseClient, t as toast } from "./router-DRMkp4_G.js";
import { F as Field, i as inputCls, P as PrimaryBtn } from "./Modal-8BinRw0y.js";
const REQUEST_KEY = "nyumbaos.tenantRequestId";
function TenantRegister() {
  const nav = useNavigate();
  const [form, setForm] = reactExports.useState({ full_name: "", phone: "" });
  const [busy, setBusy] = reactExports.useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { data, error } = await firebaseClient.from("tenant_requests").insert({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        status: "waiting",
        unit_id: null,
        invite_code: null,
        created_at: now,
        updated_at: now
      });
      if (error) throw error;
      const requestId = data?.[0]?.id;
      if (!requestId) throw new Error("Could not create request.");
      window.localStorage.setItem(REQUEST_KEY, requestId);
      toast.success("Registration sent");
      nav({ to: "/tenant-waiting", search: { request: requestId } });
    } catch (err) {
      toast.error(err.message ?? "Registration failed");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen grid place-items-center bg-background p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, className: "w-full max-w-md tile p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-2xl bg-foreground text-background grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-black text-xl", children: "Tenant registration" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Request access to your home" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Full name", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: inputCls, value: form.full_name, onChange: (e) => setForm({ ...form, full_name: e.target.value }), required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Phone number", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: inputCls, value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }), required: true, placeholder: "+254..." }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryBtn, { type: "submit", disabled: busy, children: busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mx-auto" }) : "Send registration" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground text-center mt-6", children: [
      "Already assigned?",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "font-bold text-foreground hover:underline", children: "Sign in" })
    ] })
  ] }) });
}
export {
  REQUEST_KEY as R,
  TenantRegister as T
};
