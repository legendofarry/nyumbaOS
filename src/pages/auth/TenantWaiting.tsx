import { useEffect, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CheckCircle2, Clock3, Loader2, RefreshCcw } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import type { TenantRequest, Unit } from "@/lib/types";
import { TENANT_REQUEST_KEY } from "./TenantRegister";

export function TenantWaiting() {
  const nav = useNavigate();
  const search = useSearch({ strict: false }) as { request?: string };
  const requestId = search.request || window.localStorage.getItem(TENANT_REQUEST_KEY) || "";
  const [request, setRequest] = useState<TenantRequest | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await firebaseClient.from("tenant_requests").select("*").eq("id", requestId).maybeSingle();
    const next = data as TenantRequest | null;
    setRequest(next);

    if (next?.unit_id) {
      const unitRes = await firebaseClient.from("units").select("*").eq("id", next.unit_id).maybeSingle();
      setUnit((unitRes.data as Unit | null) ?? null);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, [requestId]);

  if (!requestId) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-4">
        <div className="w-full max-w-md tile p-8 text-center">
          <h1 className="font-black text-2xl">No registration found</h1>
          <Link to="/tenant-register" className="mt-6 inline-flex rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background">
            Register as tenant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md tile p-8 text-center">
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        ) : request?.status === "approved" && request.invite_code ? (
          <>
            <CheckCircle2 className="h-10 w-10 mx-auto text-foreground" />
            <h1 className="font-black text-2xl mt-4">Your unit is ready</h1>
            <p className="text-sm text-muted-foreground mt-2">
              You have been assigned {unit ? `Unit ${unit.number}` : "a unit"}. Use this invite code to set your password.
            </p>
            <div className="font-mono text-lg font-black bg-muted rounded-2xl py-3 mt-5">{request.invite_code}</div>
            <Link
              to="/tenant-accept"
              search={{ code: request.invite_code }}
              className="mt-5 inline-flex w-full justify-center rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background"
            >
              Continue setup
            </Link>
          </>
        ) : (
          <>
            <Clock3 className="h-10 w-10 mx-auto text-muted-foreground" />
            <h1 className="font-black text-2xl mt-4">Waiting for owner approval</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Your registration has been sent. Keep this page open or come back from the same browser.
            </p>
            <button onClick={load} className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm font-bold">
              <RefreshCcw className="h-4 w-4" />
              Check again
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
