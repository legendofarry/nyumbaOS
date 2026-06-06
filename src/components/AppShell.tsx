import { Link, useLocation } from "@tanstack/react-router";
import { Home, Users, MessageCircle, Bot, Settings, Megaphone, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Blobs } from "./Blobs";
import type { Profile } from "@/lib/use-profile";

function NavItem({ to, label, icon: Icon, active }: { to: string; label: string; icon: LucideIcon; active: boolean }) {
  return (
    <Link to={to} className="relative flex-1 flex flex-col items-center gap-0.5 py-2">
      {active && (
        <motion.span
          layoutId="nav-pill"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className="absolute inset-x-3 inset-y-1 rounded-2xl bg-teal/15 ring-1 ring-teal/30"
        />
      )}
      <span className={cn("relative z-10 transition-colors", active ? "text-teal" : "text-muted-foreground")}>
        <Icon className="h-5 w-5" />
      </span>
      <span className={cn("relative z-10 text-[10px] font-medium tracking-wide", active ? "text-teal" : "text-muted-foreground")}>{label}</span>
    </Link>
  );
}

export function AppShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const loc = useLocation();
  const p = loc.pathname;

  const items = profile.role === "owner" ? [
    { to: "/app", label: "Home", icon: Home },
    { to: "/app/tenants", label: "Tenants", icon: Users },
    { to: "/app/community", label: "Posts", icon: Megaphone },
    { to: "/app/messages", label: "Chat", icon: MessageCircle },
    { to: "/app/assistant", label: "Nest AI", icon: Bot },
  ] : [
    { to: "/app", label: "Home", icon: Home },
    { to: "/app/people", label: "Neighbors", icon: Users },
    { to: "/app/community", label: "Posts", icon: Megaphone },
    { to: "/app/messages", label: "Chat", icon: MessageCircle },
    { to: "/app/assistant", label: "Nest AI", icon: Bot },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center">
      <Blobs />
      <div className="w-full max-w-md flex-1 flex flex-col pb-[88px]">
        {children}
      </div>
      <div className="fixed bottom-3 inset-x-0 z-40 flex justify-center px-3 pointer-events-none">
        <nav className="pointer-events-auto w-full max-w-md glass-strong rounded-[28px] px-1 py-1 flex items-stretch shadow-2xl">
          {items.map((it) => (
            <NavItem key={it.to} to={it.to} label={it.label} icon={it.icon}
              active={it.to === "/app" ? p === "/app" : p.startsWith(it.to)} />
          ))}
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] leading-tight font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function GearLink() {
  return (
    <Link to="/app/settings" className="glass p-2.5 rounded-full">
      <Settings className="h-4 w-4" />
    </Link>
  );
}

export function Money({ value }: { value: number | null | undefined }) {
  const n = value ?? 0;
  return <span className="tabular-nums">KSh {n.toLocaleString("en-KE")}</span>;
}

export function Stat({ icon: Icon, label, value, tone = "default" }: { icon: LucideIcon; label: string; value: ReactNode; tone?: "default" | "good" | "bad" }) {
  const toneCls = tone === "good" ? "text-teal" : tone === "bad" ? "text-destructive" : "text-foreground";
  return (
    <div className="glass rounded-2xl p-4 flex-1 min-w-0">
      <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />{label}
      </div>
      <div className={cn("mt-1 font-bold text-xl", toneCls)}>{value}</div>
    </div>
  );
}