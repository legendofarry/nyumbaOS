import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Wallet, Wrench, Megaphone, Droplets, Loader2 } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { useAuth } from "@/lib/auth";
import { KSH, fmtDate, floorLabel } from "@/lib/format";
import { computeBalance } from "@/lib/balance";
import { AiAssistant } from "@/components/AiAssistant";
import type { Unit, Payment, Notice, Ticket } from "@/lib/types";

export function TenantHome() {
  const { profile, user } = useAuth();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile?.unit_id) { setLoading(false); return; }
    Promise.all([
      firebaseClient.from("units").select("*").eq("id", profile.unit_id).maybeSingle(),
      firebaseClient.from("payments").select("*").eq("tenant_id", user.id).order("date", { ascending: false }),
      firebaseClient.from("notices").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(3),
      firebaseClient.from("tickets").select("*").eq("unit_id", profile.unit_id).order("created_at", { ascending: false }).limit(3),
    ]).then(([u, p, n, t]) => {
      setUnit((u.data as Unit) ?? null);
      setPayments((p.data as Payment[]) ?? []);
      const rawNotices = (n.data as Notice[]) ?? [];
      const now = Date.now();
      const valid = rawNotices.filter((no) => !no.expires_at || new Date(no.expires_at).getTime() > now);
      setNotices(valid);
      setTickets((t.data as Ticket[]) ?? []);
      setLoading(false);
    });
  }, [user, profile]);

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const balance = unit ? computeBalance(Number(unit.rent), payments, profile?.created_at) : 0;
  const owes = balance < 0;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Welcome</p>
        <h1 className="text-3xl sm:text-4xl font-black mt-2">Hi, {profile?.full_name?.split(" ")[0] || "there"}</h1>
        {unit && <p className="text-sm text-muted-foreground mt-1">Unit {unit.number} - {floorLabel(unit.floor)} floor - {unit.bedrooms}</p>}
      </header>

      {/* Balance hero */}
      <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`tile p-6 ${owes ? "bg-destructive text-destructive-foreground" : "bg-foreground text-background"}`}>
        <div className="text-xs uppercase tracking-widest opacity-80">{owes ? "Amount due" : "Balance"}</div>
        <div className="text-4xl font-black mt-2">{KSH(balance)}</div>
        <div className="text-xs opacity-80 mt-2">{owes ? "Please settle as soon as possible." : "You're all caught up. Thank you!"}</div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/tenant/billing" className="tile p-5"><Wallet className="h-5 w-5 mb-3" /><div className="text-sm font-bold">Billing</div><div className="text-xs text-muted-foreground">{payments.length} payments</div></Link>
        <Link to="/tenant/maintenance" className="tile p-5"><Wrench className="h-5 w-5 mb-3" /><div className="text-sm font-bold">Repairs</div><div className="text-xs text-muted-foreground">{tickets.length} active</div></Link>
        <Link to="/tenant/utilities" className="tile p-5"><Droplets className="h-5 w-5 mb-3" /><div className="text-sm font-bold">Water</div><div className="text-xs text-muted-foreground">View readings</div></Link>
        <Link to="/tenant/notices" className="tile p-5"><Megaphone className="h-5 w-5 mb-3" /><div className="text-sm font-bold">Notices</div><div className="text-xs text-muted-foreground">{notices.length} latest</div></Link>
      </div>

      {notices.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Latest from owner</h3>
          <div className="space-y-2">
            {notices.map(n => (
              <div key={n.id} className="tile p-4">
                <div className="font-bold text-sm">{n.title}</div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.body}</p>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">{fmtDate(n.created_at)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <AiAssistant
        mode="tenant-chat"
        context={{ unit: unit ? { number: unit.number, rent: Number(unit.rent), bedrooms: unit.bedrooms } : null, balance, recentPayments: payments.slice(0, 5), recentNotices: notices }}
        label="Resident Help"
        greeting="Hi! Ask me about your rent, water bill, repairs, or anything else."
      />
    </div>
  );
}
