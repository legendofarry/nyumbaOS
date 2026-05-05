import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Pin, Sparkles, Loader2 } from "lucide-react";
import { firebaseClient } from "@/integrations/firebase/client";
import { fmtDate } from "@/lib/format";
import { Modal, Field, inputCls, PrimaryBtn } from "@/components/Modal";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import type { Notice } from "@/lib/types";
import { streamAi } from "@/lib/ai";

export function Notices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ title: "", body: "", pinned: false, expiryHours: 0 });
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const confirm = useConfirm();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const load = async () => {
    const { data } = await firebaseClient.from("notices").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false });
    const all = (data as Notice[]) ?? [];
    const now = Date.now();
    const valid = all.filter((n) => !n.expires_at || new Date(n.expires_at).getTime() > now);
    setNotices(valid);

    // Attempt cleanup of expired notices (owner/assistant only will succeed)
    const expired = all.filter((n) => n.expires_at && new Date(n.expires_at).getTime() <= now);
    for (const e of expired) {
      try {
        // best-effort delete; ignore errors (e.g., lack of permissions)
        await firebaseClient.from("notices").delete().eq("id", e.id);
      } catch (_err) {
        // ignore
      }
    }
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { title: form.title, body: form.body, pinned: Boolean(form.pinned) };
    if (form.expiryHours && Number(form.expiryHours) > 0) {
      payload.expires_at = new Date(Date.now() + Number(form.expiryHours) * 3600 * 1000).toISOString();
    }
    const { error } = await firebaseClient.from("notices").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Notice posted");
    setForm({ title: "", body: "", pinned: false, expiryHours: 0 });
    setAiPrompt("");
    setOpen(false);
    load();
  };

  const togglePin = async (n: Notice) => {
    await firebaseClient.from("notices").update({ pinned: !n.pinned }).eq("id", n.id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete this notice?", destructive: true, confirmText: "Delete" }))) return;
    await firebaseClient.from("notices").delete().eq("id", id);
    load();
  };

  const draftWithAI = async () => {
    if (!aiPrompt.trim()) { toast.error("Tell AI what the notice is about"); return; }
    setAiBusy(true);
    setForm(f => ({ ...f, body: "" }));
    let acc = "";
    await streamAi({
      mode: "draft-notice",
      messages: [{ role: "user", content: aiPrompt }],
      onDelta: (c) => { acc += c; setForm(f => ({ ...f, body: acc })); },
    });
    setAiBusy(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Communications</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-2">Notices</h1>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background font-semibold text-sm">
          <Plus className="h-4 w-4" /> Post notice
        </button>
      </header>

      <div className="grid lg:grid-cols-2 gap-3">
        {notices.map(n => (
          <div key={n.id} className={`tile p-5 group ${n.pinned ? "border-2 border-foreground/20" : ""}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-black">{n.title}</h3>
              <div className="flex gap-1">
                <button onClick={() => togglePin(n)} className={n.pinned ? "text-foreground" : "text-muted-foreground"}><Pin className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(n.id)} className="opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.body}</p>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-3">{fmtDate(n.created_at)}</div>
          </div>
        ))}
        {!notices.length && <div className="col-span-full tile p-10 text-center text-sm text-muted-foreground">No notices posted yet.</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Post notice">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <Field label="Title"><input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Field>

          <div className="bg-muted rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-muted-foreground"><Sparkles className="h-3.5 w-3.5" /> Draft with AI</div>
            <div className="flex gap-2">
              <input className={`${inputCls} bg-surface flex-1`} value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g. water shutdown saturday 9am-12pm" />
              <button type="button" onClick={draftWithAI} disabled={aiBusy} className="px-4 py-3 rounded-2xl bg-foreground text-background text-xs font-bold disabled:opacity-50">
                {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Draft"}
              </button>
            </div>
          </div>

          <Field label="Body"><textarea ref={bodyRef} className={inputCls} rows={5} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required /></Field>
          <Field label="Auto-expire">
            <select className={inputCls} value={form.expiryHours} onChange={e => setForm({ ...form, expiryHours: Number(e.target.value) })}>
              <option value={0}>Never</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={72}>72 hours</option>
            </select>
          </Field>
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} className="h-4 w-4" />
            Pin to top
          </label>
          <PrimaryBtn type="submit">Post</PrimaryBtn>
        </form>
      </Modal>
    </div>
  );
}
