import { useEffect, useState } from "react";
import { Plus, Trash2, Calendar as CalIcon } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { fmtDate } from "@/lib/format";
import { Modal, Field, inputCls, PrimaryBtn } from "@/components/Modal";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import type { CalEvent, EventType } from "@/lib/types";

const typeStyles: Record<EventType, string> = {
  "Move-in": "bg-success/15 text-success",
  Inspection: "bg-info/15 text-info",
  Admin: "bg-muted text-muted-foreground",
};

export function CalendarPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", date: new Date().toISOString().slice(0, 10), type: "Admin" as EventType });
  const confirm = useConfirm();

  const load = async () => {
    const { data } = await firebaseClient.from("events").select("*").order("date");
    setEvents((data as CalEvent[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await firebaseClient.from("events").insert(form);
    if (error) { toast.error(error.message); return; }
    toast.success("Event added");
    setForm({ title: "", date: new Date().toISOString().slice(0, 10), type: "Admin" });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete this event?", destructive: true, confirmText: "Delete" }))) return;
    await firebaseClient.from("events").delete().eq("id", id);
    load();
  };

  const upcoming = events.filter(e => new Date(e.date) >= new Date(new Date().toDateString()));
  const past = events.filter(e => new Date(e.date) < new Date(new Date().toDateString()));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Schedule</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-2">Calendar</h1>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-sm">
          <Plus className="h-4 w-4" /> Event
        </button>
      </header>

      <section>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Upcoming</h3>
        <div className="space-y-2">
          {upcoming.map(e => (
            <div key={e.id} className="tile p-4 flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-muted grid place-items-center"><CalIcon className="h-4 w-4" /></div>
                <div>
                  <div className="font-bold text-sm">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(e.date)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${typeStyles[e.type]}`}>{e.type}</span>
                <button onClick={() => handleDelete(e.id)} className="opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
              </div>
            </div>
          ))}
          {!upcoming.length && <p className="text-sm text-muted-foreground">No upcoming events.</p>}
        </div>
      </section>

      {past.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Past</h3>
          <div className="space-y-2 opacity-60">
            {past.map(e => (
              <div key={e.id} className="tile p-3 flex items-center justify-between text-sm">
                <span>{e.title} · {fmtDate(e.date)}</span>
                <button onClick={() => handleDelete(e.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
              </div>
            ))}
          </div>
        </section>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New event">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <Field label="Title"><input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Date"><input type="date" className={inputCls} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></Field>
          <Field label="Type">
            <select className={inputCls} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EventType })}>
              <option>Admin</option><option>Move-in</option><option>Inspection</option>
            </select>
          </Field>
          <PrimaryBtn type="submit">Save</PrimaryBtn>
        </form>
      </Modal>
    </div>
  );
}
