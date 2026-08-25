import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listModels } from "@/lib/models";
import AddModelButton from "@/components/AddModelButton";

export const metadata: Metadata = {
  title: "Models",
  description: "Browse popular creators and models on LeakedFap.",
};

export default async function ModelsPage() {
  const [user, allModels] = await Promise.all([getCurrentUser(), listModels()]);

  return (
    <>
      <nav aria-label="breadcrumb" className="px-6 pt-5 text-[11.5px] text-[var(--text-faint)] flex items-center gap-1.5">
        <Link href="/" className="hover:text-[var(--text-muted)]">Home</Link>
        <span>/</span>
        <span className="text-[var(--text-muted)] font-semibold">Models</span>
      </nav>

      <div className="p-4 sm:p-7">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="font-display text-[20px] font-bold leading-tight">Models</h1>
            <div className="text-[12.5px] text-[var(--text-muted)] mt-0.5">
              Popular creators and models — click a photo to see everything posted under their name.
            </div>
          </div>
          <AddModelButton isLoggedIn={!!user} />
        </div>

        {allModels.length === 0 ? (
          <div className="text-sm text-[var(--text-muted)] py-10 text-center">
            No models yet — be the first to add one.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allModels.map((m) => (
              <Link
                key={m.id}
                href={`/models/${m.slug}`}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.photoUrl}
                    alt={m.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="text-[12.5px] font-semibold truncate w-full text-center">{m.name}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
