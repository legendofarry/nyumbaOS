import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionProfile } from "@/lib/use-profile";
import { PageHeader } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { PhysicsButton } from "@/components/PhysicsButton";
import { PhysicsTextarea } from "@/components/PhysicsTextarea";
import { PhysicsSelect } from "@/components/PhysicsSelect";
import { PhysicsSheet } from "@/components/PhysicsSheet";
import { Plus, Users, Eye, Crown, Send } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/app/community")({
  component: CommunityPage,
});

function CommunityPage() {
  const { data: me } = useSessionProfile();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const posts = useQuery({
    queryKey: ["posts"],
    queryFn: async () => (await supabase.from("posts").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const people = useQuery({
    queryKey: ["people"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, role, avatar_url, unit_id")).data ?? [],
  });

  return (
    <div>
      <PageHeader title="Notice board" subtitle="Posts from owner & tenants"
        right={<PhysicsButton size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Post</PhysicsButton>} />
      <div className="px-5 space-y-3">
        {(posts.data ?? []).map((p: any) => {
          const author = people.data?.find((x: any) => x.id === p.author_id);
          return (
            <motion.article key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="glass-strong rounded-3xl p-4">
              <div className="flex items-center gap-3">
                <Avatar name={author?.full_name ?? "?"} url={author?.avatar_url} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate flex items-center gap-1.5">
                    {author?.full_name ?? "Unknown"}
                    {author?.role === "owner" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal/20 text-teal flex items-center gap-1"><Crown className="h-2.5 w-2.5" />Owner</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()} · {audienceLabel(p)}
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-white/5 px-2 py-1 rounded-full">{p.category}</span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">{p.content}</p>
            </motion.article>
          );
        })}
        {!posts.data?.length && <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">No posts yet. Start the conversation.</div>}
      </div>

      <PhysicsSheet open={open} onClose={() => setOpen(false)} title="New post">
        <ComposePost
          me={me}
          people={(people.data ?? []).filter((x: any) => x.id !== me?.id)}
          onPosted={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["posts"] }); }} />
      </PhysicsSheet>
    </div>
  );
}

function audienceLabel(p: any) {
  if (p.audience === "all") return "Everyone";
  if (p.audience === "owner") return "Owner only";
  if (p.audience === "specific") return `${p.target_ids?.length ?? 0} recipients`;
  return p.audience;
}

function ComposePost({ me, people, onPosted }: { me: any; people: any[]; onPosted: () => void }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string | null>("general");
  const [audience, setAudience] = useState<string | null>(me?.role === "owner" ? "all" : "all");
  const [targets, setTargets] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const audienceOptions = me?.role === "owner"
    ? [
        { value: "all", label: "Everyone", hint: "All tenants see this" },
        { value: "specific", label: "Specific tenants", hint: "Pick recipients" },
      ]
    : [
        { value: "all", label: "Everyone", hint: "All neighbors & owner" },
        { value: "owner", label: "Owner only", hint: "Private to owner" },
        { value: "specific", label: "Specific neighbors", hint: "Pick recipients" },
      ];

  async function submit() {
    if (!content.trim()) { toast.error("Write something first"); return; }
    setBusy(true);
    const { error } = await supabase.from("posts").insert({
      author_id: me.id,
      content: content.trim(),
      category: category ?? "general",
      audience: audience ?? "all",
      target_ids: audience === "specific" ? targets : [],
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Posted");
    onPosted();
  }

  return (
    <div className="space-y-3">
      <PhysicsTextarea label="What's on your mind?" placeholder="Water will be off tomorrow 9–11am…" value={content} onChange={(e) => setContent(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <PhysicsSelect label="Category" value={category} onChange={setCategory} options={[
          { value: "general", label: "General" },
          { value: "notice", label: "Notice" },
          { value: "maintenance", label: "Maintenance" },
          { value: "event", label: "Event" },
          { value: "request", label: "Request" },
        ]} />
        <PhysicsSelect label="Visibility" value={audience} onChange={setAudience} options={audienceOptions} />
      </div>

      {audience === "specific" && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1.5 px-1 flex items-center gap-1"><Users className="h-3 w-3" /> Pick recipients</div>
          <div className="glass rounded-2xl p-2 max-h-56 overflow-auto space-y-1">
            {people.map((p) => {
              const checked = targets.includes(p.id);
              return (
                <button key={p.id} type="button" onClick={() => setTargets((t) => checked ? t.filter((x) => x !== p.id) : [...t, p.id])}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl transition-colors ${checked ? "bg-teal/20" : "hover:bg-white/5"}`}>
                  <Avatar name={p.full_name} url={p.avatar_url} size={32} />
                  <span className="flex-1 text-left text-sm font-medium">{p.full_name}</span>
                  <span className={`h-4 w-4 rounded-md border ${checked ? "bg-teal border-teal" : "border-white/20"}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Eye className="h-3.5 w-3.5" />
        {audience === "all" && "Everyone in the building will see this."}
        {audience === "owner" && "Only the owner will see this."}
        {audience === "specific" && `${targets.length} recipient${targets.length === 1 ? "" : "s"} will see this (plus the owner).`}
      </div>

      <PhysicsButton size="lg" className="w-full" disabled={busy} onClick={submit}>
        <Send className="h-4 w-4" /> {busy ? "Posting…" : "Post"}
      </PhysicsButton>
    </div>
  );
}