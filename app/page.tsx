import { getCurrentUser } from "@/lib/auth";
import { listPosts } from "@/lib/posts";
import PostGrid from "@/components/PostGrid";

export default async function HomePage() {
  const user = await getCurrentUser();
  const posts = await listPosts({ viewerId: user?.id ?? null });

  return <PostGrid posts={posts} isLoggedIn={!!user} title="For You" />;
}
