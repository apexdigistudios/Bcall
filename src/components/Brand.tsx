import Link from "next/link";

export function BrandMark({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`brand-mark ${className}`}>CB</span>;
}

export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="inline-flex shrink-0 items-center gap-2.5" aria-label="CallBackly homepage">
      <BrandMark />
      <span className="text-[21px] font-semibold tracking-[-0.045em]">CallBackly<span className="text-muted">.</span></span>
    </Link>
  );
}
