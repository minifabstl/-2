export function LogoMark({ size = 28 }: { size?: number }) {
  const gradId = "lfap-mark-grad";
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-dark)" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="8" fill={`url(#${gradId})`} />
      <path
        d="M8.2 6.2h2.7v12.1h6.3v2.4H8.2V6.2z"
        fill="white"
      />
      <path
        d="M17.4 6.2h6.1v2.35h-3.4v3.1h3.05v2.3h-3.05v3.9h-2.7V6.2z"
        fill="white"
        fillOpacity="0.92"
      />
    </svg>
  );
}

export default function Logo({ size = 28, withWordmark = true, className = "" }: { size?: number; withWordmark?: boolean; className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      {withWordmark && (
        <span className="font-display text-[17px] font-bold tracking-tight">
          Leaked<span className="text-[var(--accent)]">Fap</span>
        </span>
      )}
    </span>
  );
}
