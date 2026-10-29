"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, DollarSign, Calendar, Sparkles, ShieldCheck, RefreshCw, Users, ArrowUpRight, Check, Edit3 } from "lucide-react";

export default function AnalyticsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");
  
  const [averageIncome, setAverageIncome] = useState<string>("200");
  const [currency, setCurrency] = useState<string>("GHS");
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1, GHS: 15.5, EUR: 0.92, GBP: 0.79, NGN: 1500 });
  const [refreshingRates, setRefreshingRates] = useState(false);
  const [ratesUpdatedMsg, setRatesUpdatedMsg] = useState(false);
  const [ratesError, setRatesError] = useState("");
  const [previousCurrency, setPreviousCurrency] = useState<string>("GHS");

  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [savingIncome, setSavingIncome] = useState(false);
  const [incomeSavedSuccess, setIncomeSavedSuccess] = useState(false);

  useEffect(() => {
    fetchData();
    fetchLiveRates();
  }, []);

  async function fetchData() {
    setLoading(true);
    setAnalyticsError("");
    try {
      const { data: callsData, error: callsError } = await supabase
        .from("call_events")
        .select("*")
        .order("created_at", { ascending: false });
      if (callsError) throw callsError;
      setCalls(callsData ?? []);

      const { data: bizData, error: businessError } = await supabase.from("businesses").select("*").limit(1).single();
      if (businessError && businessError.code !== "PGRST116") throw businessError;
      if (bizData) {
        setBusiness(bizData);
        if (bizData.average_income !== undefined && bizData.average_income !== null) {
          setAverageIncome(String(bizData.average_income));
        }
        if (bizData.currency) {
          setCurrency(bizData.currency);
          setPreviousCurrency(bizData.currency);
        }
      }
    } catch (error) {
      console.error("Failed to load y'elllo analytics:", error);
      setAnalyticsError(error instanceof Error ? error.message : "Could not load analytics data.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchLiveRates() {
    setRefreshingRates(true);
    setRatesUpdatedMsg(false);
    setRatesError("");
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) throw new Error(`Exchange-rate service returned ${res.status}.`);
      const data = await res.json();
      const requiredCurrencies = ["USD", "GHS", "EUR", "GBP", "NGN"];
      const newRates = data?.rates as Record<string, number> | undefined;
      if (!newRates || requiredCurrencies.some((code) => !Number.isFinite(newRates[code]) || newRates[code] <= 0)) {
        throw new Error("The exchange-rate response was missing one or more supported currencies.");
      }
      setRates(newRates);
      setRatesUpdatedMsg(true);
      setTimeout(() => setRatesUpdatedMsg(false), 3000);
    } catch (error) {
      console.error("Failed to fetch live exchange rates:", error);
      setRatesError(error instanceof Error ? error.message : "Could not refresh exchange rates.");
    } finally {
      setRefreshingRates(false);
    }
  }

  function handleCurrencyChange(newCurr: string) {
    const currentVal = Number(averageIncome);
    const rateFrom = rates[previousCurrency];
    const rateTo = rates[newCurr];
    if (!Number.isFinite(currentVal) || !rateFrom || !rateTo) {
      setRatesError("Refresh exchange rates before converting this value.");
      return;
    }
    
    const valueInUSD = currentVal / rateFrom;
    const convertedValue = valueInUSD * rateTo;

    setAverageIncome(convertedValue.toFixed(2));
    setCurrency(newCurr);
    setPreviousCurrency(newCurr);
  }

  async function handleSaveIncomeAndCurrency() {
    const numericIncome = Number(averageIncome);
    if (!Number.isFinite(numericIncome) || numericIncome < 0) {
      setAnalyticsError("Enter a valid non-negative average customer value.");
      return;
    }
    setSavingIncome(true);
    setAnalyticsError("");
    try {
      if (business?.id) {
        const { error } = await supabase.from("businesses").update({
          average_income: numericIncome,
          currency,
        }).eq("id", business.id);
        if (error) throw error;
      } else {
        throw new Error("Set up a business before saving its average customer value.");
      }
      setIsEditingIncome(false);
      setIncomeSavedSuccess(true);
      setTimeout(() => setIncomeSavedSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save y'elllo revenue settings:", error);
      setAnalyticsError(error instanceof Error ? error.message : "Could not save your revenue settings.");
    } finally {
      setSavingIncome(false);
    }
  }

  function formatMoney(num: number) {
    const symbols: Record<string, string> = {
      GHS: "₵",
      USD: "$",
      EUR: "€",
      GBP: "£",
      NGN: "₦"
    };
    const sym = symbols[currency] || currency + " ";

    if (num >= 1e12) return `${sym}${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `${sym}${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${sym}${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${sym}${(num / 1e3).toFixed(1)}K`;
    return `${sym}${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  const numericBaseIncome = Number(averageIncome) || 0;
  
  const now = new Date();
  const todayStr = now.toDateString();
  const startOfWeek = new Date();
  startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalLeads = calls.length;
  const leadsToday = calls.filter(c => new Date(c.created_at).toDateString() === todayStr).length;
  const leadsThisWeek = calls.filter(c => new Date(c.created_at) >= startOfWeek).length;
  const leadsThisMonth = calls.filter(c => new Date(c.created_at) >= startOfMonth).length;

  const earnedToday = leadsToday * numericBaseIncome;
  const earnedWeek = leadsThisWeek * numericBaseIncome;
  const earnedMonth = leadsThisMonth * numericBaseIncome;
  const earnedTotal = totalLeads * numericBaseIncome;

  if (loading) {
    return <div className="w-full py-12 text-center text-sm text-[#686b73]" role="status">Loading analytics…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 space-y-6 pb-28">
      {analyticsError && (
        <p role="alert" className="break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{analyticsError}</p>
      )}
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#111214]">Financial & Lead Analytics</h2>
          <p className="text-xs text-[#686b73] mt-0.5">
            Real-time performance metrics and recovered revenue tracking.
          </p>
        </div>

        {/* Compact Average Value & Currency Controller Card */}
        <div className="flex w-full min-w-0 flex-col gap-3 rounded-2xl border border-[#e7e7e9] bg-white p-4 shadow-sm sm:w-auto sm:min-w-[320px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg border border-[#e7e7e9] bg-[#f5c62e]/20 flex items-center justify-center text-[#111214] shrink-0">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-semibold text-[#686b73] uppercase">Avg Value / Currency</span>
            </div>
            <button
              onClick={fetchLiveRates}
              disabled={refreshingRates}
              title="Refresh Live Market Rates"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#e7e7e9] bg-[#f7f7f5] px-3 text-xs font-medium text-[#111214] transition-colors hover:bg-[#ecece8]"
            >
              <RefreshCw className={`w-3 h-3 ${refreshingRates ? "animate-spin" : ""}`} />
              {refreshingRates ? "Updating..." : "Refresh Rates"}
            </button>
          </div>

          {ratesUpdatedMsg && (
            <span role="status" className="rounded bg-[#f7f7f5] py-2 text-center text-xs font-semibold text-[#111214]">
              Live market rates updated successfully!
            </span>
          )}
          {ratesError && <p role="alert" className="break-words text-xs text-red-700">{ratesError}</p>}

          <div className="flex min-w-0 flex-col gap-2 border-t border-[#e7e7e9] pt-3">
            {!isEditingIncome ? (
              <div className="flex w-full items-center justify-between gap-3">
                <span className="min-w-0 break-words text-sm font-bold text-[#111214]">
                  {currency} {Number(averageIncome).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingIncome(true)}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-[#e7e7e9] bg-[#f7f7f5] px-3 text-xs font-semibold text-[#111214] transition-colors hover:bg-[#ecece8]"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              </div>
            ) : (
              <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  aria-label="Average customer value currency"
                  className="min-h-11 rounded-lg border border-[#e7e7e9] bg-[#f7f7f5] px-2 text-xs font-bold text-[#111214] focus:outline-none"
                >
                  <option value="GHS">GHS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="NGN">NGN</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  aria-label="Average customer value"
                  value={averageIncome}
                  onChange={(e) => setAverageIncome(e.target.value)}
                  placeholder="200"
                  className="min-w-0 rounded-lg border border-[#e7e7e9] bg-[#f7f7f5] px-2 text-sm font-semibold text-[#111214] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={savingIncome}
                  onClick={handleSaveIncomeAndCurrency}
                  className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-[#111214] px-3 text-xs font-semibold text-white hover:bg-black disabled:opacity-60"
                >
                  <Check className="w-3 h-3" /> {savingIncome ? "..." : "Save"}
                </button>
              </div>
            )}
          </div>
          {incomeSavedSuccess && (
            <span role="status" className="text-xs font-semibold text-center text-[#111214]">Saved successfully!</span>
          )}
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Leads */}
        <div className="min-w-0 space-y-2 rounded-2xl border border-[#e7e7e9] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#686b73]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Leads Captured</span>
            <Users className="w-4 h-4 text-[#111214]" />
          </div>
          <h3 className="text-3xl font-bold text-[#111214] font-mono">{totalLeads.toLocaleString()}</h3>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> 100% missed call recovery
          </p>
        </div>

        {/* Today Revenue */}
        <div className="min-w-0 space-y-2 rounded-2xl border border-[#e7e7e9] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#686b73]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Today&apos;s Revenue</span>
            <Calendar className="w-4 h-4 text-[#111214]" />
          </div>
          <h3 className="break-words text-[clamp(1.35rem,5vw,1.875rem)] font-bold leading-tight tracking-tight text-[#111214]">{formatMoney(earnedToday)}</h3>
          <p className="text-[11px] text-[#686b73]">
            From <span className="font-semibold text-[#111214]">{leadsToday}</span> call{leadsToday === 1 ? "" : "s"} today
          </p>
        </div>

        {/* Weekly Revenue */}
        <div className="min-w-0 space-y-2 rounded-2xl border border-[#e7e7e9] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#686b73]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">This Week</span>
            <TrendingUp className="w-4 h-4 text-[#111214]" />
          </div>
          <h3 className="break-words text-[clamp(1.35rem,5vw,1.875rem)] font-bold leading-tight tracking-tight text-[#111214]">{formatMoney(earnedWeek)}</h3>
          <p className="text-[11px] text-[#686b73]">
            From <span className="font-semibold text-[#111214]">{leadsThisWeek}</span> call{leadsThisWeek === 1 ? "" : "s"} this week
          </p>
        </div>

        {/* Monthly Revenue */}
        <div className="min-w-0 space-y-2 rounded-2xl border border-[#e7e7e9] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#686b73]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">This Month</span>
            <Sparkles className="w-4 h-4 text-[#111214]" />
          </div>
          <h3 className="break-words text-[clamp(1.35rem,5vw,1.875rem)] font-bold leading-tight tracking-tight text-[#111214]">{formatMoney(earnedMonth)}</h3>
          <p className="text-[11px] text-[#686b73]">
            From <span className="font-semibold text-[#111214]">{leadsThisMonth}</span> call{leadsThisMonth === 1 ? "" : "s"} this month
          </p>
        </div>
      </div>

      {/* Financial Hero Banner (Fixed Overlay & Spacing) */}
      <div className="relative flex min-w-0 flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl bg-[#111214] p-5 text-white shadow-xl sm:p-8 lg:flex-row lg:items-center">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-[#f5c62e]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 z-10 flex-1 min-w-0 pr-0 lg:pr-4">
          <div className="flex items-center gap-2 text-[#f5c62e] text-xs font-semibold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4 shrink-0" /> Total Lifetime Recovered Value
          </div>
          <h3 className="break-words text-[clamp(2rem,8vw,3.75rem)] font-bold leading-tight tracking-[-0.045em] tabular-nums">{formatMoney(earnedTotal)}</h3>
          <p className="text-xs text-white/70 max-w-lg leading-relaxed">
            Calculated across all <span className="font-semibold text-white">{totalLeads}</span> missed leads saved with y&apos;elllo.
          </p>
        </div>

        <div className="px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center shrink-0 z-10 w-full lg:w-auto">
          <span className="text-[10px] text-white/60 block uppercase font-semibold tracking-wider">Conversion Health</span>
          <span className="mt-1 block break-words text-base font-bold text-[#f5c62e] sm:text-lg">Saved with y&apos;elllo</span>
        </div>
      </div>
    </div>
  );
}