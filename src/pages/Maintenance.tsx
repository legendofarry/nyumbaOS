import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Download } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { KSH, fmtDate } from "@/lib/format";
import { Modal, Field, inputCls, PrimaryBtn } from "@/components/Modal";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import type { Ticket, Unit, Priority, TicketStatus } from "@/lib/types";
import { exportToCSV } from "@/lib/csv";

const priorityStyles: Record<Priority, string> = {
  Emergency: "bg-destructive/15 text-destructive",
  High: "bg-warning/15 text-warning",
  Normal: "bg-muted text-muted-foreground",
};
const statusStyles: Record<TicketStatus, string> = {
  Open: "bg-info/15 text-info",
  "In Progress": "bg-warning/15 text-warning",
  Done: "bg-success/15 text-success",
};

export function Maintenance() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", unit_id: "", priority: "Normal" as Priority, cost: 0 });
  const confirm = useConfirm();

  const load = async () => {
    const [t, u] = await Promise.all([
      firebaseClient.from("tickets").select("*").order("created_at", { ascending: false }),
      firebaseClient.from("units").select("*").order("number"),
    ]);
    setTickets((t.data as Ticket[]) ?? []);
    setUnits((u.data as Unit[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    const { data: { user } } = await firebaseClient.auth.getUser();
    const { error } = await firebaseClient.from("tickets").insert({
      title: form.title, description: form.description, unit_id: form.unit_id || null,
      priority: form.priority, cost: form.cost, created_by: user?.id ?? null, status: "Open",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Ticket created");
    setForm({ title: "", description: "", unit_id: "", priority: "Normal", cost: 0 });
    setOpen(false);
    load();
  };

  const setStatus = async (id: string, status: TicketStatus) => {
    await firebaseClient.from("tickets").update({ status }).eq("id", id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete this ticket?", destructive: true, confirmText: "Delete" }))) return;
    await firebaseClient.from("tickets").delete().eq("id", id);
    load();
  };

  const exportTickets = () => {
    exportToCSV(tickets.map(t => ({
      created: fmtDate(t.created_at), title: t.title, unit: units.find(u => u.id === t.unit_id)?.number ?? "",
      priority: t.priority, status: t.status, cost_ksh: Number(t.cost),
    })), "maintenance.csv");
  };

  const sorted = [...tickets].sort((a, b) => {
    const order: Record<Priority, number> = { Emergency: 0, High: 1, Normal: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Service desk</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-2">Maintenance</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={exportTickets} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted font-semibold text-sm"><Download className="h-4 w-4" /> CSV</button>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-sm">
            <Plus className="h-4 w-4" /> New ticket
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-3">
        {sorted.map(t => {
          const unit = units.find(u => u.id === t.unit_id);
          const isEmer = t.priority === "Emergency" && t.status !== "Done";
          return (
            <motion.div key={t.id} layout className={`tile p-5 ${isEmer ? "border-2 border-destructive/30 pulse-emergency" : ""}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="font-black text-base">{t.title}</div>
                <div className="flex gap-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${priorityStyles[t.priority]}`}>{t.priority}</span>
                </div>
              </div>
              {t.description && <p className="text-sm text-muted-foreground mb-3">{t.description}</p>}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Unit {unit?.number ?? "—"} · {fmtDate(t.created_at)}</span>
                {Number(t.cost) > 0 && <span className="font-mono font-bold">{KSH(Number(t.cost))}</span>}
              </div>
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                {(["Open", "In Progress", "Done"] as TicketStatus[]).map(s => (
                  <button key={s} onClick={() => setStatus(t.id, s)} className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-full ${t.status === s ? statusStyles[s] : "bg-muted text-muted-foreground"}`}>{s}</button>
                ))}
                <button onClick={() => handleDelete(t.id)} className="ml-auto"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
              </div>
            </motion.div>
          );
        })}
        {!tickets.length && <div className="col-span-full tile p-10 text-center text-sm text-muted-foreground">No tickets yet.</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New ticket">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <Field label="Title"><input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Description"><textarea className={inputCls} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Unit (optional)">
            <select className={inputCls} value={form.unit_id} onChange={e => setForm({ ...form, unit_id: e.target.value })}>
              <option value="">— No specific unit —</option>
              {units.map(u => <option key={u.id} value={u.id}>Unit {u.number}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className={inputCls} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}>
              <option>Normal</option><option>High</option><option>Emergency</option>
            </select>
          </Field>
          <Field label="Cost (KSh)"><input type="number" className={inputCls} value={form.cost || ""} onChange={e => setForm({ ...form, cost: Number(e.target.value) })} /></Field>
          <PrimaryBtn type="submit">Create ticket</PrimaryBtn>
        </form>
      </Modal>
    </div>
  );
}
