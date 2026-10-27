"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import type { DemoIntent } from "@/lib/demo";
import { useDemo } from "./DemoProvider";

type DemoButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  children: ReactNode;
  variant?: "primary" | "dark" | "light" | "text";
  intent?: Partial<DemoIntent>;
  arrow?: boolean;
  onOpen?: () => void;
};

export function DemoButton({ children, variant = "dark", intent, arrow = true, className = "", onOpen, ...props }: DemoButtonProps) {
  const { openDemo } = useDemo();
  return (
    <button type="button" className={`btn btn-${variant} ${className}`} onClick={() => { onOpen?.(); openDemo(intent); }} {...props}>
      {children}
      {arrow && <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />}
    </button>
  );
}
