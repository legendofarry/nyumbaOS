import { r as reactExports, W as jsxRuntimeExports } from "./worker-entry-B4jK-wDu.js";
import { c as createLucideIcon, m as motion, L as LoaderCircle, H as House, W as Wallet, g as Wrench, D as Droplets, d as Link, f as firebaseClient } from "./router-DRMkp4_G.js";
import { K as KSH } from "./format-Bw1R0kSi.js";
import { S as Sparkles, s as streamAi } from "./ai-COyBpl8Q.js";
import { A as AnimatePresence, X } from "./x-DMSthfi5.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode$1 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
  ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }]
];
const CircleAlert = createLucideIcon("circle-alert", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
      key: "1ffxy3"
    }
  ],
  ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }]
];
const Send = createLucideIcon("send", __iconNode);
function AiAssistant({
  mode,
  context,
  label = "AI Assistant",
  greeting
}) {
  const [open, setOpen] = reactExports.useState(false);
  const [msgs, setMsgs] = reactExports.useState(greeting ? [{ role: "assistant", content: greeting }] : []);
  const [input, setInput] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  const send = async () => {
    const txt = input.trim();
    if (!txt || busy) return;
    const next = [...msgs, { role: "user", content: txt }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    let acc = "";
    await streamAi({
      mode,
      messages: next,
      context,
      onDelta: (c) => {
        acc += c;
        setMsgs((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > next.length) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: acc } : m);
          }
          return [...prev, { role: "assistant", content: acc }];
        });
      },
      onDone: () => setBusy(false)
    });
    setBusy(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setOpen(true),
        className: "fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-40 h-14 w-14 rounded-full bg-foreground text-background grid place-items-center shadow-2xl hover:scale-105 transition-transform",
        "aria-label": "Open AI assistant",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-5 w-5" })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: open && /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: "fixed inset-0 z-[110] bg-foreground/40 backdrop-blur-sm grid place-items-end sm:place-items-center p-3",
        onClick: () => setOpen(false),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { y: 60, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            exit: { y: 60, opacity: 0 },
            transition: { type: "spring", stiffness: 380, damping: 32 },
            onClick: (e) => e.stopPropagation(),
            className: "w-full sm:max-w-lg h-[70vh] sm:h-[600px] bg-surface rounded-[2rem] shadow-2xl flex flex-col overflow-hidden",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-5 border-b border-border", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-2xl bg-foreground text-background grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-widest text-muted-foreground", children: "Powered by AI" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setOpen(false), className: "h-9 w-9 grid place-items-center rounded-2xl bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-5 flex flex-col gap-3", children: [
                msgs.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-muted-foreground text-sm py-12", children: "Ask me anything about your property." }),
                msgs.map((m, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user" ? "self-end bg-foreground text-background" : "self-start bg-muted"}`, children: m.content || (busy ? "…" : "") }, i)),
                busy && msgs[msgs.length - 1]?.role === "user" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "self-start bg-muted px-4 py-2.5 rounded-2xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-t border-border flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    value: input,
                    onChange: (e) => setInput(e.target.value),
                    onKeyDown: (e) => e.key === "Enter" && send(),
                    placeholder: "Ask anything…",
                    className: "flex-1 px-4 py-3 rounded-2xl bg-muted outline-none text-sm font-medium",
                    disabled: busy
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: send, disabled: busy || !input.trim(), className: "h-11 w-11 rounded-2xl bg-foreground text-background grid place-items-center disabled:opacity-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }) })
              ] })
            ]
          }
        )
      }
    ) })
  ] });
}
function Dashboard() {
  const [data, setData] = reactExports.useState(null);
  const [insights, setInsights] = reactExports.useState("");
  reactExports.useEffect(() => {
    const load = async () => {
      const [u, t, p, ti, r, n] = await Promise.all([
        firebaseClient.from("units").select("*").order("floor").order("number"),
        firebaseClient.from("profiles").select("*").not("unit_id", "is", null),
        firebaseClient.from("payments").select("*").order("date", { ascending: false }),
        firebaseClient.from("tickets").select("*").order("created_at", { ascending: false }),
        firebaseClient.from("readings").select("*").order("date", { ascending: false }),
        firebaseClient.from("notices").select("*").order("created_at", { ascending: false }).limit(3)
      ]);
      setData({
        units: u.data ?? [],
        tenants: t.data ?? [],
        payments: p.data ?? [],
        tickets: ti.data ?? [],
        readings: r.data ?? [],
        notices: n.data ?? []
      });
    };
    load();
  }, []);
  reactExports.useEffect(() => {
    if (!data) return;
    const ctx = {
      occupancyRate: data.units.length ? Math.round(data.units.filter((u) => u.status === "Occupied").length / data.units.length * 100) : 0,
      vacantUnits: data.units.filter((u) => u.status === "Vacant").length,
      maintenanceUnits: data.units.filter((u) => u.status === "Maintenance").length,
      totalTenants: data.tenants.length,
      monthIncome: data.payments.filter((p) => p.type === "Rent" && new Date(p.date).getMonth() === (/* @__PURE__ */ new Date()).getMonth()).reduce((s, p) => s + Number(p.amount), 0),
      openTickets: data.tickets.filter((t) => t.status !== "Done").length,
      emergencyTickets: data.tickets.filter((t) => t.priority === "Emergency" && t.status !== "Done").length,
      recentReadings: data.readings.slice(0, 5).map((r) => ({ unit: r.unit_id, m3: r.cubic_meters }))
    };
    setInsights("");
    let acc = "";
    streamAi({
      mode: "insights",
      messages: [{ role: "user", content: "Give 3 short insights now." }],
      context: ctx,
      onDelta: (c) => {
        acc += c;
        setInsights(acc);
      }
    });
  }, [data]);
  if (!data) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin" }) });
  const occupied = data.units.filter((u) => u.status === "Occupied").length;
  const occupancy = data.units.length ? Math.round(occupied / data.units.length * 100) : 0;
  const monthIncome = data.payments.filter((p) => p.type === "Rent" && new Date(p.date).getMonth() === (/* @__PURE__ */ new Date()).getMonth()).reduce((s, p) => s + Number(p.amount), 0);
  const emergencies = data.tickets.filter((t) => t.priority === "Emergency" && t.status !== "Done");
  const open = data.tickets.filter((t) => t.status !== "Done").length;
  const stats = [
    { label: "Occupancy", value: `${occupancy}%`, sub: `${occupied}/${data.units.length} units`, icon: House, to: "/building" },
    { label: "This month", value: KSH(monthIncome), sub: "Rent collected", icon: Wallet, to: "/rent" },
    { label: "Open tickets", value: String(open), sub: emergencies.length ? `${emergencies.length} emergency` : "All clear", icon: Wrench, to: "/maintenance" },
    { label: "Tenants", value: String(data.tenants.length), sub: "Active residents", icon: Droplets, to: "/tenants" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground", children: "Overview" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl sm:text-4xl font-black mt-2", children: "Dashboard" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, className: "tile p-5 bg-gradient-to-br from-foreground to-foreground/85 text-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3 text-xs uppercase tracking-widest opacity-80", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4" }),
        " AI insights"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm whitespace-pre-wrap min-h-[60px] leading-relaxed", children: insights || "Analyzing…" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3", children: stats.map((s) => {
      const Icon = s.icon;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: s.to, className: "tile p-5 hover:scale-[1.02] transition-transform", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-2xl bg-muted grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-black", children: s.value }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-widest text-muted-foreground mt-1", children: s.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-2", children: s.sub })
        ] })
      ] }, s.label);
    }) }),
    emergencies.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/maintenance", className: "tile p-5 border-2 border-destructive/30 pulse-emergency", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-destructive" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-widest font-bold text-destructive", children: "Emergency" })
      ] }),
      emergencies.slice(0, 2).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: t.title }, t.id))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-black", children: "Recent payments" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/rent", className: "text-xs font-bold text-muted-foreground hover:text-foreground", children: "View all →" })
        ] }),
        data.payments.slice(0, 5).map((p) => {
          const tenant = data.tenants.find((t) => t.id === p.tenant_id);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center py-2 border-b border-border/40 last:border-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: tenant?.full_name || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                p.type,
                " · ",
                new Date(p.date).toLocaleDateString()
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-mono font-bold text-success", children: KSH(Number(p.amount)) })
          ] }, p.id);
        }),
        !data.payments.length && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No payments yet." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-black", children: "Latest notices" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/notices", className: "text-xs font-bold text-muted-foreground hover:text-foreground", children: "Manage →" })
        ] }),
        data.notices.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-2 border-b border-border/40 last:border-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: n.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground line-clamp-1", children: n.body })
        ] }, n.id)),
        !data.notices.length && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No notices posted." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AiAssistant,
      {
        mode: "owner-chat",
        context: {
          units: data.units.map((u) => ({ number: u.number, floor: u.floor, status: u.status, rent: Number(u.rent), bedrooms: u.bedrooms })),
          tenants: data.tenants.map((t) => ({ name: t.full_name, unit_id: t.unit_id, phone: t.phone })),
          recentPayments: data.payments.slice(0, 10),
          openTickets: data.tickets.filter((t) => t.status !== "Done")
        },
        label: "PropertyHQ AI",
        greeting: "Hi! I can help you manage your building. Ask me about rent collection, vacancies, maintenance, or anything else."
      }
    )
  ] });
}
const SplitComponent = Dashboard;
export {
  SplitComponent as component
};
