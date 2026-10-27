"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { DemoIntent } from "@/lib/demo";
import { DemoModal } from "./DemoModal";

type DemoContextValue = { openDemo: (intent?: Partial<DemoIntent>) => void };
const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [intent, setIntent] = useState<DemoIntent | null>(null);
  const openDemo = useCallback((options?: Partial<DemoIntent>) => {
    setIntent({ kind: "demo", source: "Website", ...options });
  }, []);
  const closeDemo = useCallback(() => setIntent(null), []);

  return (
    <DemoContext.Provider value={{ openDemo }}>
      {children}
      {intent && <DemoModal intent={intent} onClose={closeDemo} />}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used inside DemoProvider");
  return context;
}
