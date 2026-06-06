import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/client";
import { useSessionProfile } from "@/lib/use-profile";
import { PageHeader, Money } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { PhysicsButton } from "@/components/PhysicsButton";
import { PhysicsInput } from "@/components/PhysicsInput";
import { PhysicsSelect } from "@/components/PhysicsSelect";
import { PhysicsSheet } from "@/components/PhysicsSheet";
import { PhysicsTextarea } from "@/components/PhysicsTextarea";
import { createTenantClient } from "@/lib/serverFns";
import { Plus, ChevronRight, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tenants")({
  component: TenantsPage,
});

function TenantsPage() {
  const { data: profile } = useSessionProfile();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);

  const tenants = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("role", "tenant")).data ?? [],
  });
  const units = useQuery({
    queryKey: ["units"],
    queryFn: async () => (await supabase.from("units").select("*").order("floor").order("label")).data ?? [],
  });

  if (profile?.role !== "owner") {
    return <div className="px-5 pt-6 text-sm text-muted-foreground">Only the owner can manage tenants.</div>;
  }

  const occupiedUnitIds = new Set((tenants.data ?? []).map((t: any) => t.unit_id));
  const freeUnits = (units.data ?? []).filter((u: any) => !occupiedUnitIds.has(u.id));

  return (
    <div>
      <PageHeader title="Tenants" subtitle={`${tenants.data?.length ?? 0} of ${units.data?.length ?? 0} units occupied`}
        right={
          <PhysicsButton size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add</PhysicsButton>
        } />
      <div className="px-5 space-y-2">
        {(tenants.data ?? []).map((t: any) => {
          const unit = units.data?.find((u: any) => u.id === t.unit_id);
          return (
            <Link key={t.id} to="/app/tenants/$id" params={{ id: t.id }}
              className="glass rounded-2xl p-3 flex items-center gap-3">
              <Avatar name={t.full_name} url={t.avatar_url} size={48} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{t.full_name}</div>
                <div className="text-xs text-muted-foreground truncate">{unit?.label ?? "Unassigned"} · code <span className="font-mono">{t.login_code}</span></div>
                <div className="text-xs text-teal mt-0.5">Rent <Money value={t.agreed_rent} /></div>
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

      <PhysicsSheet open={open} onClose={() => { setOpen(false); setNewCode(null); }} title={newCode ? "Tenant created" : "Register tenant"}>
        {newCode ? (
          <CodeReveal code={newCode} onDone={() => { setOpen(false); setNewCode(null); }} />
        ) : (
          <AddTenantForm units={freeUnits} onCreated={(c) => { setNewCode(c); qc.invalidateQueries({ queryKey: ["tenants"] }); }} />
        )}
      </PhysicsSheet>
    </div>
  );
}

function AddTenantForm({ units, onCreated }: { units: any[]; onCreated: (code: string) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [unitId, setUnitId] = useState<string | null>(null);
  const [rent, setRent] = useState<string>("");
  const [initial, setInitial] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const create = (opts: any) => createTenantClient(opts.data);

  const selectedUnit = units.find((u) => u.id === unitId);

  function pickUnit(id: string) {
    setUnitId(id);
    const u = units.find((x) => x.id === id);
    if (u && !rent) setRent(String(u.rent_amount));
  }

  async function submit() {
    if (!name || !unitId || !rent) { toast.error("Name, unit and rent required"); return; }
    setBusy(true);
    try {
      const r = await create({ data: {
        full_name: name,
        phone: phone || undefined,
        unit_id: unitId,
        agreed_rent: Number(rent),
        initial_payment: Number(initial || 0),
        payment_note: note || undefined,
      }});
      onCreated(r.code);
    } catch (e: any) {
      toast.error(e.message || "Could not create tenant");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <PhysicsInput label="Full name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
      <PhysicsInput label="Phone" placeholder="07XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <PhysicsSelect
        label="Unit"
        value={unitId}
        onChange={pickUnit}
        placeholder="Choose a free unit"
        options={units.map((u) => ({ value: u.id, label: u.label, hint: `${u.floor} floor · KSh ${Number(u.rent_amount).toLocaleString()}` }))}
      />
      <div className="grid grid-cols-2 gap-2">
        <PhysicsInput label="Agreed rent (KSh)" inputMode="numeric" placeholder={selectedUnit ? String(selectedUnit.rent_amount) : "0"} value={rent} onChange={(e) => setRent(e.target.value.replace(/\D/g, ""))} />
        <PhysicsInput label="Initial payment" inputMode="numeric" placeholder="0" value={initial} onChange={(e) => setInitial(e.target.value.replace(/\D/g, ""))} />
      </div>
      <PhysicsTextarea label="Payment note (optional)" placeholder="e.g. June rent + 1000 deposit" value={note} onChange={(e) => setNote(e.target.value)} />
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
      <PhysicsButton variant="glass" onClick={() => { navigator.clipboard.writeText(code); toast.success("Copied"); }}>
        <Copy className="h-4 w-4" /> Copy code
      </PhysicsButton>
      <p className="text-xs text-center text-muted-foreground px-6">Share this code with the tenant. They'll use it to log in and can enable biometrics on their device after.</p>
      <PhysicsButton className="w-full" onClick={onDone}>Done</PhysicsButton>
    </div>
  );
}