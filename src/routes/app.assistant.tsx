import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

import { db } from "@/integrations/client";
import type { Payment, Post, Profile, Unit } from "@/integrations/types";
import { getUnits } from "@/lib/units";
import { askAssistant } from "@/lib/apt.functions";
import { fromCollection, sortByCreatedAtDesc } from "@/lib/firestore";
import { useSessionProfile } from "@/lib/use-profile";
import { visiblePosts } from "@/lib/post-visibility";
import { PageHeader } from "@/components/AppShell";
import { PhysicsButton } from "@/components/PhysicsButton";

export const Route = createFileRoute("/app/assistant")({
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function AssistantPage() {
  const { data: me } = useSessionProfile();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  const ctx = useQuery({
    queryKey: ["assistant-context", me?.id, me?.role],
    enabled: !!me,
    queryFn: async () => {
      if (!me) return null;

      if (me.role === "owner") {
        const [tenantsSnap, unitsList, paymentsSnap, postsSnap] = await Promise.all([
          getDocs(collection(db, "profiles")),
          getUnits(),
          getDocs(collection(db, "payments")),
          getDocs(collection(db, "posts")),
        ]);
        return {
          tenants: fromCollection<Profile>(tenantsSnap).filter((person) => person.role === "tenant"),
          units: unitsList,
          payments: fromCollection<Payment>(paymentsSnap),
          posts: sortByCreatedAtDesc(visiblePosts(fromCollection<Post>(postsSnap), me)),
        };
      }

      const [meSnapshot, payments, posts] = await Promise.all([
        getDoc(doc(db, "profiles", me.id)),
        getDocs(query(collection(db, "payments"), where("tenant_id", "==", me.id))),
        getDocs(collection(db, "posts")),
      ]);

      return {
        me: meSnapshot.exists() ? ({ id: meSnapshot.id, ...(meSnapshot.data() as Profile) } as Profile) : null,
        payments: fromCollection<Payment>(payments),
        posts: sortByCreatedAtDesc(visiblePosts(fromCollection<Post>(posts), me)).slice(0, 10),
      };
    },
  });

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length, busy]);

  async function send() {
    if (!text.trim() || !me) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setText("");
    setMsgs((current) => [...current, userMsg]);
    setBusy(true);

    try {
      const response = await askAssistant({
        messages: [...msgs, userMsg],
        role: me.role,
        context_json: JSON.stringify(ctx.data ?? {}).slice(0, 7000),
      });
      setMsgs((current) => [...current, { role: "assistant", content: response.text }]);
    } catch (error: any) {
      setMsgs((current) => [...current, { role: "assistant", content: `Sorry, I hit an error: ${error.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  const suggestions =
    me?.role === "owner"
      ? ["Who owes me money?", "Summarize this month", "Draft a water-outage notice"]
      : ["What is my balance?", "Draft a polite noise complaint", "What's posted recently?"];

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <PageHeader title="Nest AI" subtitle={me?.role === "owner" ? "Your property copilot" : "Your apartment helper"} />
      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-5">
        {msgs.length === 0 && (
          <div className="glass-strong rounded-3xl p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/20 ring-1 ring-teal/40">
              <Sparkles className="h-6 w-6 text-teal" />
            </div>
            <div className="mt-3 font-semibold">Hi, I know your apartment</div>
            <div className="mt-1 text-xs text-muted-foreground">I read live data to answer accurately.</div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button key={suggestion} onClick={() => setText(suggestion)} className="glass rounded-full px-3 py-1.5 text-xs hover:bg-white/10">
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((message, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] rounded-3xl px-4 py-2.5 text-[15px] leading-snug ${
                message.role === "user" ? "rounded-br-md bg-teal text-primary-foreground" : "rounded-bl-md glass"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="text-[15px] [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_strong]:font-bold [&_strong]:text-teal [&_h1]:font-bold [&_h2]:mt-2 [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:font-bold">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                message.content
              )}
            </div>
          </motion.div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="glass rounded-3xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((index) => (
                  <motion.span
                    key={index}
                    className="h-1.5 w-1.5 rounded-full bg-teal"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 px-3 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-3">
        <div className="glass-strong flex items-center gap-1 rounded-full p-1.5">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") send();
            }}
            placeholder={me?.role === "owner" ? "Ask about tenants, money, posts..." : "Ask anything..."}
            className="flex-1 bg-transparent px-4 text-sm outline-none"
          />
          <PhysicsButton size="sm" onClick={send} disabled={!text.trim() || busy}>
            <Send className="h-4 w-4" />
          </PhysicsButton>
        </div>
      </div>
    </div>
  );
}
