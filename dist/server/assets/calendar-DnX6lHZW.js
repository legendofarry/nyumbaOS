import { r as reactExports, W as jsxRuntimeExports } from "./worker-entry-B4jK-wDu.js";
import { u as useConfirm, C as Calendar, f as firebaseClient, t as toast } from "./router-DRMkp4_G.js";
import { f as fmtDate } from "./format-Bw1R0kSi.js";
import { M as Modal, F as Field, i as inputCls, P as PrimaryBtn } from "./Modal-8BinRw0y.js";
import { P as Plus, T as Trash2 } from "./trash-2-CXlCTCsS.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./x-DMSthfi5.js";
const typeStyles = {
  "Move-in": "bg-success/15 text-success",
  Inspection: "bg-info/15 text-info",
  Admin: "bg-muted text-muted-foreground"
};
function CalendarPage() {
  const [events, setEvents] = reactExports.useState([]);
  const [open, setOpen] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({ title: "", date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), type: "Admin" });
  const confirm = useConfirm();
  const load = async () => {
    const { data } = await firebaseClient.from("events").select("*").order("date");
    setEvents(data ?? []);
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const handleAdd = async (e) => {
    e.preventDefault();
    const { error } = await firebaseClient.from("events").insert(form);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Event added");
    setForm({ title: "", date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), type: "Admin" });
    setOpen(false);
    load();
  };
  const handleDelete = async (id) => {
    if (!await confirm({ title: "Delete this event?", destructive: true, confirmText: "Delete" })) return;
    await firebaseClient.from("events").delete().eq("id", id);
    load();
  };
  const upcoming = events.filter((e) => new Date(e.date) >= new Date((/* @__PURE__ */ new Date()).toDateString()));
  const past = events.filter((e) => new Date(e.date) < new Date((/* @__PURE__ */ new Date()).toDateString()));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-end justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground", children: "Schedule" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl sm:text-4xl font-black mt-2", children: "Calendar" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOpen(true), className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
        " Event"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs uppercase tracking-widest text-muted-foreground mb-3", children: "Upcoming" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        upcoming.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile p-4 flex items-center justify-between gap-3 group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-2xl bg-muted grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm", children: e.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: fmtDate(e.date) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${typeStyles[e.type]}`, children: e.type }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleDelete(e.id), className: "opacity-0 group-hover:opacity-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 text-muted-foreground hover:text-destructive" }) })
          ] })
        ] }, e.id)),
        !upcoming.length && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No upcoming events." })
      ] })
    ] }),
    past.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs uppercase tracking-widest text-muted-foreground mb-3", children: "Past" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 opacity-60", children: past.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile p-3 flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          e.title,
          " · ",
          fmtDate(e.date)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleDelete(e.id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 text-muted-foreground" }) })
      ] }, e.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open, onClose: () => setOpen(false), title: "New event", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleAdd, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Title", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: inputCls, value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Date", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", className: inputCls, value: form.date, onChange: (e) => setForm({ ...form, date: e.target.value }), required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Type", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: inputCls, value: form.type, onChange: (e) => setForm({ ...form, type: e.target.value }), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "Admin" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "Move-in" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "Inspection" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryBtn, { type: "submit", children: "Save" })
    ] }) })
  ] });
}
const SplitComponent = CalendarPage;
export {
  SplitComponent as component
};
