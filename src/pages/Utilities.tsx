import { useEffect, useState } from "react";
import { Plus, Trash2, Droplets, Download } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { fmtDate } from "@/lib/format";
import { Modal, Field, inputCls, PrimaryBtn } from "@/components/Modal";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import type { Reading, Unit } from "@/lib/types";
import { exportToCSV } from "@/lib/csv";

export function Utilities() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ unit_id: "", cubic_meters: 0, date: new Date().toISOString().slice(0, 10) });
  const confirm = useConfirm();

  const load = async () => {
    const [r, u] = await Promise.all([
      firebaseClient.from("readings").select("*").order("date", { ascending: false }),
      firebaseClient.from("units").select("*").order("number"),
    ]);
    setReadings((r.data as Reading[]) ?? []);
    setUnits((u.data as Unit[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unit_id) return;
    const { error } = await firebaseClient.from("readings").insert(form);
    if (error) { toast.error(error.message); return; }
    toast.success("Reading logged");
    setForm({ unit_id: "", cubic_meters: 0, date: new Date().toISOString().slice(0, 10) });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete this reading?", destructive: true, confirmText: "Delete" }))) return;
    await firebaseClient.from("readings").delete().eq("id", id);
    load();
  };

  const exportReadings = () => exportToCSV(readings.map(r => ({
    date: r.date, unit: units.find(u => u.id === r.unit_id)?.number ?? "",
    cubic_meters: Number(r.cubic_meters),
  })), "utilities.csv");

  const total = readings.reduce((s, r) => s + Number(r.cubic_meters), 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resources</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-2">Utilities</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={exportReadings} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted font-semibold text-sm"><Download className="h-4 w-4" /> CSV</button>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-sm">
            <Plus className="h-4 w-4" /> Log reading
          </button>
        </div>
      </header>

      <div className="tile p-6 bg-info text-info-foreground">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80"><Droplets className="h-4 w-4" /> Total water consumption</div>
        <div className="text-4xl font-black mt-2">{total.toLocaleString()} m³</div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {readings.map(r => {
          const u = units.find(x => x.id === r.unit_id);
          return (
            <div key={r.id} className="tile p-5 group">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-2xl bg-info/15 text-info grid place-items-center"><Droplets className="h-4 w-4" /></div>
                <button onClick={() => handleDelete(r.id)} className="opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black">{Number(r.cubic_meters)} m³</div>
                <div className="text-xs text-muted-foreground mt-1">Unit {u?.number ?? "—"} · {fmtDate(r.date)}</div>
              </div>
            </div>
          );
        })}
        {!readings.length && <div className="col-span-full tile p-10 text-center text-sm text-muted-foreground">No readings yet.</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Log meter reading">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <Field label="Unit">
            <select className={inputCls} value={form.unit_id} onChange={e => setForm({ ...form, unit_id: e.target.value })} required>
              <option value="">Select unit…</option>
              {units.map(u => <option key={u.id} value={u.id}>Unit {u.number}</option>)}
            </select>
          </Field>
          <Field label="Cubic meters (m³)"><input type="number" step="0.01" className={inputCls} value={form.cubic_meters || ""} onChange={e => setForm({ ...form, cubic_meters: Number(e.target.value) })} required /></Field>
          <Field label="Date"><input type="date" className={inputCls} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></Field>
          <PrimaryBtn type="submit">Save</PrimaryBtn>
        </form>
      </Modal>
    </div>
  );
}
