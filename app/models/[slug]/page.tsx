import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getModelBySlug } from "@/lib/models";
import { getPostsByTag, TagSort } from "@/lib/posts";
import PostGrid from "@/components/PostGrid";
import ModelFilters from "@/components/ModelFilters";

type SearchParams = { sort?: string; type?: string };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const model = await getModelBySlug(slug);
  return {
    title: model ? model.name : "Model",
    description: model ? `Videos and photos posted under ${model.name} on LeakedFap.` : undefined,
  };
}

function isTagSort(value: string | undefined): value is TagSort {
  return value === "newest" || value === "oldest" || value === "views" || value === "likes" || value === "comments";
}

export default async function ModelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const { sort, type } = await searchParams;
  const model = await getModelBySlug(slug);
  if (!model) notFound();

  const sortMode: TagSort = isTagSort(sort) ? sort : "newest";
  const typeFilter: "video" | "photo" | undefined = type === "video" || type === "photo" ? type : undefined;

  const user = await getCurrentUser();
  const posts = await getPostsByTag(model.name, {
    sort: sortMode,
    type: typeFilter,
    viewerId: user?.id ?? null,
    viewerIsAdmin: user?.role === "admin",
  });

  return (
    <>
      <nav aria-label="breadcrumb" className="px-6 pt-5 text-[11.5px] text-[var(--text-faint)] flex items-center gap-1.5">
        <Link href="/" className="hover:text-[var(--text-muted)]">Home</Link>
        <span>/</span>
        <Link href="/models" className="hover:text-[var(--text-muted)]">Models</Link>
        <span>/</span>
        <span className="text-[var(--text-muted)] font-semibold">{model.name}</span>
      </nav>

      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-[38%] md:min-w-[320px] md:max-w-[440px] shrink-0 p-4 sm:p-7 md:sticky md:top-0 md:self-start">
          <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] aspect-[3/4] md:aspect-auto md:h-[calc(100vh-90px)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={model.photoUrl} alt={model.name} className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display text-[20px] font-bold mt-4">{model.name}</h1>
          <div className="text-[12.5px] text-[var(--text-muted)] mt-1">
            {posts.length} post{posts.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="px-3 sm:px-7 pt-5">
            <ModelFilters slug={slug} sortMode={sortMode} typeFilter={typeFilter} />
          </div>

          <PostGrid posts={posts} isLoggedIn={!!user} title="" />
        </div>
      </div>
    </>
  );
}
