import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { streamAi, type AiMode } from "@/lib/ai";

interface Msg { role: "user" | "assistant"; content: string }

export function AiAssistant({
  mode,
  context,
  label = "AI Assistant",
  greeting,
}: {
  mode: AiMode;
  context?: any;
  label?: string;
  greeting?: string;
}) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(greeting ? [{ role: "assistant", content: greeting }] : []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const txt = input.trim();
    if (!txt || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: txt }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    let acc = "";
    await streamAi({
      mode,
      messages: next,
      context,
      onDelta: (c) => {
        acc += c;
        setMsgs((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > next.length) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: acc } : m);
          }
          return [...prev, { role: "assistant", content: acc }];
        });
      },
      onDone: () => setBusy(false),
    });
    setBusy(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-40 h-14 w-14 rounded-full bg-foreground text-background grid place-items-center shadow-2xl hover:scale-105 transition-transform"
        aria-label="Open AI assistant"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-foreground/40 backdrop-blur-sm grid place-items-end sm:place-items-center p-3"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg h-[70vh] sm:h-[600px] bg-surface rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-foreground text-background grid place-items-center">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold">{label}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Powered by AI</div>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="h-9 w-9 grid place-items-center rounded-2xl bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                {msgs.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-12">
                    Ask me anything about your property.
                  </div>
                )}
                {msgs.map((m, i) => (
                  <div key={i} className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user" ? "self-end bg-foreground text-background" : "self-start bg-muted"}`}>
                    {m.content || (busy ? "…" : "")}
                  </div>
                ))}
                {busy && msgs[msgs.length - 1]?.role === "user" && (
                  <div className="self-start bg-muted px-4 py-2.5 rounded-2xl"><Loader2 className="h-4 w-4 animate-spin" /></div>
                )}
              </div>

              <div className="p-4 border-t border-border flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ask anything…"
                  className="flex-1 px-4 py-3 rounded-2xl bg-muted outline-none text-sm font-medium"
                  disabled={busy}
                />
                <button onClick={send} disabled={busy || !input.trim()} className="h-11 w-11 rounded-2xl bg-foreground text-background grid place-items-center disabled:opacity-50">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
