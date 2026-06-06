import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { ChevronRight } from "lucide-react";

import { db } from "@/integrations/client";
import type { Profile, Unit } from "@/integrations/types";
import { fromCollection, sortByName } from "@/lib/firestore";
import { PageHeader } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";

export const Route = createFileRoute("/app/people")({
  component: PeoplePage,
});

function PeoplePage() {
  const people = useQuery({
    queryKey: ["people"],
    queryFn: async () => sortByName(fromCollection<Profile>(await getDocs(collection(db, "profiles")))),
  });
  const units = useQuery({
    queryKey: ["units"],
    queryFn: async () => fromCollection<Unit>(await getDocs(collection(db, "units"))),
  });

  const owner = people.data?.find((person) => person.role === "owner");
  const tenants = (people.data ?? []).filter((person) => person.role === "tenant");

  return (
    <div>
      <PageHeader title="Neighbors" subtitle={`${tenants.length} tenants in the building`} />
      <div className="space-y-3 px-5">
        {owner && (
          <div>
            <div className="mb-2 px-1 text-xs uppercase tracking-wider text-muted-foreground">Owner</div>
            <Link to="/app/tenants/$id" params={{ id: owner.id }} className="glass flex items-center gap-3 rounded-2xl p-3">
              <Avatar name={owner.full_name} url={owner.avatar_url} size={46} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{owner.full_name}</div>
                <div className="text-xs text-teal">Property owner</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        )}
        <div className="mb-2 mt-2 px-1 text-xs uppercase tracking-wider text-muted-foreground">Tenants</div>
        {tenants.map((tenant) => {
          const unit = units.data?.find((entry) => entry.id === tenant.unit_id);
          return (
            <Link
              key={tenant.id}
              to="/app/tenants/$id"
              params={{ id: tenant.id }}
              className="glass flex items-center gap-3 rounded-2xl p-3"
            >
              <Avatar name={tenant.full_name} url={tenant.avatar_url} size={46} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{tenant.full_name}</div>
                <div className="truncate text-xs text-muted-foreground">{unit?.label ?? "Unit unknown"}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
