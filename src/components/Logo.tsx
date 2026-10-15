export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#1c1917" />
      <path
        d="M20 40c2 4.5 6.5 7 12 7 6.6 0 11-3.4 11-8.4 0-4.6-3.3-6.8-9.7-8.2-4.6-1-6.3-1.9-6.3-3.8 0-1.8 1.8-3.1 4.6-3.1 3 0 5 1.4 5.9 3.6"
        fill="none"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx="46" cy="18" r="4" fill="#5fd3c2" />
    </svg>
  );
}
