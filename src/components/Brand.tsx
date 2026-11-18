import Link from "next/link";
import Image from "next/image";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`brand-mark ${className}`}>
      <Image src="/logo.png" alt="" width={1254} height={1254} sizes="48px" className="brand-mark-image w-auto object-contain" />
    </span>
  );
}

export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="brand-logo" aria-label="y'elllo homepage">
      <BrandMark className="brand-logo-mark" />
    </Link>
  );
}
