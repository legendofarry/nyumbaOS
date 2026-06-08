import type { Post, Profile } from "@/integrations/types";

export function canViewPost(post: Post | null | undefined, viewer: Profile | null | undefined) {
  if (!post || !viewer) {
    return false;
  }

  if (post.author_id === viewer.id || viewer.role === "owner") {
    return true;
  }

  if (post.audience === "all") {
    return true;
  }

  if (post.audience === "owner") {
    return viewer.role === "owner";
  }

  if (post.audience === "specific") {
    return !!post.target_ids?.includes(viewer.id);
  }

  return false;
}

export function visiblePosts(posts: readonly Post[], viewer: Profile | null | undefined) {
  return posts.filter((post) => canViewPost(post, viewer));
}
