import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { Copy, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { db } from "@/integrations/client";
import type { Profile, Unit } from "@/integrations/types";
import { getUnits } from "@/lib/units";
import { createTenant } from "@/lib/apt.functions";
import { fromCollection, sortByName } from "@/lib/firestore";
import { useSessionProfile } from "@/lib/use-profile";
import { Avatar } from "@/components/Avatar";
import { Money, PageHeader } from "@/components/AppShell";
import { PhysicsButton } from "@/components/PhysicsButton";
import { PhysicsInput } from "@/components/PhysicsInput";
import { PhysicsSelect } from "@/components/PhysicsSelect";
import { PhysicsSheet } from "@/components/PhysicsSheet";
import { PhysicsTextarea } from "@/components/PhysicsTextarea";

export const Route = createFileRoute("/app/tenants")({
  component: TenantsPage,
});

function TenantsPage() {
  const { data: profile } = useSessionProfile();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const loc = useLocation();
  const isChildRoute = /^\/app\/tenants\/[^/]+$/.test(loc.pathname);

  const tenants = useQuery({
    queryKey: ["tenants"],
    enabled: !isChildRoute,
    queryFn: async () =>
      sortByName(fromCollection<Profile>(await getDocs(collection(db, "profiles"))).filter((person) => person.role === "tenant")),
  });
  const units = useQuery({
    queryKey: ["units"],
    enabled: !isChildRoute,
    queryFn: async () => (await getUnits()).sort((a, b) => `${a.floor}-${a.label}`.localeCompare(`${b.floor}-${b.label}`)),
    onError: (err) => console.error("units fetch error:", err),
  });

  // If URL is /app/tenants/:id, render the child route full-screen via Outlet
  if (isChildRoute) {
    return <Outlet />;
  }

  // Allow non-owner users to view tenant profiles (read-only). Owner-only actions
  // (adding tenants) are shown conditionally below.

  const occupiedUnitIds = new Set((tenants.data ?? []).map((tenant) => tenant.unit_id));
  const freeUnits = (units.data ?? []).filter((unit) => !occupiedUnitIds.has(unit.id));

  return (
    <div>
      <PageHeader
        title="Tenants"
        subtitle={`${tenants.data?.length ?? 0} of ${units.data?.length ?? 0} units occupied`}
        right={
          profile?.role === "owner" ? (
            <PhysicsButton size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add
            </PhysicsButton>
          ) : null
        }
      />
      <div className="space-y-2 px-5">
        {units.isError && <div className="glass rounded-2xl p-4 text-center text-sm text-destructive">Failed to load units — check console</div>}
        {(tenants.data ?? []).map((tenant) => {
          const unit = units.data?.find((entry) => entry.id === tenant.unit_id);
          return (
            <Link
              key={tenant.id}
              to="/app/tenants/$id"
              params={{ id: tenant.id }}
              className="glass flex items-center gap-3 rounded-2xl p-3"
            >
              <Avatar name={tenant.full_name} url={tenant.avatar_url} size={48} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{tenant.full_name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {unit?.label ?? "Unassigned"} · code <span className="font-mono">{tenant.login_code}</span>
                </div>
                <div className="mt-0.5 text-xs text-teal">
                  Rent <Money value={tenant.agreed_rent} />
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          );
        })}
        {!tenants.data?.length && (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No tenants registered yet.
          </div>
        )}
      </div>

      <PhysicsSheet
        open={open}
        onClose={() => {
          setOpen(false);
          setNewCode(null);
        }}
        title={newCode ? "Tenant created" : "Register tenant"}
      >
        {newCode ? (
          <CodeReveal
            code={newCode}
            onDone={() => {
              setOpen(false);
              setNewCode(null);
            }}
          />
        ) : (
          <AddTenantForm
            units={freeUnits}
            onCreated={(code) => {
              setNewCode(code);
              qc.invalidateQueries({ queryKey: ["tenants"] });
            }}
          />
        )}
      </PhysicsSheet>
    </div>
  );
}

function AddTenantForm({ units, onCreated }: { units: Unit[]; onCreated: (code: string) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [unitId, setUnitId] = useState<string | null>(null);
  const [rent, setRent] = useState<string>("");
  const [initial, setInitial] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedUnit = units.find((unit) => unit.id === unitId);

  function pickUnit(id: string) {
    setUnitId(id);
    const unit = units.find((entry) => entry.id === id);
    if (unit && !rent) setRent(String(unit.rent_amount));
  }

  async function submit() {
    if (!name || !unitId || !rent) {
      toast.error("Name, unit and rent required");
      return;
    }

    setBusy(true);
    try {
      const result = await createTenant({
        full_name: name,
        phone: phone || undefined,
        unit_id: unitId,
        agreed_rent: Number(rent),
        initial_payment: Number(initial || 0),
        payment_note: note || undefined,
      });
      onCreated(result.code);
    } catch (error: any) {
      toast.error(error.message || "Could not create tenant");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <PhysicsInput label="Full name" placeholder="Jane Doe" value={name} onChange={(event) => setName(event.target.value)} />
      <PhysicsInput label="Phone" placeholder="07XX XXX XXX" value={phone} onChange={(event) => setPhone(event.target.value)} />
      <PhysicsSelect
        label="Unit"
        value={unitId}
        onChange={pickUnit}
        placeholder="Choose a free unit"
        options={units.map((unit) => ({
          value: unit.id,
          label: unit.label,
          hint: `${unit.floor} floor · KSh ${Number(unit.rent_amount).toLocaleString()}`,
        }))}
      />
      <div className="grid grid-cols-2 gap-2">
        <PhysicsInput
          label="Agreed rent (KSh)"
          inputMode="numeric"
          placeholder={selectedUnit ? String(selectedUnit.rent_amount) : "0"}
          value={rent}
          onChange={(event) => setRent(event.target.value.replace(/\D/g, ""))}
        />
        <PhysicsInput
          label="Initial payment"
          inputMode="numeric"
          placeholder="0"
          value={initial}
          onChange={(event) => setInitial(event.target.value.replace(/\D/g, ""))}
        />
      </div>
      <PhysicsTextarea
        label="Payment note (optional)"
        placeholder="e.g. June rent + 1000 deposit"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <PhysicsButton size="lg" className="w-full" disabled={busy} onClick={submit}>
        {busy ? "Creating…" : "Create tenant"}
      </PhysicsButton>
    </div>
  );
}

function CodeReveal({ code, onDone }: { code: string; onDone: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Their 4-digit login code</div>
      <div className="font-display text-6xl font-bold tracking-[0.2em] text-teal">{code}</div>
      <PhysicsButton
        variant="glass"
        onClick={() => {
          navigator.clipboard.writeText(code);
          toast.success("Copied");
        }}
      >
        <Copy className="h-4 w-4" /> Copy code
      </PhysicsButton>
      <p className="px-6 text-center text-xs text-muted-foreground">
        Share this code with the tenant. They'll use it to log in and can enable biometrics on their device after.
      </p>
      <PhysicsButton className="w-full" onClick={onDone}>
        Done
      </PhysicsButton>
    </div>
  );
}
