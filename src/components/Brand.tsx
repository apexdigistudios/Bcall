import Link from "next/link";

export function BrandMark({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`brand-mark ${className}`}>y</span>;
}

export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="inline-flex min-w-0 shrink-0 items-center gap-2.5" aria-label="y'elllo homepage">
      <BrandMark />
      <span className="text-[21px] font-semibold tracking-[-0.055em]">y&apos;elllo<span className="text-muted">.</span></span>
    </Link>
  );
}
