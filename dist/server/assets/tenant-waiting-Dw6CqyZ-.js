import { r as reactExports, W as jsxRuntimeExports } from "./worker-entry-B4jK-wDu.js";
import { c as createLucideIcon, a as useNavigate, b as useSearch, d as Link, m as motion, L as LoaderCircle, f as firebaseClient } from "./router-DRMkp4_G.js";
import { R as REQUEST_KEY } from "./TenantRegister-BijKMrlQ.js";
import { C as CircleCheck } from "./circle-check-BKm0P2ty.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./Modal-8BinRw0y.js";
import "./x-DMSthfi5.js";
const __iconNode$1 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 6v6h4", key: "135r8i" }]
];
const Clock3 = createLucideIcon("clock-3", __iconNode$1);
const __iconNode = [
  ["path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "14sxne" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
  ["path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16", key: "1hlbsb" }],
  ["path", { d: "M16 16h5v5", key: "ccwih5" }]
];
const RefreshCcw = createLucideIcon("refresh-ccw", __iconNode);
function TenantWaiting() {
  useNavigate();
  const search = useSearch({ strict: false });
  const requestId = search.request || window.localStorage.getItem(REQUEST_KEY) || "";
  const [request, setRequest] = reactExports.useState(null);
  const [unit, setUnit] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const load = async () => {
    if (!requestId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await firebaseClient.from("tenant_requests").select("*").eq("id", requestId).maybeSingle();
    const next = data;
    setRequest(next);
    if (next?.unit_id) {
      const unitRes = await firebaseClient.from("units").select("*").eq("id", next.unit_id).maybeSingle();
      setUnit(unitRes.data ?? null);
    }
    setLoading(false);
  };
  reactExports.useEffect(() => {
    load();
    const timer = window.setInterval(load, 1e4);
    return () => window.clearInterval(timer);
  }, [requestId]);
  if (!requestId) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen grid place-items-center bg-background p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md tile p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-black text-2xl", children: "No registration found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/tenant-register", className: "mt-6 inline-flex rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background", children: "Register as tenant" })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen grid place-items-center bg-background p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, className: "w-full max-w-md tile p-8 text-center", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin mx-auto" }) : request?.status === "approved" && request.invite_code ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-10 w-10 mx-auto text-foreground" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-black text-2xl mt-4", children: "Your unit is ready" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mt-2", children: [
      "You have been assigned ",
      unit ? `Unit ${unit.number}` : "a unit",
      ". Use this invite code to set your password."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-lg font-black bg-muted rounded-2xl py-3 mt-5", children: request.invite_code }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/tenant-accept",
        search: { code: request.invite_code },
        className: "mt-5 inline-flex w-full justify-center rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background",
        children: "Continue setup"
      }
    )
  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Clock3, { className: "h-10 w-10 mx-auto text-muted-foreground" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-black text-2xl mt-4", children: "Waiting for owner approval" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "Your registration has been sent. Keep this page open or come back from the same browser." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: load, className: "mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm font-bold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCcw, { className: "h-4 w-4" }),
      "Check again"
    ] })
  ] }) }) });
}
const SplitComponent = TenantWaiting;
export {
  SplitComponent as component
};
