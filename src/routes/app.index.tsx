import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessionProfile } from "@/lib/use-profile";
import { PageHeader, GearLink, Money, Stat } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { PhysicsButton } from "@/components/PhysicsButton";
import { Banknote, Home as HomeIcon, Users, Megaphone, Sparkles, ChevronRight, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/app/")({
  component: HomePage,
});

function HomePage() {
  const { data: profile } = useSessionProfile();
  if (!profile) return null;
  return profile.role === "owner" ? <OwnerHome /> : <TenantHome />;
}

function OwnerHome() {
  const { data: profile } = useSessionProfile();
  const tenants = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("role", "tenant");
      return data ?? [];
    },
  });
  const units = useQuery({
    queryKey: ["units"],
    queryFn: async () => (await supabase.from("units").select("*")).data ?? [],
  });
  const payments = useQuery({
    queryKey: ["payments-all"],
    queryFn: async () => (await supabase.from("payments").select("*")).data ?? [],
  });

  const totalExpected = (tenants.data ?? []).reduce((s, t: any) => s + Number(t.agreed_rent ?? 0), 0);
  const totalCollected = (payments.data ?? []).reduce((s, p: any) => s + Number(p.amount_ksh ?? 0), 0);
  const occupied = (tenants.data ?? []).length;
  const totalUnits = (units.data ?? []).length;

  return (
    <div>
      <PageHeader
        title={`Hi, ${profile?.full_name.split(" ")[0] ?? "Owner"}`}
        subtitle="Your property at a glance"
        right={<GearLink />}
      />
      <div className="px-5 space-y-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-teal/30 blur-3xl" />
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Collected this cycle</div>
          <div className="font-display text-3xl font-bold mt-1"><Money value={totalCollected} /></div>
          <div className="text-xs text-muted-foreground mt-1">of <Money value={totalExpected} /> expected</div>
          <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${totalExpected ? Math.min(100, (totalCollected/totalExpected)*100) : 0}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
              className="h-full bg-gradient-to-r from-teal to-teal-glow" />
          </div>
        </motion.div>

        <div className="flex gap-3">
          <Stat icon={Users} label="Tenants" value={`${occupied}/${totalUnits}`} />
          <Stat icon={HomeIcon} label="Units" value={totalUnits} />
          <Stat icon={Banknote} label="Owed" tone={totalExpected - totalCollected > 0 ? "bad" : "good"} value={<Money value={Math.max(0, totalExpected - totalCollected)} />} />
        </div>

        <div className="flex gap-2">
          <Link to="/app/tenants" className="flex-1"><PhysicsButton className="w-full" variant="primary"><Users className="h-4 w-4" /> Manage tenants</PhysicsButton></Link>
          <Link to="/app/community"><PhysicsButton variant="glass"><Megaphone className="h-4 w-4" /> Post</PhysicsButton></Link>
        </div>

        <Link to="/app/assistant" className="block">
          <motion.div whileTap={{ scale: 0.98 }} className="glass rounded-3xl p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-teal/20 ring-1 ring-teal/40 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-teal" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Nest AI</div>
              <div className="text-xs text-muted-foreground">Ask about money owed, tenants, posts</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </Link>

        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground px-1 mb-2">Recent tenants</div>
          <div className="space-y-2">
            {(tenants.data ?? []).slice(0, 5).map((t: any) => {
              const unit = units.data?.find((u: any) => u.id === t.unit_id);
              const paid = (payments.data ?? []).filter((p: any) => p.tenant_id === t.id).reduce((s: number, p: any) => s + Number(p.amount_ksh), 0);
              const owed = Number(t.agreed_rent ?? 0) - paid;
              return (
                <Link key={t.id} to="/app/tenants/$id" params={{ id: t.id }}
                  className="glass rounded-2xl p-3 flex items-center gap-3">
                  <Avatar name={t.full_name} url={t.avatar_url} size={42} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{t.full_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{unit?.label ?? "Unassigned"} · {t.phone ?? "no phone"}</div>
                  </div>
                  <div className={`text-xs font-semibold ${owed > 0 ? "text-destructive" : "text-teal"}`}>
                    {owed > 0 ? <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> <Money value={owed} /></span> : "Settled"}
                  </div>
                </Link>
              );
            })}
            {!tenants.data?.length && (
              <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No tenants yet. Add your first one.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TenantHome() {
  const { data: profile } = useSessionProfile();
  const unit = useQuery({
    queryKey: ["my-unit", profile?.unit_id],
    enabled: !!profile?.unit_id,
    queryFn: async () => (await supabase.from("units").select("*").eq("id", profile!.unit_id!).maybeSingle()).data,
  });
  const payments = useQuery({
    queryKey: ["my-payments", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => (await supabase.from("payments").select("*").eq("tenant_id", profile!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const paid = (payments.data ?? []).reduce((s, p: any) => s + Number(p.amount_ksh), 0);
  const owed = Math.max(0, Number(profile?.agreed_rent ?? 0) - paid);

  return (
    <div>
      <PageHeader title={`Hi, ${profile?.full_name.split(" ")[0]}`} subtitle={unit.data?.label ?? "Your apartment"} right={<GearLink />} />
      <div className="px-5 space-y-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-teal/30 blur-3xl" />
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Balance</div>
          <div className="font-display text-3xl font-bold mt-1">
            {owed > 0 ? <span className="text-destructive"><Money value={owed} /></span> : <span className="text-teal">All settled</span>}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Rent <Money value={profile?.agreed_rent} /> · paid <Money value={paid} /></div>
        </motion.div>

        <div className="flex gap-2">
          <Link to="/app/community" className="flex-1"><PhysicsButton className="w-full"><Megaphone className="h-4 w-4" /> Post a notice</PhysicsButton></Link>
          <Link to="/app/messages"><PhysicsButton variant="glass">Message owner</PhysicsButton></Link>
        </div>

        <Link to="/app/assistant" className="block">
          <motion.div whileTap={{ scale: 0.98 }} className="glass rounded-3xl p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-teal/20 ring-1 ring-teal/40 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-teal" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Nest AI</div>
              <div className="text-xs text-muted-foreground">Ask anything about your apartment</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </Link>

        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground px-1 mb-2">Payment history</div>
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
        </div>
      </div>
    </div>
  );
}