import { r as reactExports, W as jsxRuntimeExports } from "./worker-entry-B4jK-wDu.js";
import { u as useConfirm, f as firebaseClient, t as toast } from "./router-DRMkp4_G.js";
import { K as KSH, f as fmtDate } from "./format-Bw1R0kSi.js";
import { M as Modal, F as Field, i as inputCls, P as PrimaryBtn } from "./Modal-8BinRw0y.js";
import { D as Download, e as exportToCSV } from "./csv-BpZ5TyPB.js";
import { P as Plus, T as Trash2 } from "./trash-2-CXlCTCsS.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./x-DMSthfi5.js";
function Rent() {
  const [payments, setPayments] = reactExports.useState([]);
  const [tenants, setTenants] = reactExports.useState([]);
  const [units, setUnits] = reactExports.useState([]);
  const [open, setOpen] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({ tenant_id: "", amount: 0, type: "Rent", date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), note: "" });
  const confirm = useConfirm();
  const load = async () => {
    const [p, t, u] = await Promise.all([
      firebaseClient.from("payments").select("*").order("date", { ascending: false }),
      firebaseClient.from("profiles").select("*").not("unit_id", "is", null),
      firebaseClient.from("units").select("*")
    ]);
    setPayments(p.data ?? []);
    setTenants(t.data ?? []);
    setUnits(u.data ?? []);
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const monthTotal = reactExports.useMemo(() => {
    const m = (/* @__PURE__ */ new Date()).getMonth();
    return payments.filter((p) => new Date(p.date).getMonth() === m).reduce((s, p) => s + Number(p.amount), 0);
  }, [payments]);
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.tenant_id || !form.amount) return;
    const { error } = await firebaseClient.from("payments").insert(form);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Payment recorded");
    setForm({ tenant_id: "", amount: 0, type: "Rent", date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), note: "" });
    setOpen(false);
    load();
  };
  const handleDelete = async (id) => {
    if (!await confirm({ title: "Delete this payment?", destructive: true, confirmText: "Delete" })) return;
    await firebaseClient.from("payments").delete().eq("id", id);
    toast.success("Deleted");
    load();
  };
  const exportPayments = () => {
    exportToCSV(payments.map((p) => {
      const t = tenants.find((x) => x.id === p.tenant_id);
      const u = units.find((x) => x.id === t?.unit_id);
      return {
        date: p.date,
        tenant: t?.full_name ?? "",
        unit: u?.number ?? "",
        type: p.type,
        amount_ksh: Number(p.amount),
        note: p.note ?? ""
      };
    }), "payments.csv");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-end justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground", children: "Financials" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl sm:text-4xl font-black mt-2", children: "Rent ledger" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: exportPayments, className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted font-semibold text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
          " CSV"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOpen(true), disabled: !tenants.length, className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-sm disabled:opacity-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          " Record payment"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile p-6 bg-foreground text-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-widest opacity-70", children: "This month" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-4xl font-black mt-2", children: KSH(monthTotal) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs opacity-70 mt-1", children: [
        payments.filter((p) => new Date(p.date).getMonth() === (/* @__PURE__ */ new Date()).getMonth()).length,
        " payments"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block tile p-2 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "text-[10px] uppercase tracking-widest text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: "Date" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: "Tenant" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: "Unit" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-3", children: "Type" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-3", children: "Amount" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", {})
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
        payments.map((p) => {
          const t = tenants.find((x) => x.id === p.tenant_id);
          const u = units.find((x) => x.id === t?.unit_id);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/40 hover:bg-muted/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-sm", children: fmtDate(p.date) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-sm font-semibold", children: t?.full_name ?? "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-sm text-muted-foreground", children: u?.number ?? "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-muted", children: p.type }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right font-mono font-bold", children: KSH(Number(p.amount)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleDelete(p.id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 text-muted-foreground hover:text-destructive" }) }) })
          ] }, p.id);
        }),
        !payments.length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 6, className: "p-8 text-center text-sm text-muted-foreground", children: "No payments yet." }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:hidden flex flex-col gap-2", children: payments.map((p) => {
      const t = tenants.find((x) => x.id === p.tenant_id);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm", children: t?.full_name ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
            p.type,
            " · ",
            fmtDate(p.date)
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono font-black text-success", children: KSH(Number(p.amount)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleDelete(p.id), className: "mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 text-muted-foreground" }) })
        ] })
      ] }, p.id);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open, onClose: () => setOpen(false), title: "Record payment", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleAdd, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Tenant", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: inputCls, value: form.tenant_id, onChange: (e) => setForm({ ...form, tenant_id: e.target.value }), required: true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select tenant…" }),
        tenants.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: t.id, children: t.full_name }, t.id))
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Type", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: inputCls, value: form.type, onChange: (e) => setForm({ ...form, type: e.target.value }), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "Rent" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "Water" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "Service" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Amount (KSh)", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", className: inputCls, value: form.amount || "", onChange: (e) => setForm({ ...form, amount: Number(e.target.value) }), required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Date", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", className: inputCls, value: form.date, onChange: (e) => setForm({ ...form, date: e.target.value }), required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Note (optional)", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: inputCls, value: form.note, onChange: (e) => setForm({ ...form, note: e.target.value }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryBtn, { type: "submit", children: "Save" })
    ] }) })
  ] });
}
const SplitComponent = Rent;
export {
  SplitComponent as component
};
