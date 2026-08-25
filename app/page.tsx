import { getCurrentUser } from "@/lib/auth";
import { listPosts } from "@/lib/posts";
import PostGrid from "@/components/PostGrid";

export default async function HomePage() {
  const user = await getCurrentUser();
  // The home feed is videos-only — photos still upload and appear in Explore, search, and
  // topic pages, just not here.
  const posts = await listPosts({ viewerId: user?.id ?? null, viewerIsAdmin: user?.role === "admin", type: "video" });

  return <PostGrid posts={posts} isLoggedIn={!!user} title="For You" />;
}
