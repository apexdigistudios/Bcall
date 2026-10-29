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
    <header className="site-nav sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-line w-full">
      <nav aria-label="Main navigation" className="page-container max-w-7xl mx-auto px-4 sm:px-6 flex h-16 sm:h-[76px] items-center justify-between gap-2 sm:gap-4 box-border">
        <Brand onClick={() => setMenuOpen(false)} />
        
        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-6 lg:flex">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className="nav-link text-sm font-medium">{item.label}</a>
          ))}
        </div>

        {/* Action Buttons & Mobile Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <DemoButton variant="light" className="btn-sm" intent={{ source: "Navigation", kind: "demo" }} onOpen={() => setMenuOpen(false)}>
              Book a demo
            </DemoButton>
          </div>
          
          <Link href="/auth" className="btn btn-dark btn-sm text-xs sm:text-sm px-3 py-2 flex items-center gap-1 shrink-0">
            Get started <ArrowRight size={13} />
          </Link>

          <button 
            type="button" 
            className="grid size-9 place-items-center rounded-lg text-ink lg:hidden bg-[#f7f7f5] border border-line shrink-0" 
            aria-label={menuOpen ? "Close navigation" : "Open navigation"} 
            aria-expanded={menuOpen} 
            aria-controls="mobile-navigation" 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-line bg-white px-4 py-4 lg:hidden space-y-1 shadow-xl animate-in slide-in-from-top-2">
          {navigation.map((item) => (
            <a 
              key={item.href} 
              href={item.href} 
              onClick={() => setMenuOpen(false)} 
              className="flex items-center justify-between border-b border-line/60 py-3 text-xs sm:text-sm font-medium text-ink last:border-0"
            >
              {item.label}
              <span aria-hidden="true" className="text-muted text-xs">↗</span>
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <div className="block sm:hidden w-full">
              <DemoButton variant="light" className="w-full text-center py-2.5 text-xs" intent={{ source: "Navigation", kind: "demo" }} onOpen={() => setMenuOpen(false)}>
                Book a demo
              </DemoButton>
            </div>
            <Link href="/auth" onClick={() => setMenuOpen(false)} className="btn btn-dark btn-lg w-full text-center text-xs sm:text-sm py-2.5">
              Get started
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}