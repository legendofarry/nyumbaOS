import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { motion, LayoutGroup } from "motion/react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  Wrench,
  Droplets,
  Calendar,
  Megaphone,
} from "lucide-react";
import { useEffect } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { to: "/building", label: "Building", icon: Building2, mobile: true },
  { to: "/tenants", label: "Tenants", icon: Users, mobile: true },
  { to: "/rent", label: "Rent", icon: Wallet, mobile: true },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, mobile: true },
  { to: "/utilities", label: "Utilities", icon: Droplets, mobile: false },
  { to: "/calendar", label: "Calendar", icon: Calendar, mobile: false },
  { to: "/notices", label: "Notices", icon: Megaphone, mobile: false },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-72 p-6 gap-2 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="h-10 w-10 rounded-2xl bg-foreground text-background grid place-items-center font-black">
            P
          </div>
          <div>
            <div className="font-bold text-lg leading-none">PropertyHQ</div>
            <div className="text-xs text-muted-foreground mt-1">Estate Operations</div>
          </div>
        </div>
        <LayoutGroup id="sidebar-nav">
          <nav className="flex flex-col gap-1 mt-4">
            {nav.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-pill"
                      className="absolute inset-0 rounded-2xl bg-foreground"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <Icon className={`relative h-4 w-4 ${active ? "text-background" : ""}`} />
                  <span className={`relative ${active ? "text-background" : ""}`}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </LayoutGroup>
        <div className="mt-auto tile p-4">
          <div className="text-xs text-muted-foreground">Logged in as</div>
          <div className="font-semibold mt-1">Property Manager</div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 pb-28 lg:pb-8 lg:pr-8 lg:pt-8 px-4 pt-6">
        <div className="max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-50 glass border border-border rounded-[2rem] p-2">
        <LayoutGroup id="mobile-nav">
          <ul className="grid grid-cols-5 gap-1">
            {nav.filter(n => n.mobile).map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="relative flex flex-col items-center justify-center gap-1 py-2 rounded-2xl text-[10px] font-semibold text-muted-foreground"
                  >
                    {active && (
                      <motion.div
                        layoutId="mobile-pill"
                        className="absolute inset-0 rounded-2xl bg-foreground"
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
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
