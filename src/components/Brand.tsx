import Link from "next/link";
import Image from "next/image";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`brand-mark ${className}`}>
      <Image src="/logo.png" alt="" width={1280} height={1280} className="brand-mark-image" />
    </span>
  );
}

export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="brand-logo" aria-label="y'elllo homepage">
      <Image src="/logo.png" alt="" width={1280} height={1280} priority className="brand-logo-image" />
    </Link>
  );
}
