import { useEffect, useState } from "react";
import { Droplets, Loader2 } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { useAuth } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import type { Reading } from "@/lib/types";

export function TenantUtilities() {
  const { profile } = useAuth();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.unit_id) { setLoading(false); return; }
    firebaseClient.from("readings").select("*").eq("unit_id", profile.unit_id).order("date", { ascending: false }).then(({ data }) => {
      setReadings((data as Reading[]) ?? []);
      setLoading(false);
    });
  }, [profile]);

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const total = readings.reduce((s, r) => s + Number(r.cubic_meters), 0);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your usage</p>
        <h1 className="text-3xl sm:text-4xl font-black mt-2">Water</h1>
      </header>

      <div className="tile p-6 bg-info text-info-foreground">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80"><Droplets className="h-4 w-4" /> Total recorded</div>
        <div className="text-4xl font-black mt-2">{total.toLocaleString()} m³</div>
      </div>

      <div className="space-y-2">
        {readings.map(r => (
          <div key={r.id} className="tile p-4 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">{Number(r.cubic_meters)} m³</div>
              <div className="text-xs text-muted-foreground">{fmtDate(r.date)}</div>
            </div>
          </div>
        ))}
        {!readings.length && <div className="tile p-10 text-center text-sm text-muted-foreground">No readings logged yet.</div>}
      </div>
    </div>
  );
}
