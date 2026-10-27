"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { Brand } from "./Brand";
import { DemoButton } from "./DemoButton";

const navigation = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "ROI calculator", href: "#roi-calculator" },
  { label: "FAQs", href: "#faq" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menuOpen]);

  return (
    <header className="site-nav">
      <nav aria-label="Main navigation" className="page-container flex h-[76px] items-center justify-between gap-3 lg:gap-6">
        <Brand onClick={() => setMenuOpen(false)} />
        <div className="hidden items-center gap-8 lg:flex">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className="nav-link">{item.label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <DemoButton variant="light" className="btn-sm" intent={{ source: "Navigation", kind: "demo" }} onOpen={() => setMenuOpen(false)}>
            Book a demo
          </DemoButton>
          <Link href="/auth" className="btn btn-dark btn-sm flex items-center gap-1.5">
            Get started <ArrowRight size={14} />
          </Link>
          <button 
            type="button" 
            className="grid size-9 place-items-center rounded-md text-ink lg:hidden" 
            aria-label={menuOpen ? "Close navigation" : "Open navigation"} 
            aria-expanded={menuOpen} 
            aria-controls="mobile-navigation" 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-line bg-white px-5 py-3 lg:hidden space-y-2">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="flex items-center justify-between border-b border-line py-3 text-sm last:border-0">
              {item.label}<span aria-hidden="true" className="text-muted">↗</span>
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/auth" onClick={() => setMenuOpen(false)} className="btn btn-dark btn-lg w-full text-center">
              Get started
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}