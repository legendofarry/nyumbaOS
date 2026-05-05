import { useEffect, useMemo, useState } from "react";
import { motion, LayoutGroup, AnimatePresence } from "motion/react";
import { Plus, Home as HomeIcon, Trash2, User } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { KSH, floorLabel } from "@/lib/format";
import { Modal, Field, inputCls, PrimaryBtn } from "@/components/Modal";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { FLOORS, BEDROOM_TYPES, type Unit, type UnitStatus, type BedroomType, type Profile } from "@/lib/types";
import { exportToCSV } from "@/lib/csv";
import { Download } from "lucide-react";

const statusStyles: Record<UnitStatus, string> = {
  Occupied: "bg-success/15 text-success",
  Vacant: "bg-info/15 text-info",
  Maintenance: "bg-destructive/15 text-destructive",
};

export function Building() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Profile[]>([]);
  const [floor, setFloor] = useState<number>(0);
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({ number: "", floor: 0, bedrooms: "Bedsitter" as BedroomType, rent: 0, status: "Vacant" as UnitStatus });
  const confirm = useConfirm();

  const load = async () => {
    const [u, t] = await Promise.all([
      firebaseClient.from("units").select("*").order("floor").order("number"),
      firebaseClient.from("profiles").select("*").not("unit_id", "is", null),
    ]);
    if (u.error) toast.error(u.error.message ?? "Could not load units");
    if (t.error) toast.error(t.error.message ?? "Could not load assigned tenants");
    setUnits((u.data as Unit[]) ?? []);
    setTenants((t.data as Profile[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const floorOptions = useMemo(() => {
    const labels = new Map(FLOORS.map((item) => [item.value, item.label]));
    for (const unit of units) labels.set(unit.floor, labels.get(unit.floor) ?? floorLabel(unit.floor));
    return [...labels.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.value - b.value);
  }, [units]);

  useEffect(() => {
    if (!units.length) return;
    if (!units.some((unit) => unit.floor === floor)) {
      setFloor([...new Set(units.map((unit) => unit.floor))].sort((a, b) => a - b)[0]);
    }
  }, [floor, units]);

  const list = useMemo(() => units.filter(u => u.floor === floor), [units, floor]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.number) return;
    const { error } = await firebaseClient.from("units").insert({
      number: form.number,
      floor: form.floor,
      bedrooms: form.bedrooms,
      rent: form.rent,
      status: form.status,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Unit ${form.number} added`);
    setForm({ number: "", floor: form.floor, bedrooms: "Bedsitter", rent: 0, status: "Vacant" });
    setOpenAdd(false);
    setFloor(form.floor);
    load();
  };

  const handleDelete = async (id: string, num: string) => {
    if (!(await confirm({ title: `Delete unit ${num}?`, description: "This also unlinks any tenant assigned to this unit.", destructive: true, confirmText: "Delete" }))) return;
    const { error } = await firebaseClient.from("units").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Unit deleted");
    load();
  };

  const cycleStatus = async (id: string, current: UnitStatus) => {
    const next: UnitStatus = current === "Vacant" ? "Maintenance" : current === "Maintenance" ? "Occupied" : "Vacant";
    const { error } = await firebaseClient.from("units").update({ status: next }).eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const exportUnits = () => {
    exportToCSV(units.map(u => ({
      number: u.number, floor: floorLabel(u.floor),
      bedrooms: u.bedrooms, rent_ksh: u.rent, status: u.status,
      tenant: tenants.find(t => t.unit_id === u.id)?.full_name ?? "",
    })), "units.csv");
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Inventory</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-2">Building</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={exportUnits} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted font-semibold text-sm">
            <Download className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => { setForm(f => ({ ...f, floor })); setOpenAdd(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-sm">
            <Plus className="h-4 w-4" /> Unit
          </button>
        </div>
      </header>

      <LayoutGroup id="floor-tabs">
        <div className="tile p-2 inline-flex gap-1 self-start">
          {floorOptions.map(f => {
            const active = f.value === floor;
            const count = units.filter(u => u.floor === f.value).length;
            return (
              <button key={f.value} onClick={() => setFloor(f.value)} className="relative px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap">
                {active && <motion.div layoutId="floor-pill" className="absolute inset-0 bg-foreground rounded-2xl" transition={{ type: "spring", stiffness: 400, damping: 35 }} />}
                <span className={`relative ${active ? "text-background" : "text-muted-foreground"}`}>{f.label} <span className="opacity-60">({count})</span></span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <AnimatePresence mode="wait">
        <motion.div key={floor} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map(u => {
            const tenant = tenants.find(t => t.unit_id === u.id);
            return (
              <div key={u.id} className="tile p-5 flex flex-col gap-3 group">
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-2xl bg-muted grid place-items-center"><HomeIcon className="h-4 w-4" /></div>
                  <button onClick={() => cycleStatus(u.id, u.status)} className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${statusStyles[u.status]}`}>
                    {u.status}
                  </button>
                </div>
                <div>
                  <div className="text-2xl font-black">#{u.number}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{u.bedrooms}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">{KSH(Number(u.rent))} / mo</div>
                </div>
                <div className="border-t border-border/40 pt-3 flex items-center justify-between gap-2">
                  {tenant ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-foreground text-background grid place-items-center text-[10px] font-black flex-shrink-0">
                        {tenant.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{tenant.full_name}</div>
                        {tenant.phone && <div className="text-[10px] text-muted-foreground truncate">{tenant.phone}</div>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground"><User className="h-3.5 w-3.5" /><span className="text-xs">Vacant</span></div>
                  )}
                  <button onClick={() => handleDelete(u.id, u.number)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3.5 w-3.5 hover:text-destructive" /></button>
                </div>
              </div>
            );
          })}
          {list.length === 0 && (
            <div className="col-span-full tile p-10 text-center">
              <p className="text-sm text-muted-foreground mb-4">No units on the {floorLabel(floor)} floor yet.</p>
              <button onClick={() => { setForm(f => ({ ...f, floor })); setOpenAdd(true); }} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-foreground text-background font-bold text-sm">
                <Plus className="h-4 w-4" /> Add unit
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Add unit">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <Field label="Unit number"><input className={inputCls} value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="e.g. G01 or 101" required /></Field>
          <Field label="Floor">
            <select className={inputCls} value={form.floor} onChange={e => setForm({ ...form, floor: Number(e.target.value) })}>
              {floorOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select className={inputCls} value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value as BedroomType })}>
              {BEDROOM_TYPES.map(b => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Rent (KSh / month)"><input type="number" className={inputCls} value={form.rent || ""} onChange={e => setForm({ ...form, rent: Number(e.target.value) })} placeholder="0" /></Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as UnitStatus })}>
              <option>Vacant</option><option>Occupied</option><option>Maintenance</option>
            </select>
          </Field>
          <PrimaryBtn type="submit">Add unit</PrimaryBtn>
        </form>
      </Modal>
    </div>
  );
}
