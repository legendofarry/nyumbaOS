import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion, LayoutGroup } from "motion/react";
import {
  LayoutDashboard, Building2, Users, Wallet, Wrench, Droplets, Calendar, Megaphone, LogOut, MoreHorizontal,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { to: "/building", label: "Building", icon: Building2, mobile: true },
  { to: "/tenants", label: "Tenants", icon: Users, mobile: true },
  { to: "/rent", label: "Rent", icon: Wallet, mobile: true },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, mobile: false },
  { to: "/utilities", label: "Utilities", icon: Droplets, mobile: false },
  { to: "/calendar", label: "Calendar", icon: Calendar, mobile: false },
  { to: "/notices", label: "Notices", icon: Megaphone, mobile: false },
] as const;

export function OwnerShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { loading, user, role, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const confirm = useConfirm();

  const confirmSignOut = async () => {
    if (!(await confirm({ title: "Sign out?", description: "You will need to log in again to access the app.", confirmText: "Sign out" }))) return;
    await signOut();
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/" }); return; }
    if (role === "tenant") { navigate({ to: "/tenant" }); return; }
    if (role !== "owner" && role !== "assistant") { navigate({ to: "/" }); return; }
  }, [loading, user, role, navigate]);

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const registerBiometric = async (email: string, password: string) => {
    try {
      if (!window.PublicKeyCredential) { toast.error("Biometric authentication not supported on this device."); return; }
      const uid = user?.id ?? String(Math.random()).slice(2);
      const userId = new TextEncoder().encode(uid);
      const publicKey: any = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "NyumbaOS" },
        user: { id: userId, name: email, displayName: profile?.full_name ?? "" },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
        timeout: 60000,
        attestation: "none",
      };

      const cred: any = await (navigator.credentials as any).create({ publicKey });
      if (!cred) throw new Error("Could not create biometric credential");
      const rawId = cred.rawId as ArrayBuffer;
      const b64 = arrayBufferToBase64(rawId);
      localStorage.setItem(`nyumbaos:bio:credId:${email}`, b64);
      localStorage.setItem(`nyumbaos:bio:pw:${email}`, password);
      toast.success("Fingerprint enabled for faster login");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not enable fingerprint");
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (role !== "owner" && role !== "assistant") return;

    const email = (profile as any)?.login_email ?? (user as any)?.email;
    if (!email) return;

    const raw = localStorage.getItem("nyumbaos:bio:pending");
    if (raw) {
      let pending: any = null;
      try { pending = JSON.parse(raw); } catch { localStorage.removeItem("nyumbaos:bio:pending"); return; }
      if (!pending?.email || !pending?.password) { localStorage.removeItem("nyumbaos:bio:pending"); return; }

      (async () => {
        const already = localStorage.getItem(`nyumbaos:bio:credId:${pending.email}`);
        if (already) { localStorage.removeItem("nyumbaos:bio:pending"); return; }
        const ok = await confirm({ title: "Enable fingerprint?", description: "Scan your fingerprint now to enable faster login next time.", confirmText: "Enable", cancelText: "Skip" });
        if (!ok) { localStorage.removeItem("nyumbaos:bio:pending"); return; }
        await registerBiometric(pending.email, pending.password);
        localStorage.removeItem("nyumbaos:bio:pending");
      })();
      return;
    }

    // Suggest enabling biometrics for existing dashboard users (one-time)
    const credKey = `nyumbaos:bio:credId:${email}`;
    const promptedKey = `nyumbaos:bio:prompted:${email}`;
    const already = localStorage.getItem(credKey);
    if (already) return;
    if (localStorage.getItem(promptedKey)) return;

    (async () => {
      const ok = await confirm({ title: "Enable fingerprint?", description: "Enable fingerprint for faster login. You may be asked to enter your password to complete setup.", confirmText: "Enable", cancelText: "Later" });
      try { localStorage.setItem(promptedKey, "1"); } catch {}
      if (!ok) return;

      let pw = localStorage.getItem(`nyumbaos:bio:pw:${email}`);
      if (!pw) {
        try {
          pw = window.prompt("Enter your account password to enable biometric sign-in (stored locally only):") || undefined;
        } catch {}
      }
      if (!pw) { toast.error("Password required to enable biometric sign-in"); return; }
      await registerBiometric(email, pw);
    })();
  }, [loading, user, role, confirm, profile]);

  if (loading || !user || (role !== "owner" && role !== "assistant")) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const moreItems = nav.filter((n) => !n.mobile);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="hidden lg:flex flex-col w-72 p-6 gap-2 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="h-10 w-10 rounded-2xl bg-foreground text-background grid place-items-center font-black">P</div>
          <div>
            <div className="font-bold text-lg leading-none">PropertyHQ</div>
            <div className="text-xs text-muted-foreground mt-1">{role === "assistant" ? "Owner assistant" : "Owner workspace"}</div>
          </div>
        </div>
        <LayoutGroup id="sidebar-nav">
          <nav className="flex flex-col gap-1 mt-4">
            {nav.map((item) => {
              const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className="relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  {active && <motion.div layoutId="sidebar-pill" className="absolute inset-0 rounded-2xl bg-foreground" transition={{ type: "spring", stiffness: 400, damping: 35 }} />}
                  <Icon className={`relative h-4 w-4 ${active ? "text-background" : ""}`} />
                  <span className={`relative ${active ? "text-background" : ""}`}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </LayoutGroup>
        <div className="mt-auto tile p-4">
          <div className="text-xs text-muted-foreground">Signed in as</div>
          <div className="font-semibold mt-1 truncate">{profile?.full_name || user.email}</div>
          <button onClick={confirmSignOut} className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2 rounded-2xl bg-muted text-sm font-bold hover:bg-foreground hover:text-background transition-colors">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pb-28 lg:pb-8 lg:pr-8 lg:pt-8 px-4 pt-6">
        <div className="max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-50 glass border border-border rounded-[2rem] p-2">
        <LayoutGroup id="mobile-nav">
          <ul className="grid grid-cols-5 gap-1">
            {nav.filter(n => n.mobile).map((item) => {
              const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link to={item.to} className="relative flex flex-col items-center justify-center gap-1 py-2 rounded-2xl text-[10px] font-semibold text-muted-foreground">
                    {active && <motion.div layoutId="mobile-pill" className="absolute inset-0 rounded-2xl bg-foreground" transition={{ type: "spring", stiffness: 400, damping: 35 }} />}
                    <Icon className={`relative h-5 w-5 ${active ? "text-background" : ""}`} />
                    <span className={`relative ${active ? "text-background" : ""}`}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button onClick={() => setMoreOpen((v) => !v)} className="relative w-full flex flex-col items-center justify-center gap-1 py-2 rounded-2xl text-[10px] font-semibold text-muted-foreground">
                <MoreHorizontal className="h-5 w-5" />
                <span>More</span>
              </button>
            </li>
          </ul>
        </LayoutGroup>
        {moreOpen && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-full left-0 right-0 mb-2 bg-surface rounded-[2rem] p-3 shadow-2xl border border-border">
            <div className="grid grid-cols-4 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-muted text-[10px] font-bold">
                    <Icon className="h-5 w-5" />
                    <span className="text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}
              <button onClick={confirmSignOut} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-destructive/10 text-destructive text-[10px] font-bold">
                <LogOut className="h-5 w-5" />
                <span>Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </nav>
    </div>
  );
}
