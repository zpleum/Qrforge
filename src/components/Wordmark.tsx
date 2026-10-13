import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M1 7V1h6M13 1h6v6M19 13v6h-6M7 19H1v-6" stroke="#FFB020" strokeWidth="2.5" />
        <rect x="7" y="7" width="6" height="6" fill="#3A5BFF" />
      </svg>
      QRForge
    </Link>
  );
}
