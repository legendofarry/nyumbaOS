import { r as reactExports, W as jsxRuntimeExports } from "./worker-entry-B4jK-wDu.js";
import { u as useConfirm, D as Droplets, f as firebaseClient, t as toast } from "./router-DRMkp4_G.js";
import { f as fmtDate } from "./format-Bw1R0kSi.js";
import { M as Modal, F as Field, i as inputCls, P as PrimaryBtn } from "./Modal-8BinRw0y.js";
import { D as Download, e as exportToCSV } from "./csv-BpZ5TyPB.js";
import { P as Plus, T as Trash2 } from "./trash-2-CXlCTCsS.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./x-DMSthfi5.js";
function Utilities() {
  const [readings, setReadings] = reactExports.useState([]);
  const [units, setUnits] = reactExports.useState([]);
  const [open, setOpen] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({ unit_id: "", cubic_meters: 0, date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) });
  const confirm = useConfirm();
  const load = async () => {
    const [r, u] = await Promise.all([
      firebaseClient.from("readings").select("*").order("date", { ascending: false }),
      firebaseClient.from("units").select("*").order("number")
    ]);
    setReadings(r.data ?? []);
    setUnits(u.data ?? []);
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.unit_id) return;
    const { error } = await firebaseClient.from("readings").insert(form);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Reading logged");
    setForm({ unit_id: "", cubic_meters: 0, date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) });
    setOpen(false);
    load();
  };
  const handleDelete = async (id) => {
    if (!await confirm({ title: "Delete this reading?", destructive: true, confirmText: "Delete" })) return;
    await firebaseClient.from("readings").delete().eq("id", id);
    load();
  };
  const exportReadings = () => exportToCSV(readings.map((r) => ({
    date: r.date,
    unit: units.find((u) => u.id === r.unit_id)?.number ?? "",
    cubic_meters: Number(r.cubic_meters)
  })), "utilities.csv");
  const total = readings.reduce((s, r) => s + Number(r.cubic_meters), 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-end justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground", children: "Resources" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl sm:text-4xl font-black mt-2", children: "Utilities" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: exportReadings, className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted font-semibold text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
          " CSV"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOpen(true), className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          " Log reading"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile p-6 bg-info text-info-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs uppercase tracking-widest opacity-80", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Droplets, { className: "h-4 w-4" }),
        " Total water consumption"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-4xl font-black mt-2", children: [
        total.toLocaleString(),
        " m³"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-3", children: [
      readings.map((r) => {
        const u = units.find((x) => x.id === r.unit_id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile p-5 group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-2xl bg-info/15 text-info grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Droplets, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleDelete(r.id), className: "opacity-0 group-hover:opacity-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 text-muted-foreground hover:text-destructive" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-black", children: [
              Number(r.cubic_meters),
              " m³"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
              "Unit ",
              u?.number ?? "—",
              " · ",
              fmtDate(r.date)
            ] })
          ] })
        ] }, r.id);
      }),
      !readings.length && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-span-full tile p-10 text-center text-sm text-muted-foreground", children: "No readings yet." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open, onClose: () => setOpen(false), title: "Log meter reading", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleAdd, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Unit", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: inputCls, value: form.unit_id, onChange: (e) => setForm({ ...form, unit_id: e.target.value }), required: true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select unit…" }),
        units.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: u.id, children: [
          "Unit ",
          u.number
        ] }, u.id))
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Cubic meters (m³)", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", step: "0.01", className: inputCls, value: form.cubic_meters || "", onChange: (e) => setForm({ ...form, cubic_meters: Number(e.target.value) }), required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Date", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", className: inputCls, value: form.date, onChange: (e) => setForm({ ...form, date: e.target.value }), required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryBtn, { type: "submit", children: "Save" })
    ] }) })
  ] });
}
const SplitComponent = Utilities;
export {
  SplitComponent as component
};
