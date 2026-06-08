import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

import { db } from "@/integrations/client";
import type { Profile, Unit } from "@/integrations/types";
import { getUnits } from "@/lib/units";
import { fromCollection, sortByName } from "@/lib/firestore";
import { PageHeader } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { PhysicsButton } from "@/components/PhysicsButton";
import { useSessionProfile } from "@/lib/use-profile";

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
    queryFn: async () => getUnits(),
  });

  const { data: me } = useSessionProfile();
  const owner = people.data?.find((person) => person.role === "owner");
  const tenants = (people.data ?? []).filter((person) => person.role === "tenant" && person.id !== me?.id);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);

  useEffect(() => {
    try {
      if (ownerModalOpen) document.body.style.overflow = "hidden";
      else document.body.style.overflow = "";
    } catch {}
    return () => {
      try {
        document.body.style.overflow = "";
      } catch {}
    };
  }, [ownerModalOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOwnerModalOpen(false);
    }
    if (ownerModalOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ownerModalOpen]);

  return (
    <div>
      <PageHeader title="Neighbors" subtitle={`${tenants.length} tenants in the building`} />
      <div className="space-y-3 px-5">
        {owner && (
          <div>
            <div className="mb-2 px-1 text-xs uppercase tracking-wider text-muted-foreground">Owner</div>
            {me?.role === "tenant" ? (
              <button
                onClick={() => setOwnerModalOpen(true)}
                className="glass w-full text-left flex items-center gap-3 rounded-2xl p-3"
                aria-haspopup="dialog"
                aria-expanded={ownerModalOpen}
              >
                <Avatar name={owner.full_name} url={owner.avatar_url} size={46} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{owner.full_name}</div>
                  <div className="text-xs text-teal">Property owner</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ) : (
              <Link to="/app/tenants/$id" params={{ id: owner.id }} className="glass flex items-center gap-3 rounded-2xl p-3">
                <Avatar name={owner.full_name} url={owner.avatar_url} size={46} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{owner.full_name}</div>
                  <div className="text-xs text-teal">Property owner</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            )}
          </div>
        )}

        {ownerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
            <div className="mx-auto w-full max-w-md rounded-2xl glass p-6 text-center">
              <div className="text-2xl font-bold">Hold up 👀</div>
              <p className="mt-3 text-sm text-muted-foreground">That's the property owner — their profile is off-limits to tenants.</p>
              <p className="mt-2 text-sm">Try sending a polite message instead. Or press <span className="font-mono">Message owner</span> below.</p>
              <div className="mt-5 flex justify-center gap-3">
                <PhysicsButton onClick={() => setOwnerModalOpen(false)}>Close</PhysicsButton>
                <PhysicsButton variant="ghost" onClick={() => setOwnerModalOpen(false)}>
                  Maybe later
                </PhysicsButton>
              </div>
            </div>
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
