import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDoc, collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import { db } from "@/integrations/client";
import type { Message, Profile } from "@/integrations/types";
import { fromCollection, uniqueById } from "@/lib/firestore";
import { useSessionProfile } from "@/lib/use-profile";
import { Avatar } from "@/components/Avatar";
import { PhysicsButton } from "@/components/PhysicsButton";

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
    queryFn: async () => {
      const snapshot = await getDoc(doc(db, "profiles", id));
      return snapshot.exists() ? ({ id: snapshot.id, ...(snapshot.data() as Profile) } as Profile) : null;
    },
  });
  const msgs = useQuery({
    queryKey: ["thread", me?.id, id],
    enabled: !!me?.id,
    queryFn: async () => {
      if (!me?.id) return [];

      const [sent, received] = await Promise.all([
        getDocs(query(collection(db, "messages"), where("sender_id", "==", me.id))),
        getDocs(query(collection(db, "messages"), where("recipient_id", "==", me.id))),
      ]);

      return uniqueById<Message>([
        ...fromCollection<Message>(sent),
        ...fromCollection<Message>(received),
      ])
        .filter((message) => (message.sender_id === me.id && message.recipient_id === id) || (message.sender_id === id && message.recipient_id === me.id))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    },
  });

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.data?.length]);

  async function send() {
    if (!text.trim() || !me) return;
    const message = text.trim();
    setText("");
    try {
      await addDoc(collection(db, "messages"), {
        sender_id: me.id,
        recipient_id: id,
        content: message,
        read_at: null,
        created_at: new Date().toISOString(),
      } satisfies Omit<Message, "id">);
      qc.invalidateQueries({ queryKey: ["thread", me.id, id] });
      qc.invalidateQueries({ queryKey: ["my-messages", me.id] });
    } catch {
      setText(message);
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="glass-strong flex items-center gap-3 px-5 pb-3 pt-[max(env(safe-area-inset-top),1rem)]">
        <Link to="/app/messages" className="rounded-full p-2 -ml-2 hover:bg-white/5">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {other.data && (
          <Link to="/app/tenants/$id" params={{ id: other.data.id }} className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar name={other.data.full_name} url={other.data.avatar_url} size={40} />
            <div className="min-w-0">
              <div className="truncate font-semibold">{other.data.full_name}</div>
              <div className="text-[11px] capitalize text-muted-foreground">{other.data.role}</div>
            </div>
          </Link>
        )}
      </header>

      <div ref={scrollerRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {(msgs.data ?? []).map((message) => {
          const mine = message.sender_id === me?.id;
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-3xl px-4 py-2.5 text-[15px] leading-snug ${
                  mine ? "rounded-br-md bg-teal text-primary-foreground" : "rounded-bl-md glass"
                }`}
              >
                {message.content}
                <div className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </motion.div>
          );
        })}
        {!msgs.data?.length && <div className="mt-10 text-center text-sm text-muted-foreground">Say hi 👋</div>}
      </div>

      <div className="px-3 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-2">
        <div className="glass-strong flex items-center gap-1 rounded-full p-1.5">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") send();
            }}
            placeholder="Message"
            className="flex-1 bg-transparent px-4 text-sm outline-none"
          />
          <PhysicsButton size="sm" onClick={send} disabled={!text.trim()}>
            <Send className="h-4 w-4" />
          </PhysicsButton>
        </div>
      </div>
    </div>
  );
}
