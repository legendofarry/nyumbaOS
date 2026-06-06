import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/client";
import { useSessionProfile } from "@/lib/use-profile";
import { Money } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { PhysicsButton } from "@/components/PhysicsButton";
import { PhysicsInput } from "@/components/PhysicsInput";
import { PhysicsSheet } from "@/components/PhysicsSheet";
import { PhysicsTextarea } from "@/components/PhysicsTextarea";
import { PhysicsSelect } from "@/components/PhysicsSelect";
import { ArrowLeft, MessageCircle, Plus, Trash2, Phone } from "lucide-react";
import { toast } from "sonner";
import { deleteTenantClient } from "@/lib/serverFns";

export const Route = createFileRoute("/app/tenants/$id")({
  component: TenantProfile,
});

function TenantProfile() {
  const { id } = useParams({ from: "/app/tenants/$id" });
  const { data: me } = useSessionProfile();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const del = (opts: any) => deleteTenantClient(opts.data);

  const tenant = useQuery({
    queryKey: ["tenant", id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", id).maybeSingle()).data,
  });
  const unit = useQuery({
    queryKey: ["tenant-unit", tenant.data?.unit_id],
    enabled: !!tenant.data?.unit_id,
    queryFn: async () => (await supabase.from("units").select("*").eq("id", tenant.data!.unit_id as string).maybeSingle()).data,
  });
  const payments = useQuery({
    queryKey: ["tenant-payments", id],
    queryFn: async () => (await supabase.from("payments").select("*").eq("tenant_id", id).order("created_at", { ascending: false })).data ?? [],
  });

  if (!tenant.data) return <div className="px-5 pt-6 text-sm text-muted-foreground">Loading…</div>;

  const paid = (payments.data ?? []).reduce((s, p: any) => s + Number(p.amount_ksh), 0);
  const owed = Math.max(0, Number(tenant.data.agreed_rent ?? 0) - paid);
  const isOwner = me?.role === "owner";

  return (
    <div>
      <header className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-2 flex items-center gap-2">
        <Link to={isOwner ? "/app/tenants" : "/app/people"} className="glass p-2.5 rounded-full"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="ml-auto flex gap-2">
          <Link to="/app/messages/$id" params={{ id: tenant.data.id }}>
            <PhysicsButton variant="glass" size="sm"><MessageCircle className="h-4 w-4" /> Message</PhysicsButton>
          </Link>
        </div>
      </header>

      <div className="px-5 space-y-4">
        <div className="glass-strong rounded-3xl p-5 flex flex-col items-center text-center">
          <Avatar name={tenant.data.full_name} url={tenant.data.avatar_url} size={88} />
          <div className="mt-3 font-display text-2xl font-bold">{tenant.data.full_name}</div>
          <div className="text-sm text-muted-foreground">{unit.data?.label ?? "Unassigned"}{unit.data ? ` · ${unit.data.floor} floor` : ""}</div>
          {tenant.data.phone && (
            <a href={`tel:${tenant.data.phone}`} className="mt-2 text-xs flex items-center gap-1 text-teal"><Phone className="h-3 w-3" />{tenant.data.phone}</a>
          )}
          {tenant.data.bio && <p className="mt-3 text-sm text-muted-foreground max-w-xs">{tenant.data.bio}</p>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="glass rounded-2xl p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rent</div>
            <div className="font-bold mt-1 text-sm"><Money value={tenant.data.agreed_rent} /></div>
          </div>
          <div className="glass rounded-2xl p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Paid</div>
            <div className="font-bold mt-1 text-sm text-teal"><Money value={paid} /></div>
          </div>
          <div className="glass rounded-2xl p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Owed</div>
            <div className={`font-bold mt-1 text-sm ${owed > 0 ? "text-destructive" : "text-teal"}`}><Money value={owed} /></div>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Payments</div>
          {isOwner && <PhysicsButton size="sm" variant="glass" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Log</PhysicsButton>}
        </div>
        <div className="space-y-2">
          {(payments.data ?? []).map((p: any) => (
            <div key={p.id} className="glass rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold capitalize">{p.kind}</div>
                <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}{p.note ? ` · ${p.note}` : ""}</div>
              </div>
              <div className="font-semibold text-teal"><Money value={Number(p.amount_ksh)} /></div>
            </div>
          ))}
          {!payments.data?.length && <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No payments yet</div>}
        </div>

        {isOwner && (
          <PhysicsButton variant="danger" className="w-full mt-4" onClick={async () => {
            if (!confirm("Remove this tenant? This deletes their account.")) return;
            await del({ data: { tenant_id: tenant.data!.id } });
            qc.invalidateQueries({ queryKey: ["tenants"] });
            toast.success("Tenant removed");
            history.back();
          }}>
            <Trash2 className="h-4 w-4" /> Remove tenant
          </PhysicsButton>
        )}
      </div>

      <PhysicsSheet open={open} onClose={() => setOpen(false)} title="Log payment">
        <LogPaymentForm tenantId={tenant.data.id} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["tenant-payments", id] }); qc.invalidateQueries({ queryKey: ["payments-all"] }); }} />
      </PhysicsSheet>
    </div>
  );
}

function LogPaymentForm({ tenantId, onDone }: { tenantId: string; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<string | null>("rent");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!amount) { toast.error("Enter an amount"); return; }
    setBusy(true);
    const { error } = await supabase.from("payments").insert({
      tenant_id: tenantId,
      amount_ksh: Number(amount),
      kind: kind ?? "rent",
      note: note || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Payment logged");
    onDone();
  }

  return (
    <div className="space-y-3">
      <PhysicsInput label="Amount (KSh)" inputMode="numeric" prefix="KSh" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
      <PhysicsSelect label="Kind" value={kind} onChange={setKind} options={[
        { value: "rent", label: "Rent" },
        { value: "deposit", label: "Deposit" },
        { value: "water", label: "Water" },
        { value: "other", label: "Other" },
      ]} />
      <PhysicsTextarea label="Note" placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />
      <PhysicsButton size="lg" className="w-full" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Save"}</PhysicsButton>
    </div>
  );
}