import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function LegalPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main-content" className="page-container section-space">
        <article className="mx-auto max-w-[760px]">
          <Link href="/" className="mb-10 inline-flex min-h-11 items-center gap-2 text-xs text-muted hover:text-ink"><ArrowLeft size={14} /> Back to y&apos;elllo</Link>
          <p className="eyebrow mb-4"><span className="eyebrow-dot" />THE SMALL PRINT, KEPT SIMPLE.</p>
          <h1 className="section-heading text-[48px]">{title}</h1>
          <p className="mt-5 text-[14px] leading-7 text-muted">{description}</p>
          <p className="mt-3 font-mono text-[9px] tracking-widest text-muted">LAST UPDATED · FEBRUARY 2026</p>
          <div className="mt-10 space-y-8 border-t border-line pt-8 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:tracking-[-0.035em] [&_p]:mt-3 [&_p]:text-[14px] [&_p]:leading-7 [&_p]:text-muted [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:text-[14px] [&_li]:leading-7 [&_li]:text-muted">{children}</div>
        </article>
      </main>
      <Footer />
    </>
  );
}
