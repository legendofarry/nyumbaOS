import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { signOut, updateEmail, updatePassword } from "firebase/auth";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { Fingerprint, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/AppShell";
import { PhysicsButton } from "@/components/PhysicsButton";
import { PhysicsInput } from "@/components/PhysicsInput";
import { PhysicsTextarea } from "@/components/PhysicsTextarea";
import { PushNotificationsCard } from "@/components/PushNotificationsCard";
import { auth, db } from "@/integrations/client";
import { fileToAvatarDataUrl } from "@/lib/avatar-image";
import { emailForCode, passwordForCode } from "@/lib/codes";
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
  const [loginCode, setLoginCode] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasBio, setHasBio] = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.full_name);
      setPhone(me.phone ?? "");
      setBio(me.bio ?? "");
      setLoginCode(me.login_code ?? "");
      setAvatarUrl(me.avatar_url);
    }
    setHasBio(!!getStoredBiometric());
  }, [me]);

  if (!me) return null;

  async function save() {
    const nextCode = loginCode.trim();
    const codeChanged = me.role === "tenant" && nextCode !== (me.login_code ?? "");

    if (me.role === "tenant" && (!nextCode || nextCode.length !== 4 || /\D/.test(nextCode))) {
      toast.error("Tenant code must be exactly 4 digits");
      return;
    }

    setBusy(true);
    const currentUser = auth.currentUser;
    const oldCode = me.login_code ?? "";
    const nextProfile = {
      full_name: name,
      phone: phone || null,
      bio: bio || null,
      avatar_url: avatarUrl,
      updated_at: nowIso(),
      ...(me.role === "tenant" ? { login_code: nextCode } : {}),
    };

    try {
      if (codeChanged) {
        if (!currentUser) {
          throw new Error("You need to be signed in to change your code");
        }

        const conflict = await getDocs(query(collection(db, "profiles"), where("login_code", "==", nextCode)));
        const duplicate = conflict.docs.find((snapshot) => snapshot.id !== me.id);
        if (duplicate) {
          throw new Error("That code is already in use");
        }

        await updateEmail(currentUser, emailForCode(nextCode));
        await updatePassword(currentUser, passwordForCode(nextCode));
      }

      await updateDoc(doc(db, "profiles", me.id), nextProfile);
      toast.success("Saved");
    } catch (error: any) {
      if (codeChanged && currentUser && oldCode) {
        try {
          await updateEmail(currentUser, emailForCode(oldCode));
          await updatePassword(currentUser, passwordForCode(oldCode));
        } catch {
          // If rollback fails, we still surface the original error below.
        }
      }

      toast.error(error?.message || "Could not save profile");
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
      <PageHeader title="Settings" subtitle="Your profile and device" />
      <div className="space-y-4 px-5">
        <div className="glass-strong flex items-center gap-4 rounded-3xl p-5">
          <Avatar name={me.full_name} url={avatarUrl ?? me.avatar_url} size={64} />
          <div className="flex-1">
            <div className="font-display text-lg font-bold">{me.full_name}</div>
            <div className="text-xs capitalize text-muted-foreground">
              {me.role} · code <span className="font-mono">{me.login_code}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="glass rounded-2xl p-4">
            <div className="mb-3 text-sm font-semibold">Avatar</div>
            <div className="flex items-center gap-4">
              <Avatar name={me.full_name} url={avatarUrl ?? me.avatar_url} size={72} />
              <div className="flex-1 space-y-2">
                <label className="block text-xs text-muted-foreground">
                  Upload a new profile image
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-2 block w-full text-sm"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;

                      try {
                        const nextAvatar = await fileToAvatarDataUrl(file);
                        setAvatarUrl(nextAvatar);
                        toast.success("Avatar updated locally. Save to keep it.");
                      } catch (error: any) {
                        toast.error(error?.message || "Could not read image");
                      } finally {
                        event.currentTarget.value = "";
                      }
                    }}
                  />
                </label>
                <PhysicsButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAvatarUrl(null);
                    toast.message("Avatar cleared. Save to remove it.");
                  }}
                >
                  Remove avatar
                </PhysicsButton>
              </div>
            </div>
          </div>

          <PhysicsInput label="Full name" value={name} onChange={(event) => setName(event.target.value)} />
          <PhysicsInput label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          <PhysicsTextarea
            label="Bio"
            placeholder="Tell your neighbors a bit about yourself"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
          />
          {me.role === "tenant" && (
            <PhysicsInput
              label="Login code"
              inputMode="numeric"
              value={loginCode}
              onChange={(event) => setLoginCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          )}
          <PhysicsButton className="w-full" disabled={busy} onClick={save}>
            {busy ? "Saving..." : "Save profile"}
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

        <PushNotificationsCard profile={me} />

        <PhysicsButton variant="danger" className="w-full" onClick={signOutAndLeave}>
          <LogOut className="h-4 w-4" /> Sign out
        </PhysicsButton>
      </div>
    </div>
  );
}
