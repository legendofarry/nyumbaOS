import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";

import { Avatar } from "@/components/Avatar";
import { db } from "@/integrations/client";
import type { Post, Profile } from "@/integrations/types";
import { canViewPost, visiblePosts } from "@/lib/post-visibility";
import { useSessionProfile } from "@/lib/use-profile";
import { sortByCreatedAtDesc, fromCollection } from "@/lib/firestore";

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
      const snap = await getDoc(doc(db, "profiles", post.data.author_id));
      return snap.exists() ? ({ id: snap.id, ...(snap.data() as Profile) } as Profile) : null;
    },
  });

  const authorPosts = useQuery({
    queryKey: ["posts-by-author", post.data?.author_id],
    enabled: !!post.data?.author_id,
    queryFn: async () => {
      if (!post.data?.author_id) return [];
      const snapshot = await getDocs(query(collection(db, "posts"), where("author_id", "==", post.data.author_id)));
      return sortByCreatedAtDesc(fromCollection<Post>(snapshot));
    },
  });

  if (!post.data) return <div className="px-5 pt-6 text-sm text-muted-foreground">Post unavailable.</div>;

  if (!canViewPost(post.data, me)) {
    return <div className="px-5 pt-6 text-sm text-muted-foreground">Post unavailable.</div>;
  }

  const relatedPosts = visiblePosts((authorPosts.data ?? []).filter((entry) => entry.id !== post.data!.id), me);

  return (
    <div>
      <header className="flex items-center gap-2 px-5 pb-2 pt-[max(env(safe-area-inset-top),1rem)]">
        <Link to="/app/community" className="glass rounded-full p-2.5">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </header>

      <div className="space-y-5 px-5">
        <div className="space-y-4">
          <div className="glass-strong flex flex-col items-center rounded-3xl p-5 text-center">
            <Avatar name={author.data?.full_name} url={author.data?.avatar_url} size={88} />
            <div className="font-display mt-3 text-2xl font-bold">{author.data?.full_name ?? "Unknown"}</div>
            <div className="text-sm text-muted-foreground">{new Date(post.data.created_at).toLocaleString()}</div>
            <div className="mt-3 max-w-xl text-left text-[15px] leading-relaxed">{post.data.content}</div>
          </div>
          <div className="px-1">
            <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {post.data.category}
            </span>
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div className="space-y-3">
            <div className="px-1 text-xs uppercase tracking-wider text-muted-foreground">
              More from {author.data?.full_name ?? "this user"}
            </div>
            <div className="space-y-2">
              {relatedPosts.map((entry) => (
                <Link key={entry.id} to="/app/community/$id" params={{ id: entry.id }} className="glass flex items-center gap-3 rounded-2xl p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{entry.category ?? "Post"}</div>
                    <div className="truncate text-xs text-muted-foreground">{entry.content}</div>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
