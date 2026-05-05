import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Download, Loader2, Phone, Ticket as TicketIcon, Trash2 } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { inputCls } from "@/components/Modal";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import type { Unit, Profile } from "@/lib/types";
import { exportToCSV } from "@/lib/csv";

export function Tenants() {
  const [tenants, setTenants] = useState<Profile[]>([]);
  const [unassignedTenants, setUnassignedTenants] = useState<Profile[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const confirm = useConfirm();

  const load = async () => {
    const [roles, profiles, unitList] = await Promise.all([
      firebaseClient.from("user_roles").select("*").eq("role", "tenant"),
      firebaseClient.from("profiles").select("*"),
      firebaseClient.from("units").select("*").order("floor").order("number"),
    ]);

    const roleRows = (roles.data as any[]) ?? [];
    const tenantIds = new Set(roleRows.map((role) => role.user_id));
    const tenantProfiles = ((profiles.data as Profile[]) ?? []).filter((profile) => (
      tenantIds.has(profile.id) || Boolean(profile.login_email)
    ));

    setTenants(tenantProfiles.filter((profile) => Boolean(profile.unit_id)));
    setUnassignedTenants(tenantProfiles.filter((profile) => !profile.unit_id));
    setUnits((unitList.data as Unit[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const occupiedUnitIds = new Set(tenants.map((tenant) => tenant.unit_id).filter(Boolean));
  const availableUnits = units.filter((unit) => !occupiedUnitIds.has(unit.id) && unit.status !== "Occupied");

  const assignTenant = async (tenant: Profile) => {
    const unitId = selectedUnits[tenant.id];
    if (!unitId) {
      toast.error("Select a unit first");
      return;
    }

    if (!tenant.login_email) {
      toast.error("This tenant account is missing its login email.");
      return;
    }

    setBusyId(tenant.id);
    const now = new Date().toISOString();

    const profileUpdate = await firebaseClient.from("profiles").update({
      unit_id: unitId,
      updated_at: now,
    }).eq("id", tenant.id);

    if (profileUpdate.error) {
      setBusyId(null);
      toast.error(profileUpdate.error.message ?? "Could not assign tenant");
      return;
    }

    const loginRef = await firebaseClient.from("tenant_logins").insert({
      id: unitId,
      unit_id: unitId,
      user_id: tenant.id,
      login_email: tenant.login_email,
      created_at: now,
    });

    if (loginRef.error) {
      setBusyId(null);
      toast.error(loginRef.error.message ?? "Could not create unit login");
      return;
    }

    await firebaseClient.from("user_roles").insert({
      id: tenant.id,
      user_id: tenant.id,
      role: "tenant",
      created_at: now,
    });
    await firebaseClient.from("units").update({ status: "Occupied" }).eq("id", unitId);
    setBusyId(null);
    toast.success("Tenant invited to the unit");
    load();
  };

  const handleDeleteTenant = async (tenant: Profile) => {
    if (!(await confirm({
      title: `Remove ${tenant.full_name}?`,
      description: "Their tenant access will be revoked.",
      destructive: true,
      confirmText: "Remove",
    }))) return;

    setBusyId(tenant.id);
    if (tenant.unit_id) {
      await firebaseClient.from("units").update({ status: "Vacant" }).eq("id", tenant.unit_id);
      await firebaseClient.from("tenant_logins").delete().eq("id", tenant.unit_id);
    }
    await firebaseClient.from("profiles").update({ unit_id: null }).eq("id", tenant.id);
    await firebaseClient.from("user_roles").delete().eq("user_id", tenant.id);
    setBusyId(null);
    toast.success("Tenant removed");
    load();
  };

  const exportTenants = () => {
    exportToCSV(tenants.map((tenant) => ({
      name: tenant.full_name,
      phone: tenant.phone ?? "",
      unit: units.find((unit) => unit.id === tenant.unit_id)?.number ?? "",
      joined: new Date(tenant.created_at).toLocaleDateString(),
    })), "tenants.csv");
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Residents</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-2">Tenants</h1>
        </div>
        <button onClick={exportTenants} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted font-semibold text-sm">
          <Download className="h-4 w-4" /> CSV
        </button>
      </header>

      {unassignedTenants.length > 0 && (
        <div className="tile p-5">
          <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Waiting for invitation</h3>
          <p className="mt-2 mb-4 text-sm text-muted-foreground">
            These tenants already registered. Choose a vacant unit and invite them by attaching that unit to their account.
          </p>
          <div className="space-y-2">
            {unassignedTenants.map((tenant) => (
              <div key={tenant.id} className="grid gap-3 bg-muted rounded-2xl p-3 md:grid-cols-[1fr_220px_auto] md:items-center">
                <div>
                  <div className="font-bold text-sm">{tenant.full_name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{tenant.phone || "No phone"}</div>
                </div>
                <select
                  className={inputCls}
                  value={selectedUnits[tenant.id] ?? ""}
                  onChange={(e) => setSelectedUnits({ ...selectedUnits, [tenant.id]: e.target.value })}
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
                  disabled={busyId === tenant.id || !availableUnits.length}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-foreground text-background text-xs font-bold disabled:opacity-50"
                >
                  {busyId === tenant.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Invite
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tenants.map((tenant) => {
          const unit = units.find((item) => item.id === tenant.unit_id);
          return (
            <motion.div key={tenant.id} layout className="tile p-5 group">
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-2xl bg-foreground text-background grid place-items-center text-lg font-black">
                  {tenant.full_name.charAt(0).toUpperCase()}
                </div>
                <button onClick={() => handleDeleteTenant(tenant)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {busyId === tenant.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 hover:text-destructive" />}
                </button>
              </div>
              <div className="mt-4">
                <div className="font-black text-base">{tenant.full_name}</div>
                <div className="text-xs text-muted-foreground mt-1">Unit {unit?.number} - {unit?.bedrooms}</div>
              </div>
              <div className="mt-4 flex gap-2">
                {tenant.phone && (
                  <a href={`tel:${tenant.phone}`} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-2xl bg-muted text-xs font-bold hover:bg-foreground hover:text-background">
                    <Phone className="h-3.5 w-3.5" /> Call
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
        {!tenants.length && !unassignedTenants.length && (
          <div className="col-span-full tile p-10 text-center">
            <TicketIcon className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No tenants yet. Tenant signups will appear here so you can invite them to a unit.</p>
          </div>
        )}
      </div>
    </div>
  );
}
