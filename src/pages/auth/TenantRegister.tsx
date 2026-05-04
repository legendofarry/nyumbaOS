import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Home, Loader2 } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { Field, inputCls, PrimaryBtn } from "@/components/Modal";
import { toast } from "sonner";

const REQUEST_KEY = "nyumbaos.tenantRequestId";

export function TenantRegister() {
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await firebaseClient.from("tenant_requests").insert({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        status: "waiting",
        unit_id: null,
        invite_code: null,
        created_at: now,
        updated_at: now,
      });
      if (error) throw error;

      const requestId = data?.[0]?.id;
      if (!requestId) throw new Error("Could not create request.");

      window.localStorage.setItem(REQUEST_KEY, requestId);
      toast.success("Registration sent");
      nav({ to: "/tenant-waiting", search: { request: requestId } });
    } catch (err: any) {
      toast.error(err.message ?? "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md tile p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-foreground text-background grid place-items-center">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <div className="font-black text-xl">Tenant registration</div>
            <div className="text-xs text-muted-foreground">Request access to your home</div>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Full name">
            <input className={inputCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </Field>
          <Field label="Phone number">
            <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="+254..." />
          </Field>
          <PrimaryBtn type="submit" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Send registration"}
          </PrimaryBtn>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Already assigned?{" "}
          <Link to="/login" className="font-bold text-foreground hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

export { REQUEST_KEY as TENANT_REQUEST_KEY };
