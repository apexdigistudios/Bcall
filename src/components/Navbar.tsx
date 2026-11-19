"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";
import { Button, buttonVariants } from "@/components/ui/button";

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
    <header className="site-nav sticky top-0 z-50 border-b border-line w-full">
      <nav aria-label="Main navigation" className="page-container max-w-7xl mx-auto px-4 sm:px-6 flex min-h-16 sm:min-h-[76px] items-center justify-between gap-2 sm:gap-4 box-border">
        <Brand onClick={() => setMenuOpen(false)} />
        
        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-6 lg:flex">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className="nav-link text-sm font-medium">{item.label}</a>
          ))}
        </div>

        {/* Action Buttons & Mobile Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div className="hidden sm:block">
            <Link href="/audit" className={buttonVariants({ variant: "primary", size: "sm" })}>
              Free Audit
            </Link>
          </div>
          
          <Link href="/auth" className={buttonVariants({ variant: "primary", size: "sm", className: "!hidden shrink-0 px-3 text-xs sm:!flex" })}>
            Get started
          </Link>

          <Button
            type="button" 
            variant="neutral"
            size="icon"
            className="size-9 shrink-0 text-ink lg:hidden"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"} 
            aria-expanded={menuOpen} 
            aria-controls="mobile-navigation" 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
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
              className="flex items-center justify-between border-b border-line/60 py-2 text-xs font-medium text-ink last:border-0"
            >
              {item.label}
              <span aria-hidden="true" className="text-muted text-xs">↗</span>
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <div className="block sm:hidden w-full">
              <Link href="/audit" onClick={() => setMenuOpen(false)} className={buttonVariants({ variant: "primary", size: "sm", className: "w-full text-center text-xs" })}>
                Free Audit
              </Link>
            </div>
            <Link href="/auth" onClick={() => setMenuOpen(false)} className={buttonVariants({ variant: "primary", size: "sm", className: "w-full text-center text-xs" })}>
              Get started
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}