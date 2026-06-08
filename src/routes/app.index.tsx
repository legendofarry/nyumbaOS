import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Banknote,
  ChevronRight,
  Home as HomeIcon,
  Megaphone,
  Sparkles,
  Users,
} from "lucide-react";

import { db } from "@/integrations/client";
import { getUnits, getUnit } from "@/lib/units";
import type { Payment, Profile, Unit } from "@/integrations/types";
import { fromCollection, sortByCreatedAtDesc, sortByName } from "@/lib/firestore";
import { useSessionProfile } from "@/lib/use-profile";
import { Avatar } from "@/components/Avatar";
import { PageHeader, GearLink, Money, Stat } from "@/components/AppShell";
import { PhysicsButton } from "@/components/PhysicsButton";

export const Route = createFileRoute("/app/")({
  component: HomePage,
});

function HomePage() {
  const { data: profile } = useSessionProfile();
  if (!profile) return null;
  return profile.role === "owner" ? <OwnerHome profile={profile} /> : <TenantHome profile={profile} />;
}

function OwnerHome({ profile }: { profile: Profile }) {
  const tenants = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "profiles"));
      return sortByName(fromCollection<Profile>(snapshot).filter((person) => person.role === "tenant"));
    },
  });
  const units = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const list = await getUnits();
      return list.sort((a, b) => `${a.floor}-${a.label}`.localeCompare(`${b.floor}-${b.label}`));
    },
    onError: (err) => console.error("units fetch error:", err),
  });
  const payments = useQuery({
    queryKey: ["payments-all"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "payments"));
      return sortByCreatedAtDesc(fromCollection<Payment>(snapshot));
    },
  });

  const totalExpected = (tenants.data ?? []).reduce((sum, tenant) => sum + Number(tenant.agreed_rent ?? 0), 0);
  const totalCollected = (payments.data ?? []).reduce((sum, payment) => sum + Number(payment.amount_ksh ?? 0), 0);
  const occupied = (tenants.data ?? []).length;
  const totalUnits = (units.data ?? []).length;

  return (
    <div>
      <PageHeader
        title={`Hi, ${profile.full_name.split(" ")[0] ?? "Owner"}`}
        subtitle="Your property at a glance"
        right={<GearLink />}
      />
      <div className="space-y-4 px-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong relative overflow-hidden rounded-3xl p-5"
        >
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-teal/30 blur-3xl" />
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Collected this cycle</div>
          <div className="font-display mt-1 text-3xl font-bold">
            <Money value={totalCollected} />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            of <Money value={totalExpected} /> expected
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalExpected ? Math.min(100, (totalCollected / totalExpected) * 100) : 0}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
              className="h-full bg-gradient-to-r from-teal to-teal-glow"
            />
          </div>
        </motion.div>

        <div className="flex gap-3">
            {units.isError && (
              <div className="w-full text-sm text-center text-destructive">Could not load units (see console)</div>
            )}
          <Stat icon={Users} label="Tenants" value={`${occupied}/${totalUnits}`} />
          <Stat icon={HomeIcon} label="Units" value={totalUnits} />
          <Stat
            icon={Banknote}
            label="Owed"
            tone={totalExpected - totalCollected > 0 ? "bad" : "good"}
            value={<Money value={Math.max(0, totalExpected - totalCollected)} />}
          />
        </div>

        <div className="flex gap-2">
          <Link to="/app/tenants" className="flex-1">
            <PhysicsButton className="w-full" variant="primary">
              <Users className="h-4 w-4" /> Manage tenants
            </PhysicsButton>
          </Link>
          <Link to="/app/community">
            <PhysicsButton variant="glass">
              <Megaphone className="h-4 w-4" /> Post
            </PhysicsButton>
          </Link>
        </div>

        <Link to="/app/assistant" className="block">
          <motion.div whileTap={{ scale: 0.98 }} className="glass flex items-center gap-3 rounded-3xl p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal/20 ring-1 ring-teal/40">
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
          <div className="mb-2 px-1 text-xs uppercase tracking-wider text-muted-foreground">Recent tenants</div>
          <div className="space-y-2">
            {(tenants.data ?? []).slice(0, 5).map((tenant) => {
              const unit = units.data?.find((entry) => entry.id === tenant.unit_id);
              const paid = (payments.data ?? [])
                .filter((payment) => payment.tenant_id === tenant.id)
                .reduce((sum, payment) => sum + Number(payment.amount_ksh), 0);
              const owed = Number(tenant.agreed_rent ?? 0) - paid;

              return (
                <Link
                  key={tenant.id}
                  to="/app/tenants/$id"
                  params={{ id: tenant.id }}
                  className="glass flex items-center gap-3 rounded-2xl p-3"
                >
                  <Avatar name={tenant.full_name} url={tenant.avatar_url} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{tenant.full_name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {unit?.label ?? "Unassigned"} · {tenant.phone ?? "no phone"}
                    </div>
                  </div>
                  <div className={`text-xs font-semibold ${owed > 0 ? "text-destructive" : "text-teal"}`}>
                    {owed > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> <Money value={owed} />
                      </span>
                    ) : (
                      "Settled"
                    )}
                  </div>
                </Link>
              );
            })}
            {!tenants.data?.length && (
              <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
                No tenants yet. Add your first one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TenantHome({ profile }: { profile: Profile }) {
  const unit = useQuery({
    queryKey: ["my-unit", profile.unit_id],
    enabled: !!profile.unit_id,
    queryFn: async () => {
      if (!profile.unit_id) return null;
      return getUnit(profile.unit_id);
    },
  });
  const payments = useQuery({
    queryKey: ["my-payments", profile.id],
    enabled: !!profile.id,
    queryFn: async () => {
      const snapshot = await getDocs(query(collection(db, "payments"), where("tenant_id", "==", profile.id)));
      return sortByCreatedAtDesc(fromCollection<Payment>(snapshot));
    },
  });

  const paid = (payments.data ?? []).reduce((sum, payment) => sum + Number(payment.amount_ksh), 0);
  const owed = Math.max(0, Number(profile.agreed_rent ?? 0) - paid);

  return (
    <div>
      <PageHeader
        title={`Hi, ${profile.full_name.split(" ")[0]}`}
        subtitle={unit.data?.label ?? "Your apartment"}
        right={<GearLink />}
      />
      <div className="space-y-4 px-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong relative overflow-hidden rounded-3xl p-5"
        >
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-teal/30 blur-3xl" />
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Balance</div>
          <div className="font-display mt-1 text-3xl font-bold">
            {owed > 0 ? (
              <span className="text-destructive">
                <Money value={owed} />
              </span>
            ) : (
              <span className="text-teal">All settled</span>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Rent <Money value={profile.agreed_rent} /> · paid <Money value={paid} />
          </div>
        </motion.div>

        <div className="flex gap-2">
          <Link to="/app/community" className="flex-1">
            <PhysicsButton className="w-full">
              <Megaphone className="h-4 w-4" /> Post a notice
            </PhysicsButton>
          </Link>
          <Link to="/app/messages">
            <PhysicsButton variant="glass">Message owner</PhysicsButton>
          </Link>
        </div>

        <Link to="/app/assistant" className="block">
          <motion.div whileTap={{ scale: 0.98 }} className="glass flex items-center gap-3 rounded-3xl p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal/20 ring-1 ring-teal/40">
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
          <div className="mb-2 px-1 text-xs uppercase tracking-wider text-muted-foreground">Payment history</div>
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
        </div>
      </div>
    </div>
  );
}
