import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, Phone, Trash2, Copy, Loader2, Download, Ticket as TicketIcon, CheckCircle2 } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { Modal, Field, inputCls, PrimaryBtn } from "@/components/Modal";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import type { Unit, Profile, Invite, TenantRequest } from "@/lib/types";
import { exportToCSV } from "@/lib/csv";

const genCode = () => {
  const c = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += c[Math.floor(Math.random() * c.length)];
  return `${s.slice(0, 4)}-${s.slice(4)}`;
};

export function Tenants() {
  const [tenants, setTenants] = useState<Profile[]>([]);
  const [unassignedTenants, setUnassignedTenants] = useState<Profile[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [requests, setRequests] = useState<TenantRequest[]>([]);
  const [openInvite, setOpenInvite] = useState(false);
  const [form, setForm] = useState({ unit_id: "", full_name: "", phone: "" });
  const [requestUnits, setRequestUnits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();

  const load = async () => {
    const [roles, profiles, u, i, r] = await Promise.all([
      firebaseClient.from("user_roles").select("*").eq("role", "tenant"),
      firebaseClient.from("profiles").select("*"),
      firebaseClient.from("units").select("*").order("floor").order("number"),
      firebaseClient.from("invites").select("*").order("created_at", { ascending: false }),
      firebaseClient.from("tenant_requests").select("*").order("created_at", { ascending: false }),
    ]);
    const tenantIds = new Set(((roles.data as any[]) ?? []).map((role) => role.user_id));
    const tenantProfiles = ((profiles.data as Profile[]) ?? []).filter((profile) => tenantIds.has(profile.id));
    setTenants(tenantProfiles.filter((profile) => Boolean(profile.unit_id)));
    setUnassignedTenants(tenantProfiles.filter((profile) => !profile.unit_id));
    setUnits((u.data as Unit[]) ?? []);
    setInvites((i.data as Invite[]) ?? []);
    setRequests((r.data as TenantRequest[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const availableUnits = units.filter(u => !tenants.some(t => t.unit_id === u.id) && !invites.some(i => i.unit_id === u.id && !i.used));
  const waitingRequests = requests.filter((request) => request.status === "waiting");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const code = genCode();
    const { error } = await firebaseClient.from("invites").insert({
      unit_id: form.unit_id,
      code,
      full_name: form.full_name,
      phone: form.phone || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Invite created: ${code}`);
    setForm({ unit_id: "", full_name: "", phone: "" });
    setOpenInvite(false);
    load();
  };

  const handleDeleteTenant = async (t: Profile) => {
    if (!(await confirm({ title: `Remove ${t.full_name}?`, description: "Their account access will be revoked.", destructive: true, confirmText: "Remove" }))) return;
    // Mark unit vacant + delete profile (auth user remains but no role)
    if (t.unit_id) await firebaseClient.from("units").update({ status: "Vacant" }).eq("id", t.unit_id);
    if (t.unit_id) await firebaseClient.from("tenant_logins").delete().eq("id", t.unit_id);
    await firebaseClient.from("profiles").update({ unit_id: null }).eq("id", t.id);
    await firebaseClient.from("user_roles").delete().eq("user_id", t.id);
    toast.success("Tenant removed");
    load();
  };

  const handleDeleteInvite = async (id: string) => {
    if (!(await confirm({ title: "Delete this invite?", destructive: true, confirmText: "Delete" }))) return;
    await firebaseClient.from("invites").delete().eq("id", id);
    toast.success("Invite deleted");
    load();
  };

  const approveRequest = async (request: TenantRequest) => {
    const unitId = requestUnits[request.id];
    if (!unitId) {
      toast.error("Select a unit first");
      return;
    }

    setBusy(true);
    const now = new Date().toISOString();
    const code = genCode();
    const invite = await firebaseClient.from("invites").insert({
      unit_id: unitId,
      code,
      full_name: request.full_name,
      phone: request.phone || null,
      request_id: request.id,
      used: false,
      created_at: now,
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
      updated_at: now,
    }).eq("id", request.id);
    setBusy(false);

    if (update.error) {
      toast.error(update.error.message ?? "Could not approve request");
      return;
    }

    toast.success(`Invite sent: ${code}`);
    load();
  };

  const assignTenant = async (tenant: Profile) => {
    const unitId = requestUnits[tenant.id];
    if (!unitId) {
      toast.error("Select a unit first");
      return;
    }

    setBusy(true);
    const now = new Date().toISOString();
    const profileUpdate = await firebaseClient.from("profiles").update({
      unit_id: unitId,
      updated_at: now,
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
      created_at: now,
    });
    await firebaseClient.from("units").update({ status: "Occupied" }).eq("id", unitId);
    setBusy(false);
    toast.success("Tenant assigned to unit");
    load();
  };

  const declineRequest = async (request: TenantRequest) => {
    if (!(await confirm({ title: `Decline ${request.full_name}?`, destructive: true, confirmText: "Decline" }))) return;
    await firebaseClient.from("tenant_requests").update({
      status: "declined",
      updated_at: new Date().toISOString(),
    }).eq("id", request.id);
    toast.success("Request declined");
    load();
  };

  const copy = (code: string) => {
    const url = `${window.location.origin}/tenant-accept`;
    navigator.clipboard.writeText(`Join your unit on PropertyHQ: ${url}\nInvite code: ${code}`);
    toast.success("Invite copied to clipboard");
  };

  const exportTenants = () => {
    exportToCSV(tenants.map(t => ({
      name: t.full_name,
      phone: t.phone ?? "",
      unit: units.find(u => u.id === t.unit_id)?.number ?? "",
      joined: new Date(t.created_at).toLocaleDateString(),
    })), "tenants.csv");
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Residents</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-2">Tenants</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={exportTenants} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted font-semibold text-sm"><Download className="h-4 w-4" /> CSV</button>
          <button onClick={() => setOpenInvite(true)} disabled={!availableUnits.length} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-sm disabled:opacity-50">
            <Plus className="h-4 w-4" /> Invite tenant
          </button>
        </div>
      </header>

      {waitingRequests.length > 0 && (
        <div className="tile p-5">
          <h3 className="font-black mb-3 text-sm uppercase tracking-widest text-muted-foreground">Tenant registrations</h3>
          <div className="space-y-2">
            {waitingRequests.map((request) => (
              <div key={request.id} className="grid gap-3 bg-muted rounded-2xl p-3 md:grid-cols-[1fr_220px_auto] md:items-center">
                <div>
                  <div className="font-bold text-sm">{request.full_name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{request.phone}</div>
                </div>
                <select
                  className={inputCls}
                  value={requestUnits[request.id] ?? ""}
                  onChange={(e) => setRequestUnits({ ...requestUnits, [request.id]: e.target.value })}
                >
                  <option value="">Assign unit...</option>
                  {availableUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      Unit {unit.number} - {unit.bedrooms}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveRequest(request)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-foreground text-background text-xs font-bold disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button onClick={() => declineRequest(request)} className="px-3 py-2 rounded-xl bg-destructive/10 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unassignedTenants.length > 0 && (
        <div className="tile p-5">
          <h3 className="font-black mb-3 text-sm uppercase tracking-widest text-muted-foreground">Unassigned tenant accounts</h3>
          <div className="space-y-2">
            {unassignedTenants.map((tenant) => (
              <div key={tenant.id} className="grid gap-3 bg-muted rounded-2xl p-3 md:grid-cols-[1fr_220px_auto] md:items-center">
                <div>
                  <div className="font-bold text-sm">{tenant.full_name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{tenant.phone || "No phone"}</div>
                </div>
                <select
                  className={inputCls}
                  value={requestUnits[tenant.id] ?? ""}
                  onChange={(e) => setRequestUnits({ ...requestUnits, [tenant.id]: e.target.value })}
                >
                  <option value="">Assign unit...</option>
                  {availableUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      Unit {unit.number} - {unit.bedrooms}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => assignTenant(tenant)}
                  disabled={busy || !tenant.login_email}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-foreground text-background text-xs font-bold disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Assign
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending invites */}
      {invites.filter(i => !i.used).length > 0 && (
        <div className="tile p-5">
          <h3 className="font-black mb-3 text-sm uppercase tracking-widest text-muted-foreground">Pending invites</h3>
          <div className="space-y-2">
            {invites.filter(i => !i.used).map(i => {
              const unit = units.find(u => u.id === i.unit_id);
              return (
                <div key={i.id} className="flex items-center justify-between gap-3 bg-muted rounded-2xl p-3 flex-wrap">
                  <div>
                    <div className="font-bold text-sm">{i.full_name} <span className="text-muted-foreground font-normal">→ Unit {unit?.number}</span></div>
                    <div className="font-mono text-xs mt-1">{i.code}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => copy(i.code)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-foreground text-background text-xs font-bold"><Copy className="h-3.5 w-3.5" /> Copy invite</button>
                    <button onClick={() => handleDeleteInvite(i.id)} className="px-3 py-2 rounded-xl bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tenants */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tenants.map(t => {
          const unit = units.find(u => u.id === t.unit_id);
          return (
            <motion.div key={t.id} layout className="tile p-5 group">
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-2xl bg-foreground text-background grid place-items-center text-lg font-black">{t.full_name.charAt(0).toUpperCase()}</div>
                <button onClick={() => handleDeleteTenant(t)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4 hover:text-destructive" /></button>
              </div>
              <div className="mt-4">
                <div className="font-black text-base">{t.full_name}</div>
                <div className="text-xs text-muted-foreground mt-1">Unit {unit?.number} · {unit?.bedrooms}</div>
              </div>
              <div className="mt-4 flex gap-2">
                {t.phone && (
                  <a href={`tel:${t.phone}`} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-2xl bg-muted text-xs font-bold hover:bg-foreground hover:text-background">
                    <Phone className="h-3.5 w-3.5" /> Call
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
        {!tenants.length && !invites.filter(i => !i.used).length && (
          <div className="col-span-full tile p-10 text-center">
            <TicketIcon className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No tenants yet. Send an invite to onboard your first resident.</p>
          </div>
        )}
      </div>

      <Modal open={openInvite} onClose={() => setOpenInvite(false)} title="Invite tenant">
        <form onSubmit={handleInvite} className="flex flex-col gap-4">
          <Field label="Unit">
            <select className={inputCls} value={form.unit_id} onChange={e => setForm({ ...form, unit_id: e.target.value })} required>
              <option value="">Select a vacant unit…</option>
              {availableUnits.map(u => (
                <option key={u.id} value={u.id}>Unit {u.number} · {u.floor === 0 ? "Ground" : "First"} · {u.bedrooms}</option>
              ))}
            </select>
          </Field>
          <Field label="Full name"><input className={inputCls} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required /></Field>
          <Field label="Phone (optional)"><input className={inputCls} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+254…" /></Field>
          <PrimaryBtn type="submit" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Generate invite"}</PrimaryBtn>
          <p className="text-xs text-muted-foreground text-center">Share the generated code with your tenant. They'll use it to set their password.</p>
        </form>
      </Modal>
    </div>
  );
}
