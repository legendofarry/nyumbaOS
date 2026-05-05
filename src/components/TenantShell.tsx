import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion, LayoutGroup } from "motion/react";
import { Home, Wallet, Wrench, Megaphone, Droplets, LogOut, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useConfirm } from "@/components/ConfirmDialog";

const nav = [
  { to: "/tenant", label: "Home", icon: Home },
  { to: "/tenant/billing", label: "Billing", icon: Wallet },
  { to: "/tenant/maintenance", label: "Repairs", icon: Wrench },
  { to: "/tenant/utilities", label: "Water", icon: Droplets },
  { to: "/tenant/notices", label: "Notices", icon: Megaphone },
] as const;

export function TenantShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { loading, user, role, profile, signOut, refresh } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const confirmSignOut = async () => {
    if (!(await confirm({ title: "Sign out?", description: "You will need to log in again to access the tenant app.", confirmText: "Sign out" }))) return;
    await signOut();
  };

  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/" }); return; }
    if (role === "owner" || role === "assistant") { navigate({ to: "/" }); return; }
    if (role !== "tenant") { navigate({ to: "/" }); return; }
  }, [loading, user, role, navigate]);

  if (loading || !user || role !== "tenant") {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!profile?.unit_id) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-4">
        <div className="w-full max-w-md tile p-8 text-center">
          <div className="font-black text-2xl">Waiting for your unit invite</div>
          <p className="text-sm text-muted-foreground mt-3">
            Your tenant account is active. The owner or assistant needs to invite you to a unit before the tenant app opens.
          </p>
          <div className="mt-6 flex gap-2">
            <button onClick={refresh} className="flex-1 rounded-2xl bg-muted px-4 py-3 text-sm font-bold">
              Check again
            </button>
            <button onClick={confirmSignOut} className="flex-1 rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background">
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="hidden lg:flex flex-col w-72 p-6 gap-2 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="h-10 w-10 rounded-2xl bg-foreground text-background grid place-items-center font-black">P</div>
          <div>
            <div className="font-bold text-lg leading-none">PropertyHQ</div>
            <div className="text-xs text-muted-foreground mt-1">Resident</div>
          </div>
        </div>
        <LayoutGroup id="tenant-nav">
          <nav className="flex flex-col gap-1 mt-4">
            {nav.map((item) => {
              const active = item.to === "/tenant" ? pathname === "/tenant" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className="relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-muted-foreground hover:text-foreground">
                  {active && <motion.div layoutId="tnav-pill" className="absolute inset-0 rounded-2xl bg-foreground" transition={{ type: "spring", stiffness: 400, damping: 35 }} />}
                  <Icon className={`relative h-4 w-4 ${active ? "text-background" : ""}`} />
                  <span className={`relative ${active ? "text-background" : ""}`}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </LayoutGroup>
        <div className="mt-auto tile p-4">
          <div className="text-xs text-muted-foreground">Signed in as</div>
          <div className="font-semibold mt-1 truncate">{profile?.full_name || "Tenant"}</div>
          <button onClick={confirmSignOut} className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2 rounded-2xl bg-muted text-sm font-bold hover:bg-foreground hover:text-background transition-colors">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pb-28 lg:pb-8 lg:pr-8 lg:pt-8 px-4 pt-6">
        <div className="max-w-[900px] mx-auto"><Outlet /></div>
      </main>

      <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-50 glass border border-border rounded-[2rem] p-2">
        <LayoutGroup id="tenant-mob-nav">
          <ul className="grid grid-cols-5 gap-1">
            {nav.map((item) => {
              const active = item.to === "/tenant" ? pathname === "/tenant" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link to={item.to} className="relative flex flex-col items-center justify-center gap-1 py-2 rounded-2xl text-[10px] font-semibold text-muted-foreground">
                    {active && <motion.div layoutId="tmob-pill" className="absolute inset-0 rounded-2xl bg-foreground" transition={{ type: "spring", stiffness: 400, damping: 35 }} />}
                    <Icon className={`relative h-5 w-5 ${active ? "text-background" : ""}`} />
                    <span className={`relative ${active ? "text-background" : ""}`}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </LayoutGroup>
      </nav>
    </div>
  );
}
