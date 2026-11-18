"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
};

type RevealStyle = CSSProperties & { "--reveal-delay": string };

export function Reveal({ children, className, delay = 0, immediate = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const target = ref.current;
    if (!target) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      target.setAttribute("data-revealed", "true");
      return;
    }

    if (immediate) {
      target.setAttribute("data-reveal-pending", "true");
      const frame = window.requestAnimationFrame(() => {
        target.setAttribute("data-revealed", "true");
        target.removeAttribute("data-reveal-pending");
      });

      return () => {
        window.cancelAnimationFrame(frame);
        target.removeAttribute("data-reveal-pending");
      };
    }

    if (!("IntersectionObserver" in window)) {
      target.setAttribute("data-revealed", "true");
      return;
    }

    const bounds = target.getBoundingClientRect();
    if (bounds.top < window.innerHeight - 40 && bounds.bottom > 40) {
      target.setAttribute("data-revealed", "true");
      return;
    }

    target.dataset.revealPending = "true";
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-revealed", "true");
          entry.target.removeAttribute("data-reveal-pending");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "-40px", threshold: 0.15 },
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
      target.removeAttribute("data-reveal-pending");
    };
  }, [immediate]);

  const style: RevealStyle = { "--reveal-delay": `${delay}ms` };

  return (
    <div
      ref={ref}
      className={`scroll-reveal${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </div>
  );
}
