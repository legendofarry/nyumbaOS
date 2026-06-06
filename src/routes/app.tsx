import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionProfile } from "@/lib/use-profile";
import { AppShell } from "@/components/AppShell";
import { Blobs } from "@/components/Blobs";

export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useSessionProfile();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) navigate({ to: "/" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  if (isLoading || !profile) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center text-muted-foreground">
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