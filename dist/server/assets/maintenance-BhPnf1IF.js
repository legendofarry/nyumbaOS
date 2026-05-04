import { r as reactExports, W as jsxRuntimeExports } from "./worker-entry-B4jK-wDu.js";
import { u as useConfirm, m as motion, f as firebaseClient, t as toast } from "./router-DRMkp4_G.js";
import { f as fmtDate, K as KSH } from "./format-Bw1R0kSi.js";
import { M as Modal, F as Field, i as inputCls, P as PrimaryBtn } from "./Modal-8BinRw0y.js";
import { D as Download, e as exportToCSV } from "./csv-BpZ5TyPB.js";
import { P as Plus, T as Trash2 } from "./trash-2-CXlCTCsS.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./x-DMSthfi5.js";
const priorityStyles = {
  Emergency: "bg-destructive/15 text-destructive",
  High: "bg-warning/15 text-warning",
  Normal: "bg-muted text-muted-foreground"
};
const statusStyles = {
  Open: "bg-info/15 text-info",
  "In Progress": "bg-warning/15 text-warning",
  Done: "bg-success/15 text-success"
};
function Maintenance() {
  const [tickets, setTickets] = reactExports.useState([]);
  const [units, setUnits] = reactExports.useState([]);
  const [open, setOpen] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({ title: "", description: "", unit_id: "", priority: "Normal", cost: 0 });
  const confirm = useConfirm();
  const load = async () => {
    const [t, u] = await Promise.all([
      firebaseClient.from("tickets").select("*").order("created_at", { ascending: false }),
      firebaseClient.from("units").select("*").order("number")
    ]);
    setTickets(t.data ?? []);
    setUnits(u.data ?? []);
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title) return;
    const { data: { user } } = await firebaseClient.auth.getUser();
    const { error } = await firebaseClient.from("tickets").insert({
      title: form.title,
      description: form.description,
      unit_id: form.unit_id || null,
      priority: form.priority,
      cost: form.cost,
      created_by: user?.id ?? null,
      status: "Open"
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Ticket created");
    setForm({ title: "", description: "", unit_id: "", priority: "Normal", cost: 0 });
    setOpen(false);
    load();
  };
  const setStatus = async (id, status) => {
    await firebaseClient.from("tickets").update({ status }).eq("id", id);
    load();
  };
  const handleDelete = async (id) => {
    if (!await confirm({ title: "Delete this ticket?", destructive: true, confirmText: "Delete" })) return;
    await firebaseClient.from("tickets").delete().eq("id", id);
    load();
  };
  const exportTickets = () => {
    exportToCSV(tickets.map((t) => ({
      created: fmtDate(t.created_at),
      title: t.title,
      unit: units.find((u) => u.id === t.unit_id)?.number ?? "",
      priority: t.priority,
      status: t.status,
      cost_ksh: Number(t.cost)
    })), "maintenance.csv");
  };
  const sorted = [...tickets].sort((a, b) => {
    const order = { Emergency: 0, High: 1, Normal: 2 };
    return order[a.priority] - order[b.priority];
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-end justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground", children: "Service desk" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl sm:text-4xl font-black mt-2", children: "Maintenance" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: exportTickets, className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted font-semibold text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
          " CSV"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOpen(true), className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          " New ticket"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-2 gap-3", children: [
      sorted.map((t) => {
        const unit = units.find((u) => u.id === t.unit_id);
        const isEmer = t.priority === "Emergency" && t.status !== "Done";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { layout: true, className: `tile p-5 ${isEmer ? "border-2 border-destructive/30 pulse-emergency" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-black text-base", children: t.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${priorityStyles[t.priority]}`, children: t.priority }) })
          ] }),
          t.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-3", children: t.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
              "Unit ",
              unit?.number ?? "—",
              " · ",
              fmtDate(t.created_at)
            ] }),
            Number(t.cost) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold", children: KSH(Number(t.cost)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center gap-2 flex-wrap", children: [
            ["Open", "In Progress", "Done"].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setStatus(t.id, s), className: `text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-full ${t.status === s ? statusStyles[s] : "bg-muted text-muted-foreground"}`, children: s }, s)),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleDelete(t.id), className: "ml-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 text-muted-foreground hover:text-destructive" }) })
          ] })
        ] }, t.id);
      }),
      !tickets.length && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-span-full tile p-10 text-center text-sm text-muted-foreground", children: "No tickets yet." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open, onClose: () => setOpen(false), title: "New ticket", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleAdd, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Title", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: inputCls, value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Description", children: /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: inputCls, rows: 3, value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Unit (optional)", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: inputCls, value: form.unit_id, onChange: (e) => setForm({ ...form, unit_id: e.target.value }), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "— No specific unit —" }),
        units.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: u.id, children: [
          "Unit ",
          u.number
        ] }, u.id))
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Priority", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: inputCls, value: form.priority, onChange: (e) => setForm({ ...form, priority: e.target.value }), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "Normal" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "High" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "Emergency" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Cost (KSh)", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", className: inputCls, value: form.cost || "", onChange: (e) => setForm({ ...form, cost: Number(e.target.value) }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryBtn, { type: "submit", children: "Create ticket" })
    ] }) })
  ] });
}
const SplitComponent = Maintenance;
export {
  SplitComponent as component
};
