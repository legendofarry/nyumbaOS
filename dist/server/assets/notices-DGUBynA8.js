import { r as reactExports, W as jsxRuntimeExports } from "./worker-entry-B4jK-wDu.js";
import { c as createLucideIcon, u as useConfirm, L as LoaderCircle, f as firebaseClient, t as toast } from "./router-DRMkp4_G.js";
import { f as fmtDate } from "./format-Bw1R0kSi.js";
import { M as Modal, F as Field, i as inputCls, P as PrimaryBtn } from "./Modal-8BinRw0y.js";
import { S as Sparkles, s as streamAi } from "./ai-COyBpl8Q.js";
import { P as Plus, T as Trash2 } from "./trash-2-CXlCTCsS.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./x-DMSthfi5.js";
const __iconNode = [
  ["path", { d: "M12 17v5", key: "bb1du9" }],
  [
    "path",
    {
      d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",
      key: "1nkz8b"
    }
  ]
];
const Pin = createLucideIcon("pin", __iconNode);
function Notices() {
  const [notices, setNotices] = reactExports.useState([]);
  const [open, setOpen] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({ title: "", body: "", pinned: false });
  const [aiPrompt, setAiPrompt] = reactExports.useState("");
  const [aiBusy, setAiBusy] = reactExports.useState(false);
  const confirm = useConfirm();
  const bodyRef = reactExports.useRef(null);
  const load = async () => {
    const { data } = await firebaseClient.from("notices").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false });
    setNotices(data ?? []);
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const handleAdd = async (e) => {
    e.preventDefault();
    const { error } = await firebaseClient.from("notices").insert(form);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Notice posted");
    setForm({ title: "", body: "", pinned: false });
    setAiPrompt("");
    setOpen(false);
    load();
  };
  const togglePin = async (n) => {
    await firebaseClient.from("notices").update({ pinned: !n.pinned }).eq("id", n.id);
    load();
  };
  const handleDelete = async (id) => {
    if (!await confirm({ title: "Delete this notice?", destructive: true, confirmText: "Delete" })) return;
    await firebaseClient.from("notices").delete().eq("id", id);
    load();
  };
  const draftWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Tell AI what the notice is about");
      return;
    }
    setAiBusy(true);
    setForm((f) => ({ ...f, body: "" }));
    let acc = "";
    await streamAi({
      mode: "draft-notice",
      messages: [{ role: "user", content: aiPrompt }],
      onDelta: (c) => {
        acc += c;
        setForm((f) => ({ ...f, body: acc }));
      }
    });
    setAiBusy(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-end justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground", children: "Communications" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl sm:text-4xl font-black mt-2", children: "Notices" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOpen(true), className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
        " Post notice"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-2 gap-3", children: [
      notices.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `tile p-5 group ${n.pinned ? "border-2 border-foreground/20" : ""}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-black", children: n.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => togglePin(n), className: n.pinned ? "text-foreground" : "text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleDelete(n.id), className: "opacity-0 group-hover:opacity-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 text-muted-foreground hover:text-destructive" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground whitespace-pre-wrap", children: n.body }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-widest text-muted-foreground mt-3", children: fmtDate(n.created_at) })
      ] }, n.id)),
      !notices.length && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-span-full tile p-10 text-center text-sm text-muted-foreground", children: "No notices posted yet." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open, onClose: () => setOpen(false), title: "Post notice", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleAdd, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Title", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: inputCls, value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted rounded-2xl p-3 flex flex-col gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5" }),
          " Draft with AI"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: `${inputCls} bg-surface flex-1`, value: aiPrompt, onChange: (e) => setAiPrompt(e.target.value), placeholder: "e.g. water shutdown saturday 9am-12pm" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: draftWithAI, disabled: aiBusy, className: "px-4 py-3 rounded-2xl bg-foreground text-background text-xs font-bold disabled:opacity-50", children: aiBusy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : "Draft" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Body", children: /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { ref: bodyRef, className: inputCls, rows: 5, value: form.body, onChange: (e) => setForm({ ...form, body: e.target.value }), required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "inline-flex items-center gap-2 text-sm font-semibold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: form.pinned, onChange: (e) => setForm({ ...form, pinned: e.target.checked }), className: "h-4 w-4" }),
        "Pin to top"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryBtn, { type: "submit", children: "Post" })
    ] }) })
  ] });
}
const SplitComponent = Notices;
export {
  SplitComponent as component
};
