import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { Fingerprint, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { auth, db } from "@/integrations/client";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/AppShell";
import { PhysicsButton } from "@/components/PhysicsButton";
import { PhysicsInput } from "@/components/PhysicsInput";
import { PhysicsTextarea } from "@/components/PhysicsTextarea";
import { biometricsSupported, clearBiometric, getStoredBiometric, registerBiometric } from "@/lib/biometrics";
import { nowIso } from "@/lib/firestore";
import { useSessionProfile } from "@/lib/use-profile";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: me } = useSessionProfile();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasBio, setHasBio] = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.full_name);
      setPhone(me.phone ?? "");
      setBio(me.bio ?? "");
    }
    setHasBio(!!getStoredBiometric());
  }, [me]);

  if (!me) return null;

  async function save() {
    setBusy(true);
    try {
      await updateDoc(doc(db, "profiles", me.id), {
        full_name: name,
        phone: phone || null,
        bio: bio || null,
        updated_at: nowIso(),
      });
      toast.success("Saved");
    } catch (error: any) {
      toast.error(error.message || "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  async function signOutAndLeave() {
    await signOut(auth);
    navigate({ to: "/" });
  }

  async function enableBio() {
    if (!me.login_code) {
      toast.error("No login code on profile");
      return;
    }
    try {
      await registerBiometric(me.login_code, "Apartment");
      toast.success("Biometric enabled");
      setHasBio(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Your profile & device" />
      <div className="space-y-4 px-5">
        <div className="glass-strong flex items-center gap-4 rounded-3xl p-5">
          <Avatar name={me.full_name} url={me.avatar_url} size={64} />
          <div className="flex-1">
            <div className="font-display text-lg font-bold">{me.full_name}</div>
            <div className="text-xs capitalize text-muted-foreground">
              {me.role} · code <span className="font-mono">{me.login_code}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <PhysicsInput label="Full name" value={name} onChange={(event) => setName(event.target.value)} />
          <PhysicsInput label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          <PhysicsTextarea
            label="Bio"
            placeholder="Tell your neighbors a bit about yourself"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
          />
          <PhysicsButton className="w-full" disabled={busy} onClick={save}>
            {busy ? "Saving…" : "Save profile"}
          </PhysicsButton>
        </div>

        <div className="glass flex items-center gap-3 rounded-2xl p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/20">
            <Fingerprint className="h-5 w-5 text-teal" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Biometric unlock</div>
            <div className="text-xs text-muted-foreground">
              {hasBio
                ? "Enabled on this device"
                : biometricsSupported()
                  ? "Use Face ID / fingerprint"
                  : "Not supported here"}
            </div>
          </div>
          {hasBio ? (
            <PhysicsButton
              variant="ghost"
              size="sm"
              onClick={() => {
                clearBiometric();
                setHasBio(false);
                toast.message("Removed");
              }}
            >
              Remove
            </PhysicsButton>
          ) : (
            biometricsSupported() && (
              <PhysicsButton variant="glass" size="sm" onClick={enableBio}>
                Enable
              </PhysicsButton>
            )
          )}
        </div>

        <PhysicsButton variant="danger" className="w-full" onClick={signOutAndLeave}>
          <LogOut className="h-4 w-4" /> Sign out
        </PhysicsButton>
      </div>
    </div>
  );
}
