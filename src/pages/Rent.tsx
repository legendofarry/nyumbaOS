import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Download } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { KSH, fmtDate } from "@/lib/format";
import { Modal, Field, inputCls, PrimaryBtn } from "@/components/Modal";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import type { Profile, Payment, Unit, PaymentType } from "@/lib/types";
import { exportToCSV } from "@/lib/csv";

export function Rent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Profile[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tenant_id: "", amount: 0, type: "Rent" as PaymentType, date: new Date().toISOString().slice(0, 10), note: "" });
  const confirm = useConfirm();

  const load = async () => {
    const [p, t, u] = await Promise.all([
      firebaseClient.from("payments").select("*").order("date", { ascending: false }),
      firebaseClient.from("profiles").select("*").not("unit_id", "is", null),
      firebaseClient.from("units").select("*"),
    ]);
    setPayments((p.data as Payment[]) ?? []);
    setTenants((t.data as Profile[]) ?? []);
    setUnits((u.data as Unit[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const monthTotal = useMemo(() => {
    const m = new Date().getMonth();
    return payments.filter(p => new Date(p.date).getMonth() === m).reduce((s, p) => s + Number(p.amount), 0);
  }, [payments]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenant_id || !form.amount) return;
    const { error } = await firebaseClient.from("payments").insert(form);
    if (error) { toast.error(error.message); return; }
    toast.success("Payment recorded");
    setForm({ tenant_id: "", amount: 0, type: "Rent", date: new Date().toISOString().slice(0, 10), note: "" });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete this payment?", destructive: true, confirmText: "Delete" }))) return;
    await firebaseClient.from("payments").delete().eq("id", id);
    toast.success("Deleted");
    load();
  };

  const exportPayments = () => {
    exportToCSV(payments.map(p => {
      const t = tenants.find(x => x.id === p.tenant_id);
      const u = units.find(x => x.id === t?.unit_id);
      return {
        date: p.date, tenant: t?.full_name ?? "", unit: u?.number ?? "",
        type: p.type, amount_ksh: Number(p.amount), note: p.note ?? "",
      };
    }), "payments.csv");
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Financials</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-2">Rent ledger</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPayments} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted font-semibold text-sm"><Download className="h-4 w-4" /> CSV</button>
          <button onClick={() => setOpen(true)} disabled={!tenants.length} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-sm disabled:opacity-50">
            <Plus className="h-4 w-4" /> Record payment
          </button>
        </div>
      </header>

      <div className="tile p-6 bg-foreground text-background">
        <div className="text-xs uppercase tracking-widest opacity-70">This month</div>
        <div className="text-4xl font-black mt-2">{KSH(monthTotal)}</div>
        <div className="text-xs opacity-70 mt-1">{payments.filter(p => new Date(p.date).getMonth() === new Date().getMonth()).length} payments</div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block tile p-2 overflow-hidden">
        <table className="w-full">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Tenant</th><th className="text-left p-3">Unit</th><th className="text-left p-3">Type</th><th className="text-right p-3">Amount</th><th></th></tr>
          </thead>
          <tbody>
            {payments.map(p => {
              const t = tenants.find(x => x.id === p.tenant_id);
              const u = units.find(x => x.id === t?.unit_id);
              return (
                <tr key={p.id} className="border-t border-border/40 hover:bg-muted/40">
                  <td className="p-3 text-sm">{fmtDate(p.date)}</td>
                  <td className="p-3 text-sm font-semibold">{t?.full_name ?? "—"}</td>
                  <td className="p-3 text-sm text-muted-foreground">{u?.number ?? "—"}</td>
                  <td className="p-3"><span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-muted">{p.type}</span></td>
                  <td className="p-3 text-right font-mono font-bold">{KSH(Number(p.amount))}</td>
                  <td className="p-3 text-right"><button onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button></td>
                </tr>
              );
            })}
            {!payments.length && <tr><td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">No payments yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-2">
        {payments.map(p => {
          const t = tenants.find(x => x.id === p.tenant_id);
          return (
            <div key={p.id} className="tile p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm">{t?.full_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{p.type} · {fmtDate(p.date)}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-black text-success">{KSH(Number(p.amount))}</div>
                <button onClick={() => handleDelete(p.id)} className="mt-1"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Record payment">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <Field label="Tenant">
            <select className={inputCls} value={form.tenant_id} onChange={e => setForm({ ...form, tenant_id: e.target.value })} required>
              <option value="">Select tenant…</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select className={inputCls} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as PaymentType })}>
              <option>Rent</option><option>Water</option><option>Service</option>
            </select>
          </Field>
          <Field label="Amount (KSh)"><input type="number" className={inputCls} value={form.amount || ""} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} required /></Field>
          <Field label="Date"><input type="date" className={inputCls} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></Field>
          <Field label="Note (optional)"><input className={inputCls} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></Field>
          <PrimaryBtn type="submit">Save</PrimaryBtn>
        </form>
      </Modal>
    </div>
  );
}
