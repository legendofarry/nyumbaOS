import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";

import { auth } from "@/integrations/client";
import { Blobs } from "@/components/Blobs";
import { AppShell } from "@/components/AppShell";
import { useSessionProfile } from "@/lib/use-profile";

export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useSessionProfile();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate({ to: "/" });
      }
    });

    return unsubscribe;
  }, [navigate]);

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-muted-foreground">
        <Blobs />
        <div className="text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <AppShell profile={profile}>
      <Outlet />
    </AppShell>
  );
}
