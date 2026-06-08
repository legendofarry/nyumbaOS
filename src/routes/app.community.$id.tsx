import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";

import { db } from "@/integrations/client";
import type { Post, Profile } from "@/integrations/types";
import { useSessionProfile } from "@/lib/use-profile";
import { Avatar } from "@/components/Avatar";

export const Route = createFileRoute("/app/community/$id")({
  component: PostView,
});

function PostView() {
  const { id } = useParams({ from: "/app/community/$id" });
  const { data: me } = useSessionProfile();

  const post = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const snapshot = await getDoc(doc(db, "posts", id));
      return snapshot.exists() ? ({ id: snapshot.id, ...(snapshot.data() as Post) } as Post) : null;
    },
  });

  const author = useQuery({
    queryKey: ["profile", post.data?.author_id],
    enabled: !!post.data?.author_id,
    queryFn: async () => {
      if (!post.data?.author_id) return null;
      const snap = await getDoc(doc(db, "profiles", post.data!.author_id));
      return snap.exists() ? ({ id: snap.id, ...(snap.data() as Profile) } as Profile) : null;
    },
  });

  if (!post.data) return <div className="px-5 pt-6 text-sm text-muted-foreground">Loading…</div>;

  const allowed = (() => {
    if (!me) return false;
    if (post.data!.author_id === me.id) return true;
    if (post.data!.audience === "all") return true;
    if (post.data!.audience === "owner") return me.role === "owner";
    if (post.data!.audience === "specific") {
      if (me.role === "owner") return true;
      return !!post.data!.target_ids?.includes(me.id);
    }
    return false;
  })();

  return (
    <div>
      <header className="flex items-center gap-2 px-5 pb-2 pt-[max(env(safe-area-inset-top),1rem)]">
        <Link to="/app/community" className="glass rounded-full p-2.5">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </header>

      <div className="space-y-4 px-5">
        {!allowed ? (
          <div className="glass rounded-3xl p-6 text-center">
            <div className="text-sm font-semibold">Private post</div>
            <div className="text-xs text-muted-foreground mt-1">You are not allowed to view this post.</div>
          </div>
        ) : (
          <article className="glass-strong rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <Avatar name={author.data?.full_name ?? "?"} url={author.data?.avatar_url} size={40} />
              <div className="min-w-0">
                <div className="font-semibold">{author.data?.full_name ?? "Unknown"}</div>
                <div className="text-[11px] text-muted-foreground">{new Date(post.data!.created_at).toLocaleString()}</div>
              </div>
              <span className="ml-auto rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">{post.data!.category}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{post.data!.content}</p>
          </article>
        )}
      </div>
    </div>
  );
}
