import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/app/people")({
  component: PeoplePage,
});

function PeoplePage() {
  const people = useQuery({
    queryKey: ["people"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("full_name")).data ?? [],
  });
  const units = useQuery({
    queryKey: ["units"],
    queryFn: async () => (await supabase.from("units").select("*")).data ?? [],
  });

  const owner = people.data?.find((p: any) => p.role === "owner");
  const tenants = (people.data ?? []).filter((p: any) => p.role === "tenant");

  return (
    <div>
      <PageHeader title="Neighbors" subtitle={`${tenants.length} tenants in the building`} />
      <div className="px-5 space-y-3">
        {owner && (
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground px-1 mb-2">Owner</div>
            <Link to="/app/tenants/$id" params={{ id: owner.id }} className="glass rounded-2xl p-3 flex items-center gap-3">
              <Avatar name={owner.full_name} url={owner.avatar_url} size={46} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{owner.full_name}</div>
                <div className="text-xs text-teal">Property owner</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        )}
        <div className="text-xs uppercase tracking-wider text-muted-foreground px-1 mt-2 mb-2">Tenants</div>
        {tenants.map((t: any) => {
          const unit = units.data?.find((u: any) => u.id === t.unit_id);
          return (
            <Link key={t.id} to="/app/tenants/$id" params={{ id: t.id }} className="glass rounded-2xl p-3 flex items-center gap-3">
              <Avatar name={t.full_name} url={t.avatar_url} size={46} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{t.full_name}</div>
                <div className="text-xs text-muted-foreground truncate">{unit?.label ?? "Unit unknown"}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}