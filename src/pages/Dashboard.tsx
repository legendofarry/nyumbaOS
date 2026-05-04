import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Wallet, Wrench, Home, Droplets, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { firebaseClient } from "@/integrations/firebase/client";
import { KSH } from "@/lib/format";
import { AiAssistant } from "@/components/AiAssistant";
import { streamAi } from "@/lib/ai";
import type { Unit, Profile, Payment, Ticket, Reading, Notice } from "@/lib/types";

export function Dashboard() {
  const [data, setData] = useState<{
    units: Unit[]; tenants: Profile[]; payments: Payment[]; tickets: Ticket[]; readings: Reading[]; notices: Notice[];
  } | null>(null);
  const [insights, setInsights] = useState("");

  useEffect(() => {
    const load = async () => {
      const [u, t, p, ti, r, n] = await Promise.all([
        firebaseClient.from("units").select("*").order("floor").order("number"),
        firebaseClient.from("profiles").select("*").not("unit_id", "is", null),
        firebaseClient.from("payments").select("*").order("date", { ascending: false }),
        firebaseClient.from("tickets").select("*").order("created_at", { ascending: false }),
        firebaseClient.from("readings").select("*").order("date", { ascending: false }),
        firebaseClient.from("notices").select("*").order("created_at", { ascending: false }).limit(3),
      ]);
      setData({
        units: (u.data as Unit[]) ?? [],
        tenants: (t.data as Profile[]) ?? [],
        payments: (p.data as Payment[]) ?? [],
        tickets: (ti.data as Ticket[]) ?? [],
        readings: (r.data as Reading[]) ?? [],
        notices: (n.data as Notice[]) ?? [],
      });
    };
    load();
  }, []);

  useEffect(() => {
    if (!data) return;
    const ctx = {
      occupancyRate: data.units.length ? Math.round((data.units.filter(u => u.status === "Occupied").length / data.units.length) * 100) : 0,
      vacantUnits: data.units.filter(u => u.status === "Vacant").length,
      maintenanceUnits: data.units.filter(u => u.status === "Maintenance").length,
      totalTenants: data.tenants.length,
      monthIncome: data.payments.filter(p => p.type === "Rent" && new Date(p.date).getMonth() === new Date().getMonth()).reduce((s, p) => s + Number(p.amount), 0),
      openTickets: data.tickets.filter(t => t.status !== "Done").length,
      emergencyTickets: data.tickets.filter(t => t.priority === "Emergency" && t.status !== "Done").length,
      recentReadings: data.readings.slice(0, 5).map(r => ({ unit: r.unit_id, m3: r.cubic_meters })),
    };
    setInsights("");
    let acc = "";
    streamAi({
      mode: "insights",
      messages: [{ role: "user", content: "Give 3 short insights now." }],
      context: ctx,
      onDelta: (c) => { acc += c; setInsights(acc); },
    });
  }, [data]);

  if (!data) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const occupied = data.units.filter(u => u.status === "Occupied").length;
  const occupancy = data.units.length ? Math.round((occupied / data.units.length) * 100) : 0;
  const monthIncome = data.payments.filter(p => p.type === "Rent" && new Date(p.date).getMonth() === new Date().getMonth()).reduce((s, p) => s + Number(p.amount), 0);
  const emergencies = data.tickets.filter(t => t.priority === "Emergency" && t.status !== "Done");
  const open = data.tickets.filter(t => t.status !== "Done").length;

  const stats = [
    { label: "Occupancy", value: `${occupancy}%`, sub: `${occupied}/${data.units.length} units`, icon: Home, to: "/building" },
    { label: "This month", value: KSH(monthIncome), sub: "Rent collected", icon: Wallet, to: "/rent" },
    { label: "Open tickets", value: String(open), sub: emergencies.length ? `${emergencies.length} emergency` : "All clear", icon: Wrench, to: "/maintenance" },
    { label: "Tenants", value: String(data.tenants.length), sub: "Active residents", icon: Droplets, to: "/tenants" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Overview</p>
        <h1 className="text-3xl sm:text-4xl font-black mt-2">Dashboard</h1>
      </header>

      {/* AI insights */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="tile p-5 bg-gradient-to-br from-foreground to-foreground/85 text-background">
        <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-widest opacity-80">
          <Sparkles className="h-4 w-4" /> AI insights
        </div>
        <div className="text-sm whitespace-pre-wrap min-h-[60px] leading-relaxed">{insights || "Analyzing…"}</div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} to={s.to} className="tile p-5 hover:scale-[1.02] transition-transform">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-2xl bg-muted grid place-items-center"><Icon className="h-4 w-4" /></div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black">{s.value}</div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-2">{s.sub}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Emergencies */}
      {emergencies.length > 0 && (
        <Link to="/maintenance" className="tile p-5 border-2 border-destructive/30 pulse-emergency">
          <div className="flex items-center gap-2 mb-3"><AlertCircle className="h-4 w-4 text-destructive" /><span className="text-xs uppercase tracking-widest font-bold text-destructive">Emergency</span></div>
          {emergencies.slice(0, 2).map(t => (
            <div key={t.id} className="text-sm font-semibold">{t.title}</div>
          ))}
        </Link>
      )}

      {/* Recent payments + notices */}
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="tile p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black">Recent payments</h3>
            <Link to="/rent" className="text-xs font-bold text-muted-foreground hover:text-foreground">View all →</Link>
          </div>
          {data.payments.slice(0, 5).map(p => {
            const tenant = data.tenants.find(t => t.id === p.tenant_id);
            return (
              <div key={p.id} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                <div>
                  <div className="text-sm font-semibold">{tenant?.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{p.type} · {new Date(p.date).toLocaleDateString()}</div>
                </div>
                <div className="text-sm font-mono font-bold text-success">{KSH(Number(p.amount))}</div>
              </div>
            );
          })}
          {!data.payments.length && <p className="text-sm text-muted-foreground">No payments yet.</p>}
        </div>

        <div className="tile p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black">Latest notices</h3>
            <Link to="/notices" className="text-xs font-bold text-muted-foreground hover:text-foreground">Manage →</Link>
          </div>
          {data.notices.map(n => (
            <div key={n.id} className="py-2 border-b border-border/40 last:border-0">
              <div className="text-sm font-semibold">{n.title}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">{n.body}</div>
            </div>
          ))}
          {!data.notices.length && <p className="text-sm text-muted-foreground">No notices posted.</p>}
        </div>
      </div>

      <AiAssistant
        mode="owner-chat"
        context={{
          units: data.units.map(u => ({ number: u.number, floor: u.floor, status: u.status, rent: Number(u.rent), bedrooms: u.bedrooms })),
          tenants: data.tenants.map(t => ({ name: t.full_name, unit_id: t.unit_id, phone: t.phone })),
          recentPayments: data.payments.slice(0, 10),
          openTickets: data.tickets.filter(t => t.status !== "Done"),
        }}
        label="PropertyHQ AI"
        greeting="Hi! I can help you manage your building. Ask me about rent collection, vacancies, maintenance, or anything else."
      />
    </div>
  );
}
