"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import type { DemoIntent } from "@/lib/demo";
import { Button } from "@/components/ui/button";
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
  const handleClick = () => { onOpen?.(); openDemo(intent); };
  return (
    <Button
      variant={variant === "text" ? "ghost" : variant === "light" ? "neutral" : "primary"}
      size="sm"
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
      {arrow && <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />}
    </Button>
  );
}
