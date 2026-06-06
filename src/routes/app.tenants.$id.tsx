import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDoc, collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { ArrowLeft, MessageCircle, Phone, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { db } from "@/integrations/client";
import type { Payment, Profile, Unit } from "@/integrations/types";
import { deleteTenant } from "@/lib/apt.functions";
import { fromCollection, sortByCreatedAtDesc } from "@/lib/firestore";
import { useSessionProfile } from "@/lib/use-profile";
import { Avatar } from "@/components/Avatar";
import { Money } from "@/components/AppShell";
import { PhysicsButton } from "@/components/PhysicsButton";
import { PhysicsInput } from "@/components/PhysicsInput";
import { PhysicsSelect } from "@/components/PhysicsSelect";
import { PhysicsSheet } from "@/components/PhysicsSheet";
import { PhysicsTextarea } from "@/components/PhysicsTextarea";

export const Route = createFileRoute("/app/tenants/$id")({
  component: TenantProfile,
});

function TenantProfile() {
  const { id } = useParams({ from: "/app/tenants/$id" });
  const { data: me } = useSessionProfile();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const tenant = useQuery({
    queryKey: ["tenant", id],
    queryFn: async () => {
      const snapshot = await getDoc(doc(db, "profiles", id));
      return snapshot.exists() ? ({ id: snapshot.id, ...(snapshot.data() as Profile) } as Profile) : null;
    },
  });
  const unit = useQuery({
    queryKey: ["tenant-unit", tenant.data?.unit_id],
    enabled: !!tenant.data?.unit_id,
    queryFn: async () => {
      if (!tenant.data?.unit_id) return null;
      const snapshot = await getDoc(doc(db, "units", tenant.data.unit_id));
      return snapshot.exists() ? ({ id: snapshot.id, ...(snapshot.data() as Unit) } as Unit) : null;
    },
  });
  const payments = useQuery({
    queryKey: ["tenant-payments", id],
    queryFn: async () => sortByCreatedAtDesc(fromCollection<Payment>(await getDocs(query(collection(db, "payments"), where("tenant_id", "==", id))))),
  });

  if (!tenant.data) return <div className="px-5 pt-6 text-sm text-muted-foreground">Loading…</div>;

  const paid = (payments.data ?? []).reduce((sum, payment) => sum + Number(payment.amount_ksh), 0);
  const owed = Math.max(0, Number(tenant.data.agreed_rent ?? 0) - paid);
  const isOwner = me?.role === "owner";

  return (
    <div>
      <header className="flex items-center gap-2 px-5 pb-2 pt-[max(env(safe-area-inset-top),1rem)]">
        <Link to={isOwner ? "/app/tenants" : "/app/people"} className="glass rounded-full p-2.5">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="ml-auto flex gap-2">
          <Link to="/app/messages/$id" params={{ id: tenant.data.id }}>
            <PhysicsButton variant="glass" size="sm">
              <MessageCircle className="h-4 w-4" /> Message
            </PhysicsButton>
          </Link>
        </div>
      </header>

      <div className="space-y-4 px-5">
        <div className="glass-strong flex flex-col items-center rounded-3xl p-5 text-center">
          <Avatar name={tenant.data.full_name} url={tenant.data.avatar_url} size={88} />
          <div className="font-display mt-3 text-2xl font-bold">{tenant.data.full_name}</div>
          <div className="text-sm text-muted-foreground">
            {unit.data?.label ?? "Unassigned"}
            {unit.data ? ` · ${unit.data.floor} floor` : ""}
          </div>
          {tenant.data.phone && (
            <a href={`tel:${tenant.data.phone}`} className="mt-2 flex items-center gap-1 text-xs text-teal">
              <Phone className="h-3 w-3" />
              {tenant.data.phone}
            </a>
          )}
          {tenant.data.bio && <p className="mt-3 max-w-xs text-sm text-muted-foreground">{tenant.data.bio}</p>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="glass rounded-2xl p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rent</div>
            <div className="mt-1 text-sm font-bold">
              <Money value={tenant.data.agreed_rent} />
            </div>
          </div>
          <div className="glass rounded-2xl p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Paid</div>
            <div className="mt-1 text-sm font-bold text-teal">
              <Money value={paid} />
            </div>
          </div>
          <div className="glass rounded-2xl p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Owed</div>
            <div className={`mt-1 text-sm font-bold ${owed > 0 ? "text-destructive" : "text-teal"}`}>
              <Money value={owed} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Payments</div>
          {isOwner && (
            <PhysicsButton size="sm" variant="glass" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Log
            </PhysicsButton>
          )}
        </div>
        <div className="space-y-2">
          {(payments.data ?? []).map((payment) => (
            <div key={payment.id} className="glass flex items-center justify-between rounded-2xl p-3">
              <div>
                <div className="capitalize font-semibold">{payment.kind}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(payment.created_at).toLocaleDateString()}
                  {payment.note ? ` · ${payment.note}` : ""}
                </div>
              </div>
              <div className="font-semibold text-teal">
                <Money value={Number(payment.amount_ksh)} />
              </div>
            </div>
          ))}
          {!payments.data?.length && <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No payments yet</div>}
        </div>

        {isOwner && (
          <PhysicsButton
            variant="danger"
            className="mt-4 w-full"
            onClick={async () => {
              if (!confirm("Remove this tenant? This deletes their account.")) return;
              try {
                await deleteTenant({ tenant_id: tenant.data!.id });
                qc.invalidateQueries({ queryKey: ["tenants"] });
                qc.invalidateQueries({ queryKey: ["payments-all"] });
                toast.success("Tenant removed");
                history.back();
              } catch (error: any) {
                toast.error(error.message || "Could not remove tenant");
              }
            }}
          >
            <Trash2 className="h-4 w-4" /> Remove tenant
          </PhysicsButton>
        )}
      </div>

      <PhysicsSheet open={open} onClose={() => setOpen(false)} title="Log payment">
        <LogPaymentForm
          tenantId={tenant.data.id}
          onDone={() => {
            setOpen(false);
            qc.invalidateQueries({ queryKey: ["tenant-payments", id] });
            qc.invalidateQueries({ queryKey: ["payments-all"] });
          }}
        />
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
    if (!amount) {
      toast.error("Enter an amount");
      return;
    }

    setBusy(true);
    try {
      await addDoc(collection(db, "payments"), {
        tenant_id: tenantId,
        amount_ksh: Number(amount),
        kind: kind ?? "rent",
        note: note || null,
        paid_for_month: null,
        created_at: new Date().toISOString(),
      } satisfies Omit<Payment, "id">);
      toast.success("Payment logged");
      onDone();
    } catch (error: any) {
      toast.error(error.message || "Could not save payment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <PhysicsInput
        label="Amount (KSh)"
        inputMode="numeric"
        prefix="KSh"
        value={amount}
        onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))}
      />
      <PhysicsSelect
        label="Kind"
        value={kind}
        onChange={setKind}
        options={[
          { value: "rent", label: "Rent" },
          { value: "deposit", label: "Deposit" },
          { value: "water", label: "Water" },
          { value: "other", label: "Other" },
        ]}
      />
      <PhysicsTextarea label="Note" placeholder="Optional" value={note} onChange={(event) => setNote(event.target.value)} />
      <PhysicsButton size="lg" className="w-full" disabled={busy} onClick={submit}>
        {busy ? "Saving…" : "Save"}
      </PhysicsButton>
    </div>
  );
}
