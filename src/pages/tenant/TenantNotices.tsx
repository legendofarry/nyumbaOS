import { useEffect, useState } from "react";
import { Pin, Loader2 } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { fmtDate } from "@/lib/format";
import type { Notice } from "@/lib/types";

export function TenantNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    firebaseClient.from("notices").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).then(({ data }) => {
      setNotices((data as Notice[]) ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">From your owner</p>
        <h1 className="text-3xl sm:text-4xl font-black mt-2">Notices</h1>
      </header>

      <div className="space-y-3">
        {notices.map(n => (
          <div key={n.id} className={`tile p-5 ${n.pinned ? "border-2 border-foreground/20" : ""}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-black">{n.title}</h3>
              {n.pinned && <Pin className="h-4 w-4" />}
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.body}</p>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-3">{fmtDate(n.created_at)}</div>
          </div>
        ))}
        {!notices.length && <div className="tile p-10 text-center text-sm text-muted-foreground">No notices yet.</div>}
      </div>
    </div>
  );
}
