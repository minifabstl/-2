import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5 p-4 sm:p-10 text-center">
      <LogoMark size={44} />
      <div>
        <div className="font-display text-3xl font-bold">404</div>
        <div className="text-[15px] text-[var(--text-muted)] mt-2">The page you&apos;re looking for couldn&apos;t be found — it may have been removed or never existed.</div>
      </div>
      <div className="flex gap-3 mt-2">
        <Link href="/" className="px-5 py-2.5 rounded-[10px] bg-[var(--accent)] text-white text-sm font-semibold">
          Back to Home
        </Link>
        <Link href="/explore" className="px-5 py-2.5 rounded-[10px] border border-[var(--border)] text-sm font-semibold">
          Explore
        </Link>
      </div>
    </div>
  );
}
