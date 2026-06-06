import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionProfile } from "@/lib/use-profile";
import { PageHeader } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { PhysicsButton } from "@/components/PhysicsButton";
import { PhysicsInput } from "@/components/PhysicsInput";
import { PhysicsTextarea } from "@/components/PhysicsTextarea";
import { Fingerprint, LogOut } from "lucide-react";
import { toast } from "sonner";
import { biometricsSupported, getStoredBiometric, registerBiometric, clearBiometric } from "@/lib/biometrics";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: me } = useSessionProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasBio, setHasBio] = useState(false);

  useEffect(() => {
    if (me) { setName(me.full_name); setPhone(me.phone ?? ""); setBio(me.bio ?? ""); }
    setHasBio(!!getStoredBiometric());
  }, [me]);

  if (!me) return null;

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: name, phone: phone || null, bio: bio || null,
    }).eq("id", me!.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["session-profile"] });
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  async function enableBio() {
    if (!me?.login_code) { toast.error("No login code on profile"); return; }
    try {
      await registerBiometric(me.login_code, "Apartment");
      toast.success("Biometric enabled");
      setHasBio(true);
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Your profile & device" />
      <div className="px-5 space-y-4">
        <div className="glass-strong rounded-3xl p-5 flex items-center gap-4">
          <Avatar name={me.full_name} url={me.avatar_url} size={64} />
          <div className="flex-1">
            <div className="font-display text-lg font-bold">{me.full_name}</div>
            <div className="text-xs text-muted-foreground capitalize">{me.role} · code <span className="font-mono">{me.login_code}</span></div>
          </div>
        </div>

        <div className="space-y-3">
          <PhysicsInput label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <PhysicsInput label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <PhysicsTextarea label="Bio" placeholder="Tell your neighbors a bit about yourself" value={bio} onChange={(e) => setBio(e.target.value)} />
          <PhysicsButton className="w-full" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save profile"}</PhysicsButton>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal/20 flex items-center justify-center"><Fingerprint className="h-5 w-5 text-teal" /></div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Biometric unlock</div>
            <div className="text-xs text-muted-foreground">{hasBio ? "Enabled on this device" : biometricsSupported() ? "Use Face ID / fingerprint" : "Not supported here"}</div>
          </div>
          {hasBio
            ? <PhysicsButton variant="ghost" size="sm" onClick={() => { clearBiometric(); setHasBio(false); toast.message("Removed"); }}>Remove</PhysicsButton>
            : biometricsSupported() && <PhysicsButton variant="glass" size="sm" onClick={enableBio}>Enable</PhysicsButton>}
        </div>

        <PhysicsButton variant="danger" className="w-full" onClick={signOut}><LogOut className="h-4 w-4" /> Sign out</PhysicsButton>
      </div>
    </div>
  );
}