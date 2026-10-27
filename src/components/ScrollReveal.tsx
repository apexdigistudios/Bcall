"use client";

import { useLayoutEffect } from "react";

export function ScrollReveal() {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    const targets = document.querySelectorAll("[data-reveal]");
    if (targets.length === 0) return;

    targets.forEach((target) => {
      const bounds = target.getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0) {
        target.setAttribute("data-revealed", "true");
      }
    });

    document.documentElement.dataset.scrollReveal = "enabled";
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-revealed", "true");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01 });

    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      delete document.documentElement.dataset.scrollReveal;
      targets.forEach((target) => target.removeAttribute("data-revealed"));
    };
  }, []);

  return null;
}
