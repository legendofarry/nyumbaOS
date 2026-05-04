import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { useAuth } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { Modal, Field, inputCls, PrimaryBtn } from "@/components/Modal";
import { toast } from "sonner";
import type { Ticket, Priority, TicketStatus } from "@/lib/types";

const priStyle: Record<Priority, string> = { Emergency: "bg-destructive/15 text-destructive", High: "bg-warning/15 text-warning", Normal: "bg-muted text-muted-foreground" };
const stStyle: Record<TicketStatus, string> = { Open: "bg-info/15 text-info", "In Progress": "bg-warning/15 text-warning", Done: "bg-success/15 text-success" };

export function TenantMaintenance() {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "Normal" as Priority });

  const load = async () => {
    if (!profile?.unit_id) { setLoading(false); return; }
    const { data } = await firebaseClient.from("tickets").select("*").eq("unit_id", profile.unit_id).order("created_at", { ascending: false });
    setTickets((data as Ticket[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [profile]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.unit_id) return;
    const { error } = await firebaseClient.from("tickets").insert({
      title: form.title, description: form.description, priority: form.priority,
      unit_id: profile.unit_id, created_by: user.id, status: "Open",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Ticket submitted to owner");
    setForm({ title: "", description: "", priority: "Normal" });
    setOpen(false);
    load();
  };

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Service requests</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-2">Repairs</h1>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-sm">
          <Plus className="h-4 w-4" /> Report issue
        </button>
      </header>

      <div className="space-y-3">
        {tickets.map(t => (
          <div key={t.id} className="tile p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="font-black">{t.title}</div>
              <div className="flex gap-1 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${priStyle[t.priority]}`}>{t.priority}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${stStyle[t.status]}`}>{t.status}</span>
              </div>
            </div>
            {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-3">{fmtDate(t.created_at)}</div>
          </div>
        ))}
        {!tickets.length && <div className="tile p-10 text-center text-sm text-muted-foreground">No repair requests yet.</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Report an issue">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Title"><input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Leaking tap" /></Field>
          <Field label="Describe the issue"><textarea className={inputCls} rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Urgency">
            <select className={inputCls} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}>
              <option>Normal</option><option>High</option><option>Emergency</option>
            </select>
          </Field>
          <PrimaryBtn type="submit">Send to owner</PrimaryBtn>
        </form>
      </Modal>
    </div>
  );
}
