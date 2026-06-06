import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionProfile } from "@/lib/use-profile";
import { PageHeader } from "@/components/AppShell";
import { PhysicsButton } from "@/components/PhysicsButton";
import { useServerFn } from "@tanstack/react-start";
import { askAssistant } from "@/lib/apt.functions";
import { Send, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/app/assistant")({
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function AssistantPage() {
  const { data: me } = useSessionProfile();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const ask = useServerFn(askAssistant);
  const scroller = useRef<HTMLDivElement>(null);

  const ctx = useQuery({
    queryKey: ["assistant-context", me?.id, me?.role],
    enabled: !!me,
    queryFn: async () => {
      if (me?.role === "owner") {
        const [tenants, units, payments, posts] = await Promise.all([
          supabase.from("profiles").select("id, full_name, agreed_rent, unit_id, phone").eq("role", "tenant"),
          supabase.from("units").select("id, label, rent_amount, floor"),
          supabase.from("payments").select("tenant_id, amount_ksh, kind, created_at"),
          supabase.from("posts").select("author_id, content, audience, created_at").order("created_at", { ascending: false }).limit(20),
        ]);
        return { tenants: tenants.data, units: units.data, payments: payments.data, posts: posts.data };
      }
      const [me_, payments, posts] = await Promise.all([
        supabase.from("profiles").select("full_name, agreed_rent, unit_id").eq("id", me!.id).maybeSingle(),
        supabase.from("payments").select("amount_ksh, kind, created_at, note").eq("tenant_id", me!.id),
        supabase.from("posts").select("content, audience, created_at").order("created_at", { ascending: false }).limit(10),
      ]);
      return { me: me_.data, payments: payments.data, posts: posts.data };
    },
  });

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }, [msgs.length, busy]);

  async function send() {
    if (!text.trim() || !me) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setText(""); setMsgs((m) => [...m, userMsg]); setBusy(true);
    try {
      const r = await ask({ data: {
        messages: [...msgs, userMsg],
        role: me.role,
        context_json: JSON.stringify(ctx.data ?? {}).slice(0, 7000),
      }});
      setMsgs((m) => [...m, { role: "assistant", content: r.text }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "assistant", content: `Sorry, I hit an error: ${e.message}` }]);
    } finally { setBusy(false); }
  }

  const suggestions = me?.role === "owner"
    ? ["Who owes me money?", "Summarize this month", "Draft a water-outage notice"]
    : ["What is my balance?", "Draft a polite noise complaint", "What's posted recently?"];

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <PageHeader title="Nest AI" subtitle={me?.role === "owner" ? "Your property copilot" : "Your apartment helper"} />
      <div ref={scroller} className="flex-1 px-5 space-y-3 overflow-y-auto">
        {msgs.length === 0 && (
          <div className="glass-strong rounded-3xl p-5 text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-teal/20 ring-1 ring-teal/40 flex items-center justify-center"><Sparkles className="h-6 w-6 text-teal" /></div>
            <div className="mt-3 font-semibold">Hi, I know your apartment</div>
            <div className="text-xs text-muted-foreground mt-1">I read live data to answer accurately.</div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {suggestions.map((s) => (
                <button key={s} onClick={() => setText(s)} className="text-xs glass rounded-full px-3 py-1.5 hover:bg-white/10">{s}</button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] px-4 py-2.5 rounded-3xl text-[15px] leading-snug ${m.role === "user" ? "bg-teal text-primary-foreground rounded-br-md" : "glass rounded-bl-md"}`}>
              {m.role === "assistant"
                ? <div className="text-[15px] [&_p]:my-1 [&_ul]:my-1 [&_ul]:pl-4 [&_ul]:list-disc [&_strong]:text-teal [&_strong]:font-bold [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_h2]:mt-2 [&_h3]:mt-2"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                : m.content}
            </div>
          </motion.div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="glass rounded-3xl rounded-bl-md px-4 py-3 flex gap-1">
              {[0,1,2].map((i) => (
                <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-teal"
                  animate={{ y: [0, -4, 0] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-3 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-3 sticky bottom-0">
        <div className="glass-strong rounded-full p-1.5 flex items-center gap-1">
          <input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder={me?.role === "owner" ? "Ask about tenants, money, posts…" : "Ask anything…"}
            className="flex-1 bg-transparent outline-none px-4 text-sm" />
          <PhysicsButton size="sm" onClick={send} disabled={!text.trim() || busy}><Send className="h-4 w-4" /></PhysicsButton>
        </div>
      </div>
    </div>
  );
}