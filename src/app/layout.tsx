import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { DemoProvider } from "@/components/DemoProvider";
import { ScrollReveal } from "@/components/ScrollReveal";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Y'elllo — Turn missed calls into booked customers",
  description: "You do the work. Y'elllo follows up. Turn missed calls into conversations, bookings, and revenue with automatic text follow-ups. Try it free for 14 days.",
  keywords: ["missed call recovery", "automatic text back", "local business", "appointment booking", "y'elllo"],
  openGraph: {
    title: "Y'elllo — Never let a missed call be a missed opportunity",
    description: "Automatic follow-ups. More bookings. Zero extra effort. Built for local businesses that can’t afford to miss customers.",
    type: "website",
    siteName: "y'elllo",
  },
  twitter: { card: "summary_large_image", title: "Y'elllo — Make every call count", description: "Turn missed calls into booked customers. Your next two weeks are on us." },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        <a href="#main-content" className="fixed top-3 left-4 z-120 -translate-y-24 rounded-lg bg-ink px-4 py-3 text-sm text-white focus:translate-y-0">Skip to content</a>
        <DemoProvider>
          <ScrollReveal />
          <div className="min-h-screen w-full overflow-x-hidden">{children}</div>
        </DemoProvider>
      </body>
    </html>
  );
}
