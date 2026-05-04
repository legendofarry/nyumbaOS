import { r as reactExports, W as jsxRuntimeExports } from "./worker-entry-B4jK-wDu.js";
import { c as createLucideIcon, u as useConfirm, m as motion, L as LoaderCircle, f as firebaseClient, t as toast } from "./router-DRMkp4_G.js";
import { i as inputCls, M as Modal, F as Field, P as PrimaryBtn } from "./Modal-8BinRw0y.js";
import { D as Download, e as exportToCSV } from "./csv-BpZ5TyPB.js";
import { P as Plus, T as Trash2 } from "./trash-2-CXlCTCsS.js";
import { C as CircleCheck } from "./circle-check-BKm0P2ty.js";
import { T as Ticket } from "./ticket-Ch0cwBcx.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./x-DMSthfi5.js";
const __iconNode$1 = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
];
const Copy = createLucideIcon("copy", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
      key: "9njp5v"
    }
  ]
];
const Phone = createLucideIcon("phone", __iconNode);
const genCode = () => {
  const c = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += c[Math.floor(Math.random() * c.length)];
  return `${s.slice(0, 4)}-${s.slice(4)}`;
};
function Tenants() {
  const [tenants, setTenants] = reactExports.useState([]);
  const [unassignedTenants, setUnassignedTenants] = reactExports.useState([]);
  const [units, setUnits] = reactExports.useState([]);
  const [invites, setInvites] = reactExports.useState([]);
  const [requests, setRequests] = reactExports.useState([]);
  const [openInvite, setOpenInvite] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({ unit_id: "", full_name: "", phone: "" });
  const [requestUnits, setRequestUnits] = reactExports.useState({});
  const [busy, setBusy] = reactExports.useState(false);
  const confirm = useConfirm();
  const load = async () => {
    const [roles, profiles, u, i, r] = await Promise.all([
      firebaseClient.from("user_roles").select("*").eq("role", "tenant"),
      firebaseClient.from("profiles").select("*"),
      firebaseClient.from("units").select("*").order("floor").order("number"),
      firebaseClient.from("invites").select("*").order("created_at", { ascending: false }),
      firebaseClient.from("tenant_requests").select("*").order("created_at", { ascending: false })
    ]);
    const tenantIds = new Set((roles.data ?? []).map((role) => role.user_id));
    const tenantProfiles = (profiles.data ?? []).filter((profile) => tenantIds.has(profile.id));
    setTenants(tenantProfiles.filter((profile) => Boolean(profile.unit_id)));
    setUnassignedTenants(tenantProfiles.filter((profile) => !profile.unit_id));
    setUnits(u.data ?? []);
    setInvites(i.data ?? []);
    setRequests(r.data ?? []);
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const availableUnits = units.filter((u) => !tenants.some((t) => t.unit_id === u.id) && !invites.some((i) => i.unit_id === u.id && !i.used));
  const waitingRequests = requests.filter((request) => request.status === "waiting");
  const handleInvite = async (e) => {
    e.preventDefault();
    setBusy(true);
    const code = genCode();
    const { error } = await firebaseClient.from("invites").insert({
      unit_id: form.unit_id,
      code,
      full_name: form.full_name,
      phone: form.phone || null
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Invite created: ${code}`);
    setForm({ unit_id: "", full_name: "", phone: "" });
    setOpenInvite(false);
    load();
  };
  const handleDeleteTenant = async (t) => {
    if (!await confirm({ title: `Remove ${t.full_name}?`, description: "Their account access will be revoked.", destructive: true, confirmText: "Remove" })) return;
    if (t.unit_id) await firebaseClient.from("units").update({ status: "Vacant" }).eq("id", t.unit_id);
    if (t.unit_id) await firebaseClient.from("tenant_logins").delete().eq("id", t.unit_id);
    await firebaseClient.from("profiles").update({ unit_id: null }).eq("id", t.id);
    await firebaseClient.from("user_roles").delete().eq("user_id", t.id);
    toast.success("Tenant removed");
    load();
  };
  const handleDeleteInvite = async (id) => {
    if (!await confirm({ title: "Delete this invite?", destructive: true, confirmText: "Delete" })) return;
    await firebaseClient.from("invites").delete().eq("id", id);
    toast.success("Invite deleted");
    load();
  };
  const approveRequest = async (request) => {
    const unitId = requestUnits[request.id];
    if (!unitId) {
      toast.error("Select a unit first");
      return;
    }
    setBusy(true);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const code = genCode();
    const invite = await firebaseClient.from("invites").insert({
      unit_id: unitId,
      code,
      full_name: request.full_name,
      phone: request.phone || null,
      request_id: request.id,
      used: false,
      created_at: now
    });
    if (invite.error) {
      setBusy(false);
      toast.error(invite.error.message ?? "Could not create invite");
      return;
    }
    const update = await firebaseClient.from("tenant_requests").update({
      status: "approved",
      unit_id: unitId,
      invite_code: code,
      updated_at: now
    }).eq("id", request.id);
    setBusy(false);
    if (update.error) {
      toast.error(update.error.message ?? "Could not approve request");
      return;
    }
    toast.success(`Invite sent: ${code}`);
    load();
  };
  const assignTenant = async (tenant) => {
    const unitId = requestUnits[tenant.id];
    if (!unitId) {
      toast.error("Select a unit first");
      return;
    }
    setBusy(true);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const profileUpdate = await firebaseClient.from("profiles").update({
      unit_id: unitId,
      updated_at: now
    }).eq("id", tenant.id);
    if (profileUpdate.error) {
      setBusy(false);
      toast.error(profileUpdate.error.message ?? "Could not assign tenant");
      return;
    }
    await firebaseClient.from("tenant_logins").insert({
      id: unitId,
      unit_id: unitId,
      user_id: tenant.id,
      login_email: tenant.login_email,
      created_at: now
    });
    await firebaseClient.from("units").update({ status: "Occupied" }).eq("id", unitId);
    setBusy(false);
    toast.success("Tenant assigned to unit");
    load();
  };
  const declineRequest = async (request) => {
    if (!await confirm({ title: `Decline ${request.full_name}?`, destructive: true, confirmText: "Decline" })) return;
    await firebaseClient.from("tenant_requests").update({
      status: "declined",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", request.id);
    toast.success("Request declined");
    load();
  };
  const copy = (code) => {
    const url = `${window.location.origin}/tenant-accept`;
    navigator.clipboard.writeText(`Join your unit on PropertyHQ: ${url}
Invite code: ${code}`);
    toast.success("Invite copied to clipboard");
  };
  const exportTenants = () => {
    exportToCSV(tenants.map((t) => ({
      name: t.full_name,
      phone: t.phone ?? "",
      unit: units.find((u) => u.id === t.unit_id)?.number ?? "",
      joined: new Date(t.created_at).toLocaleDateString()
    })), "tenants.csv");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-end justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground", children: "Residents" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl sm:text-4xl font-black mt-2", children: "Tenants" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: exportTenants, className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted font-semibold text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
          " CSV"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOpenInvite(true), disabled: !availableUnits.length, className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-sm disabled:opacity-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          " Invite tenant"
        ] })
      ] })
    ] }),
    waitingRequests.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-black mb-3 text-sm uppercase tracking-widest text-muted-foreground", children: "Tenant registrations" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: waitingRequests.map((request) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 bg-muted rounded-2xl p-3 md:grid-cols-[1fr_220px_auto] md:items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm", children: request.full_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-1", children: request.phone })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            className: inputCls,
            value: requestUnits[request.id] ?? "",
            onChange: (e) => setRequestUnits({ ...requestUnits, [request.id]: e.target.value }),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Assign unit..." }),
              availableUnits.map((unit) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: unit.id, children: [
                "Unit ",
                unit.number,
                " - ",
                unit.bedrooms
              ] }, unit.id))
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => approveRequest(request),
              disabled: busy,
              className: "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-foreground text-background text-xs font-bold disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5" }),
                " Approve"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => declineRequest(request), className: "px-3 py-2 rounded-xl bg-destructive/10 text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
        ] })
      ] }, request.id)) })
    ] }),
    unassignedTenants.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-black mb-3 text-sm uppercase tracking-widest text-muted-foreground", children: "Unassigned tenant accounts" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: unassignedTenants.map((tenant) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 bg-muted rounded-2xl p-3 md:grid-cols-[1fr_220px_auto] md:items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm", children: tenant.full_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-1", children: tenant.phone || "No phone" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            className: inputCls,
            value: requestUnits[tenant.id] ?? "",
            onChange: (e) => setRequestUnits({ ...requestUnits, [tenant.id]: e.target.value }),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Assign unit..." }),
              availableUnits.map((unit) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: unit.id, children: [
                "Unit ",
                unit.number,
                " - ",
                unit.bedrooms
              ] }, unit.id))
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => assignTenant(tenant),
            disabled: busy || !tenant.login_email,
            className: "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-foreground text-background text-xs font-bold disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5" }),
              " Assign"
            ]
          }
        )
      ] }, tenant.id)) })
    ] }),
    invites.filter((i) => !i.used).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-black mb-3 text-sm uppercase tracking-widest text-muted-foreground", children: "Pending invites" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: invites.filter((i) => !i.used).map((i) => {
        const unit = units.find((u) => u.id === i.unit_id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 bg-muted rounded-2xl p-3 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold text-sm", children: [
              i.full_name,
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-normal", children: [
                "→ Unit ",
                unit?.number
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-xs mt-1", children: i.code })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => copy(i.code), className: "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-foreground text-background text-xs font-bold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3.5 w-3.5" }),
              " Copy invite"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleDeleteInvite(i.id), className: "px-3 py-2 rounded-xl bg-destructive/10 text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] })
        ] }, i.id);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-3", children: [
      tenants.map((t) => {
        const unit = units.find((u) => u.id === t.unit_id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { layout: true, className: "tile p-5 group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-2xl bg-foreground text-background grid place-items-center text-lg font-black", children: t.full_name.charAt(0).toUpperCase() }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleDeleteTenant(t), className: "opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 hover:text-destructive" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-black text-base", children: t.full_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
              "Unit ",
              unit?.number,
              " · ",
              unit?.bedrooms
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex gap-2", children: t.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `tel:${t.phone}`, className: "flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-2xl bg-muted text-xs font-bold hover:bg-foreground hover:text-background", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-3.5 w-3.5" }),
            " Call"
          ] }) })
        ] }, t.id);
      }),
      !tenants.length && !invites.filter((i) => !i.used).length && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-full tile p-10 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Ticket, { className: "h-8 w-8 mx-auto mb-3 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No tenants yet. Send an invite to onboard your first resident." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: openInvite, onClose: () => setOpenInvite(false), title: "Invite tenant", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleInvite, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Unit", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: inputCls, value: form.unit_id, onChange: (e) => setForm({ ...form, unit_id: e.target.value }), required: true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select a vacant unit…" }),
        availableUnits.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: u.id, children: [
          "Unit ",
          u.number,
          " · ",
          u.floor === 0 ? "Ground" : "First",
          " · ",
          u.bedrooms
        ] }, u.id))
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Full name", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: inputCls, value: form.full_name, onChange: (e) => setForm({ ...form, full_name: e.target.value }), required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Phone (optional)", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: inputCls, value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }), placeholder: "+254…" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryBtn, { type: "submit", disabled: busy, children: busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mx-auto" }) : "Generate invite" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground text-center", children: "Share the generated code with your tenant. They'll use it to set their password." })
    ] }) })
  ] });
}
const SplitComponent = Tenants;
export {
  SplitComponent as component
};
