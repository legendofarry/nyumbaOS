import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { Crown, Eye, Plus, Send, Users } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { db } from "@/integrations/client";
import type { Post, Profile } from "@/integrations/types";
import { fromCollection, sortByCreatedAtDesc, sortByName } from "@/lib/firestore";
import { useSessionProfile } from "@/lib/use-profile";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/AppShell";
import { PhysicsButton } from "@/components/PhysicsButton";
import { PhysicsSelect } from "@/components/PhysicsSelect";
import { PhysicsSheet } from "@/components/PhysicsSheet";
import { PhysicsTextarea } from "@/components/PhysicsTextarea";

export const Route = createFileRoute("/app/community")({
  component: CommunityPage,
});

function CommunityPage() {
  const { data: me } = useSessionProfile();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const posts = useQuery({
    queryKey: ["posts"],
    queryFn: async () => sortByCreatedAtDesc(fromCollection<Post>(await getDocs(collection(db, "posts")))),
  });
  const people = useQuery({
    queryKey: ["people"],
    queryFn: async () => sortByName(fromCollection<Profile>(await getDocs(collection(db, "profiles")))),
  });

  const loc = useLocation();
  // If URL is /app/community/:id render the child route (full-screen post view)
  if (typeof window !== "undefined" && /^\/app\/community\/[^/]+$/.test(loc.pathname)) {
    return <Outlet />;
  }

  return (
    <div>
      <PageHeader
        title="Notice board"
        subtitle="Posts from owner & tenants"
        right={
          <PhysicsButton size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Post
          </PhysicsButton>
        }
      />
      <div className="space-y-3 px-5">
        {(posts.data ?? []).map((post) => {
          const author = people.data?.find((person) => person.id === post.author_id);
          return (
            <Link to="/app/community/$id" params={{ id: post.id }} key={post.id}>
              <motion.article initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={author?.full_name ?? "?"} url={author?.avatar_url} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate font-semibold">
                      {author?.full_name ?? "Unknown"}
                      {author?.role === "owner" && (
                        <span className="flex items-center gap-1 rounded-full bg-teal/20 px-1.5 py-0.5 text-[10px] text-teal">
                          <Crown className="h-2.5 w-2.5" />
                          Owner
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(post.created_at).toLocaleString()} · {audienceLabel(post)}
                    </div>
                  </div>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {post.category}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>
              </motion.article>
            </Link>
          );
        })}
        {!posts.data?.length && <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">No posts yet. Start the conversation.</div>}
      </div>

      <PhysicsSheet open={open} onClose={() => setOpen(false)} title="New post">
        <ComposePost
          me={me}
          people={(people.data ?? []).filter((person) => person.id !== me?.id)}
          onPosted={() => {
            setOpen(false);
            qc.invalidateQueries({ queryKey: ["posts"] });
          }}
        />
      </PhysicsSheet>
    </div>
  );
}

function audienceLabel(post: Post) {
  if (post.audience === "all") return "Everyone";
  if (post.audience === "owner") return "Owner only";
  if (post.audience === "specific") return `${post.target_ids?.length ?? 0} recipients`;
  return post.audience;
}

function ComposePost({ me, people, onPosted }: { me: Profile | null | undefined; people: Profile[]; onPosted: () => void }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string | null>("general");
  const [audience, setAudience] = useState<string | null>(me?.role === "owner" ? "all" : "all");
  const [targets, setTargets] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const audienceOptions =
    me?.role === "owner"
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
    if (!content.trim() || !me) {
      toast.error("Write something first");
      return;
    }

    setBusy(true);
    try {
      await addDoc(collection(db, "posts"), {
        author_id: me.id,
        content: content.trim(),
        category: category ?? "general",
        audience: audience ?? "all",
        target_ids: audience === "specific" ? targets : [],
        created_at: new Date().toISOString(),
      } satisfies Omit<Post, "id">);
      toast.success("Posted");
      onPosted();
    } catch (error: any) {
      toast.error(error.message || "Could not create post");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <PhysicsTextarea
        label="What's on your mind?"
        placeholder="Water will be off tomorrow 9-11am..."
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <PhysicsSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={[
            { value: "general", label: "General" },
            { value: "notice", label: "Notice" },
            { value: "maintenance", label: "Maintenance" },
            { value: "event", label: "Event" },
            { value: "request", label: "Request" },
          ]}
        />
        <PhysicsSelect label="Visibility" value={audience} onChange={setAudience} options={audienceOptions} />
      </div>

      {audience === "specific" && (
        <div>
          <div className="mb-1.5 flex items-center gap-1 px-1 text-xs font-medium text-muted-foreground">
            <Users className="h-3 w-3" /> Pick recipients
          </div>
          <div className="max-h-56 space-y-1 overflow-auto rounded-2xl glass p-2">
            {people.map((person) => {
              const checked = targets.includes(person.id);
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setTargets((current) => (checked ? current.filter((id) => id !== person.id) : [...current, person.id]))}
                  className={`flex w-full items-center gap-2 rounded-xl p-2 transition-colors ${checked ? "bg-teal/20" : "hover:bg-white/5"}`}
                >
                  <Avatar name={person.full_name} url={person.avatar_url} size={32} />
                  <span className="flex-1 text-left text-sm font-medium">{person.full_name}</span>
                  <span className={`h-4 w-4 rounded-md border ${checked ? "border-teal bg-teal" : "border-white/20"}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass flex items-center gap-2 rounded-2xl p-3 text-xs text-muted-foreground">
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
