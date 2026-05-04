import { r as reactExports, W as jsxRuntimeExports } from "./worker-entry-B4jK-wDu.js";
import { c as createLucideIcon, u as useConfirm, e as LayoutGroup, m as motion, H as House, f as firebaseClient, t as toast } from "./router-DRMkp4_G.js";
import { K as KSH, a as floorLabel } from "./format-Bw1R0kSi.js";
import { M as Modal, F as Field, i as inputCls, P as PrimaryBtn } from "./Modal-8BinRw0y.js";
import { D as Download, e as exportToCSV } from "./csv-BpZ5TyPB.js";
import { P as Plus, T as Trash2 } from "./trash-2-CXlCTCsS.js";
import { A as AnimatePresence } from "./x-DMSthfi5.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode = [
  ["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", key: "975kel" }],
  ["circle", { cx: "12", cy: "7", r: "4", key: "17ys0d" }]
];
const User = createLucideIcon("user", __iconNode);
const FLOORS = [
  { value: 0, label: "Ground" },
  { value: 1, label: "First" }
];
const BEDROOM_TYPES = ["Bedsitter", "1 Bedroom", "2 Bedroom", "3 Bedroom", "4 Bedroom"];
const statusStyles = {
  Occupied: "bg-success/15 text-success",
  Vacant: "bg-info/15 text-info",
  Maintenance: "bg-destructive/15 text-destructive"
};
function Building() {
  const [units, setUnits] = reactExports.useState([]);
  const [tenants, setTenants] = reactExports.useState([]);
  const [floor, setFloor] = reactExports.useState(0);
  const [openAdd, setOpenAdd] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({ number: "", floor: 0, bedrooms: "Bedsitter", rent: 0, status: "Vacant" });
  const confirm = useConfirm();
  const load = async () => {
    const [u, t] = await Promise.all([
      firebaseClient.from("units").select("*").order("floor").order("number"),
      firebaseClient.from("profiles").select("*").not("unit_id", "is", null)
    ]);
    setUnits(u.data ?? []);
    setTenants(t.data ?? []);
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const list = reactExports.useMemo(() => units.filter((u) => u.floor === floor), [units, floor]);
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.number) return;
    const { error } = await firebaseClient.from("units").insert({
      number: form.number,
      floor: form.floor,
      bedrooms: form.bedrooms,
      rent: form.rent,
      status: form.status
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Unit ${form.number} added`);
    setForm({ number: "", floor: form.floor, bedrooms: "Bedsitter", rent: 0, status: "Vacant" });
    setOpenAdd(false);
    setFloor(form.floor);
    load();
  };
  const handleDelete = async (id, num) => {
    if (!await confirm({ title: `Delete unit ${num}?`, description: "This also unlinks any tenant assigned to this unit.", destructive: true, confirmText: "Delete" })) return;
    const { error } = await firebaseClient.from("units").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Unit deleted");
    load();
  };
  const cycleStatus = async (id, current) => {
    const next = current === "Vacant" ? "Maintenance" : current === "Maintenance" ? "Occupied" : "Vacant";
    const { error } = await firebaseClient.from("units").update({ status: next }).eq("id", id);
    if (error) toast.error(error.message);
    else load();
  };
  const exportUnits = () => {
    exportToCSV(units.map((u) => ({
      number: u.number,
      floor: u.floor === 0 ? "Ground" : "First",
      bedrooms: u.bedrooms,
      rent_ksh: u.rent,
      status: u.status,
      tenant: tenants.find((t) => t.unit_id === u.id)?.full_name ?? ""
    })), "units.csv");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-end justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground", children: "Inventory" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl sm:text-4xl font-black mt-2", children: "Building" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: exportUnits, className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted font-semibold text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
          " CSV"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
          setForm((f) => ({ ...f, floor }));
          setOpenAdd(true);
        }, className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          " Unit"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutGroup, { id: "floor-tabs", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "tile p-2 inline-flex gap-1 self-start", children: FLOORS.map((f) => {
      const active = f.value === floor;
      const count = units.filter((u) => u.floor === f.value).length;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setFloor(f.value), className: "relative px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap", children: [
        active && /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { layoutId: "floor-pill", className: "absolute inset-0 bg-foreground rounded-2xl", transition: { type: "spring", stiffness: 400, damping: 35 } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `relative ${active ? "text-background" : "text-muted-foreground"}`, children: [
          f.label,
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "opacity-60", children: [
            "(",
            count,
            ")"
          ] })
        ] })
      ] }, f.value);
    }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { mode: "wait", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.25 }, className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3", children: [
      list.map((u) => {
        const tenant = tenants.find((t) => t.unit_id === u.id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile p-5 flex flex-col gap-3 group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-2xl bg-muted grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => cycleStatus(u.id, u.status), className: `text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${statusStyles[u.status]}`, children: u.status })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-black", children: [
              "#",
              u.number
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-widest text-muted-foreground mt-1", children: u.bedrooms }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mt-1 font-mono", children: [
              KSH(Number(u.rent)),
              " / mo"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border/40 pt-3 flex items-center justify-between gap-2", children: [
            tenant ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-7 w-7 rounded-full bg-foreground text-background grid place-items-center text-[10px] font-black flex-shrink-0", children: tenant.full_name.charAt(0).toUpperCase() }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold truncate", children: tenant.full_name }),
                tenant.phone && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground truncate", children: tenant.phone })
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-3.5 w-3.5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: "Vacant" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleDelete(u.id, u.number), className: "opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 hover:text-destructive" }) })
          ] })
        ] }, u.id);
      }),
      list.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-full tile p-10 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mb-4", children: [
          "No units on the ",
          floorLabel(floor),
          " floor yet."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
          setForm((f) => ({ ...f, floor }));
          setOpenAdd(true);
        }, className: "inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-foreground text-background font-bold text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          " Add unit"
        ] })
      ] })
    ] }, floor) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: openAdd, onClose: () => setOpenAdd(false), title: "Add unit", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleAdd, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Unit number", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: inputCls, value: form.number, onChange: (e) => setForm({ ...form, number: e.target.value }), placeholder: "e.g. G01 or 101", required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Floor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: inputCls, value: form.floor, onChange: (e) => setForm({ ...form, floor: Number(e.target.value) }), children: FLOORS.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: f.value, children: f.label }, f.value)) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Type", children: /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: inputCls, value: form.bedrooms, onChange: (e) => setForm({ ...form, bedrooms: e.target.value }), children: BEDROOM_TYPES.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: b }, b)) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Rent (KSh / month)", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", className: inputCls, value: form.rent || "", onChange: (e) => setForm({ ...form, rent: Number(e.target.value) }), placeholder: "0" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Status", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: inputCls, value: form.status, onChange: (e) => setForm({ ...form, status: e.target.value }), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "Vacant" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "Occupied" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "Maintenance" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryBtn, { type: "submit", children: "Add unit" })
    ] }) })
  ] });
}
const SplitComponent = Building;
export {
  SplitComponent as component
};
