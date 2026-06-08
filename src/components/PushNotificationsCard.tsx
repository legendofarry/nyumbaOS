import { useEffect, useState } from "react";
import { Bell, BellOff, Smartphone } from "lucide-react";
import { toast } from "sonner";

import type { Profile } from "@/integrations/types";
import { disablePushNotifications, enablePushNotifications, getPushSubscriptionState } from "@/lib/push-notifications";
import { PhysicsButton } from "./PhysicsButton";

type Props = {
  profile: Profile;
};

export function PushNotificationsCard({ profile }: Props) {
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  async function refreshState() {
    const state = await getPushSubscriptionState();
    setSupported(state.supported);
    setEnabled(state.enabled);
    setPermission(state.permission);
  }

  useEffect(() => {
    void refreshState();
  }, []);

  async function enable() {
    setBusy(true);
    try {
      await enablePushNotifications({
        userId: profile.id,
        fullName: profile.full_name,
        role: profile.role,
      });
      await refreshState();
      toast.success("Push notifications enabled");
    } catch (error: any) {
      toast.error(error?.message || "Could not enable push notifications");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      await disablePushNotifications(profile.id);
      await refreshState();
      toast.message("Push notifications disabled");
    } catch (error: any) {
      toast.error(error?.message || "Could not disable push notifications");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass flex items-start gap-3 rounded-2xl p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/20">
        <Bell className="h-5 w-5 text-teal" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">Real push notifications</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Receive alerts even when the app is closed. This uses Web Push, not Firebase Messaging.
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Smartphone className="h-3.5 w-3.5" />
          {supported ? `Permission: ${permission}` : "Not supported on this browser"}
          {enabled && <span className="rounded-full bg-teal/15 px-2 py-0.5 text-teal">Enabled on this device</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {enabled ? (
            <PhysicsButton variant="ghost" size="sm" onClick={disable} disabled={busy}>
              <BellOff className="h-4 w-4" />
              Disable
            </PhysicsButton>
          ) : (
            <PhysicsButton size="sm" onClick={enable} disabled={busy || !supported}>
              <Bell className="h-4 w-4" />
              Enable push
            </PhysicsButton>
          )}
        </div>
      </div>
    </div>
  );
}
