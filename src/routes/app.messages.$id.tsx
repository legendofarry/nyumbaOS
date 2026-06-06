import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/client";
import { useSessionProfile } from "@/lib/use-profile";
import { Avatar } from "@/components/Avatar";
import { PhysicsButton } from "@/components/PhysicsButton";
import { ArrowLeft, Send } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/app/messages/$id")({
  component: Thread,
});

function Thread() {
  const { id } = useParams({ from: "/app/messages/$id" });
  const { data: me } = useSessionProfile();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const other = useQuery({
    queryKey: ["person", id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", id).maybeSingle()).data,
  });
  const msgs = useQuery({
    queryKey: ["thread", me?.id, id],
    enabled: !!me?.id,
    queryFn: async () => (await supabase.from("messages").select("*")
      .or(`and(sender_id.eq.${me!.id},recipient_id.eq.${id}),and(sender_id.eq.${id},recipient_id.eq.${me!.id})`)
      .order("created_at")).data ?? [],
  });

  useEffect(() => {
    if (!me?.id) return;
    const ch = supabase.channel(`messages:${me.id}:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        qc.invalidateQueries({ queryKey: ["thread", me.id, id] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me?.id, id, qc]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.data?.length]);

  async function send() {
    if (!text.trim() || !me) return;
    const t = text.trim();
    setText("");
    const { error } = await supabase.from("messages").insert({ sender_id: me.id, recipient_id: id, content: t });
    if (error) { setText(t); return; }
    qc.invalidateQueries({ queryKey: ["thread", me.id, id] });
    qc.invalidateQueries({ queryKey: ["my-messages", me.id] });
  }

  return (
    <div className="flex flex-col h-[100dvh]">
      <header className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3 flex items-center gap-3 glass-strong">
        <Link to="/app/messages" className="p-2 -ml-2 rounded-full hover:bg-white/5"><ArrowLeft className="h-4 w-4" /></Link>
        {other.data && (
          <Link to="/app/tenants/$id" params={{ id: other.data.id }} className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar name={other.data.full_name} url={other.data.avatar_url} size={40} />
            <div className="min-w-0">
              <div className="font-semibold truncate">{other.data.full_name}</div>
              <div className="text-[11px] text-muted-foreground capitalize">{other.data.role}</div>
            </div>
          </Link>
        )}
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {(msgs.data ?? []).map((m: any) => {
          const mine = m.sender_id === me?.id;
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] px-4 py-2.5 rounded-3xl text-[15px] leading-snug ${mine ? "bg-teal text-primary-foreground rounded-br-md" : "glass rounded-bl-md"}`}>
                {m.content}
                <div className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </motion.div>
          );
        })}
        {!msgs.data?.length && <div className="text-center text-sm text-muted-foreground mt-10">Say hi 👋</div>}
      </div>

      <div className="px-3 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-2">
        <div className="glass-strong rounded-full p-1.5 flex items-center gap-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Message"
            className="flex-1 bg-transparent outline-none px-4 text-sm" />
          <PhysicsButton size="sm" onClick={send} disabled={!text.trim()}>
            <Send className="h-4 w-4" />
          </PhysicsButton>
        </div>
      </div>
    </div>
  );
}