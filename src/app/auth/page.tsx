"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PhoneCall, ArrowRight, ShieldCheck, Smartphone, Zap } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User-only Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[#f7f7f5] text-[#111214]">
      {/* LEFT COLUMN: Dark Form Container */}
      <div className="flex w-full min-w-0 flex-col justify-between border-r border-[#27292d] bg-[#111214] p-6 text-[#f7f7f5] sm:p-8 lg:w-[480px] lg:shrink-0 lg:p-12 xl:w-[520px]">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-[#f5c62e] text-[#111214] flex items-center justify-center font-bold">
              <PhoneCall className="w-5 h-5" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">y&apos;elllo</span>
          </div>

          {/* Heading */}
          <div className="space-y-2 mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-xs text-[#90939c] leading-relaxed">
              {isSignUp 
                ? "Sign up to start recovering missed customer calls and managing your devices." 
                : "Sign in to access your dashboard and review your missed call inbox."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* User Info Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-[11px] font-semibold text-[#90939c] uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Mensah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#1c1d22] border border-[#2e3036] text-xs text-white placeholder-[#686b73] focus:outline-none focus:border-[#f5c62e] transition-colors"
                  required={isSignUp}
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[#90939c] uppercase tracking-wider mb-1.5">Email address</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#1c1d22] border border-[#2e3036] text-xs text-white placeholder-[#686b73] focus:outline-none focus:border-[#f5c62e] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#90939c] uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#1c1d22] border border-[#2e3036] text-xs text-white placeholder-[#686b73] focus:outline-none focus:border-[#f5c62e] transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 rounded-xl bg-[#f5c62e] hover:bg-[#e6b825] text-[#111214] font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
            >
              {loading ? "Processing..." : "Continue"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#90939c] hover:text-white transition-colors cursor-pointer"
            >
              {isSignUp ? "Already have an account? Sign in" : "New to y'elllo? Create a free account"}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#222326] pt-8 text-[11px] text-[#686b73]">
          <span>© {new Date().getFullYear()} y&apos;elllo</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Warm Beige + White Showcase Side */}
      <div className="hidden lg:flex flex-1 bg-[#f7f7f5] text-[#111214] p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#e7e7e9_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none" />

        <div className="max-w-xl z-10 space-y-5">
          <span className="text-xs font-bold uppercase tracking-widest text-[#686b73]">
            {isSignUp ? "Automatic Lead Capture" : "Smart Business Phone Assistant"}
          </span>
          <h2 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-[#111214] leading-tight">
            {isSignUp 
              ? "Never lose another client to an unanswered phone call." 
              : "Turn every missed ring into a happy customer."}
          </h2>
          <p className="text-sm text-[#686b73] leading-relaxed">
            {isSignUp 
              ? "Create your user profile now and connect your business phones directly inside your workspace."
              : "Connect your business phones, sync incoming inquiries in real time, and reply to prospective clients effortlessly."}
          </p>
        </div>

        <div className="z-10 grid grid-cols-2 gap-4 max-w-lg">
          <div className="p-5 rounded-2xl bg-white border border-[#e7e7e9] shadow-sm space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#f7f7f5] border border-[#e7e7e9] text-[#111214] flex items-center justify-center font-bold">
              <Smartphone className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-[#111214]">Background Detection</h4>
            <p className="text-[11px] text-[#686b73]">Runs quietly on your phone to capture unanswered calls automatically.</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#e7e7e9] shadow-sm space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#f5c62e] text-[#111214] flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-[#111214]">Instant Follow-ups</h4>
            <p className="text-[11px] text-[#686b73]">Send quick messaging links directly from your business workspace.</p>
          </div>
        </div>

        <div className="z-10 flex items-center gap-2 text-xs font-medium text-[#686b73]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Enterprise-grade security and instant synchronization
        </div>
      </div>
    </div>
  );
}