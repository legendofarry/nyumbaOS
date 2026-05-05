import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { useAuth } from "@/lib/auth";
import { KSH, fmtDate } from "@/lib/format";
import { computeBalance } from "@/lib/balance";
import type { Payment, Unit } from "@/lib/types";

export function TenantBilling() {
  const { user, profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile?.unit_id) { setLoading(false); return; }
    Promise.all([
      firebaseClient.from("payments").select("*").eq("tenant_id", user.id).order("date", { ascending: false }),
      firebaseClient.from("units").select("*").eq("id", profile.unit_id).maybeSingle(),
    ]).then(([p, u]) => {
      setPayments((p.data as Payment[]) ?? []);
      setUnit((u.data as Unit) ?? null);
      setLoading(false);
    });
  }, [user, profile]);

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const balance = unit ? computeBalance(Number(unit.rent), payments, profile?.created_at) : 0;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your account</p>
        <h1 className="text-3xl sm:text-4xl font-black mt-2">Billing</h1>
      </header>

      <div className={`tile p-6 ${balance < 0 ? "bg-destructive text-destructive-foreground" : "bg-foreground text-background"}`}>
        <div className="text-xs uppercase tracking-widest opacity-80">{balance < 0 ? "Amount due" : "Balance"}</div>
        <div className="text-4xl font-black mt-2">{KSH(balance)}</div>
        {unit && <div className="text-xs opacity-80 mt-2">Monthly rent: {KSH(Number(unit.rent))} + deposit: {KSH(Number(unit.rent))}</div>}
      </div>

      <section>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Payment history</h3>
        <div className="space-y-2">
          {payments.map(p => (
            <div key={p.id} className="tile p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm">{p.type}</div>
                <div className="text-xs text-muted-foreground">{fmtDate(p.date)} {p.note ? `· ${p.note}` : ""}</div>
              </div>
              <div className={`font-mono font-black ${Number(p.amount) < 0 ? "text-destructive" : "text-success"}`}>{Number(p.amount) < 0 ? "-" : ""}{KSH(Number(p.amount))}</div>
            </div>
          ))}
          {!payments.length && <p className="text-sm text-muted-foreground tile p-6 text-center">No payments recorded yet.</p>}
        </div>
      </section>
    </div>
  );
}
