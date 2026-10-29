"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, DollarSign, Calendar, Sparkles, ShieldCheck, RefreshCw, Users, ArrowUpRight, Check, Edit3 } from "lucide-react";

export default function AnalyticsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");
  
  const [averageIncome, setAverageIncome] = useState<string>("");
  const [currency, setCurrency] = useState<string>("GHS");
  const [rates, setRates] = useState<Record<string, number>>({});
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
        } else {
          setAverageIncome("0");
        }
        if (bizData.currency) {
          setCurrency(bizData.currency);
          setPreviousCurrency(bizData.currency);
        }
      } else {
        setAverageIncome("0");
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
      setTimeout(() => setRatesUpdatedMsg(false), 2500);
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
      setTimeout(() => setIncomeSavedSuccess(false), 2500);
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
    return <div className="w-full py-16 text-center text-xs font-medium text-neutral-400 bg-white">Loading analytics...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-4 pb-20 px-3 sm:px-4 bg-white min-h-screen text-[#111214] font-sans">
      {analyticsError && (
        <p role="alert" className="wrap-break-word rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 font-medium">{analyticsError}</p>
      )}

      {/* Header & Currency Controller Bar */}
      <div className="pt-2 border-b border-neutral-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase">y'elllo / Metrics</span>
          <h2 className="text-lg font-bold tracking-tight text-[#111214]">Analytics</h2>
        </div>

        {/* Compact Currency & Average Value Card */}
        <div className="flex w-full min-w-0 flex-col gap-2 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-3 shadow-2xs sm:w-auto sm:min-w-[280px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[#111214] shrink-0 font-bold">
                <DollarSign className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-semibold text-neutral-500 uppercase">Avg Value / Currency</span>
            </div>
            {/* iOS Styled Pill Button */}
            <button
              onClick={fetchLiveRates}
              disabled={refreshingRates}
              title="Refresh Live Market Rates"
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-neutral-700 transition-all hover:bg-neutral-100 active:scale-95 shadow-2xs"
            >
              <RefreshCw className={`w-2.5 h-2.5 text-neutral-500 ${refreshingRates ? "animate-spin" : ""}`} />
              {refreshingRates ? "Updating..." : "Rates"}
            </button>
          </div>

          {ratesUpdatedMsg && (
            <span role="status" className="rounded-lg bg-emerald-50 text-emerald-800 py-1 text-center text-[10px] font-semibold">
              Rates updated successfully
            </span>
          )}
          {ratesError && <p role="alert" className="wrap-break-word text-[10px] text-rose-600">{ratesError}</p>}

          <div className="flex min-w-0 flex-col gap-1.5 border-t border-neutral-200/60 pt-2">
            {!isEditingIncome ? (
              <div className="flex w-full items-center justify-between gap-2">
                <span className="min-w-0 wrap-break-word text-xs font-bold text-[#111214]">
                  {currency} {Number(averageIncome).toLocaleString()}
                </span>
                {/* iOS Styled Pill Button */}
                <button
                  type="button"
                  onClick={() => setIsEditingIncome(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-neutral-700 transition-all hover:bg-neutral-100 active:scale-95 shadow-2xs"
                >
                  <Edit3 className="w-2.5 h-2.5" /> Edit
                </button>
              </div>
            ) : (
              <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5">
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  aria-label="Average customer value currency"
                  className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[11px] font-bold text-[#111214] focus:outline-none"
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
                  placeholder="0"
                  className="min-w-0 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-xs font-semibold text-[#111214] focus:outline-none"
                />
                {/* iOS Styled Pill Button */}
                <button
                  type="button"
                  disabled={savingIncome}
                  onClick={handleSaveIncomeAndCurrency}
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-black px-3 text-[11px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-60 active:scale-95 shadow-2xs"
                >
                  <Check className="w-3 h-3" /> {savingIncome ? "..." : "Save"}
                </button>
              </div>
            )}
          </div>
          {incomeSavedSuccess && (
            <span role="status" className="text-[10px] font-semibold text-center text-emerald-700">Saved successfully!</span>
          )}
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Leads */}
        <div className="min-w-0 space-y-1.5 rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Leads</span>
            <Users className="w-3.5 h-3.5 text-[#111214]" />
          </div>
          <h3 className="text-2xl font-bold text-[#111214] font-mono">{totalLeads.toLocaleString()}</h3>
          <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> 100% captured
          </p>
        </div>

        {/* Today Revenue */}
        <div className="min-w-0 space-y-1.5 rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Today</span>
            <Calendar className="w-3.5 h-3.5 text-[#111214]" />
          </div>
          <h3 className="wrap-break-word text-xl font-bold leading-tight tracking-tight text-[#111214]">{formatMoney(earnedToday)}</h3>
          <p className="text-[10px] text-neutral-500">
            From <span className="font-bold text-[#111214]">{leadsToday}</span> call{leadsToday === 1 ? "" : "s"}
          </p>
        </div>

        {/* Weekly Revenue */}
        <div className="min-w-0 space-y-1.5 rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">This Week</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#111214]" />
          </div>
          <h3 className="wrap-break-word text-xl font-bold leading-tight tracking-tight text-[#111214]">{formatMoney(earnedWeek)}</h3>
          <p className="text-[10px] text-neutral-500">
            From <span className="font-bold text-[#111214]">{leadsThisWeek}</span> call{leadsThisWeek === 1 ? "" : "s"}
          </p>
        </div>

        {/* Monthly Revenue */}
        <div className="min-w-0 space-y-1.5 rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">This Month</span>
            <Sparkles className="w-3.5 h-3.5 text-[#111214]" />
          </div>
          <h3 className="wrap-break-word text-xl font-bold leading-tight tracking-tight text-[#111214]">{formatMoney(earnedMonth)}</h3>
          <p className="text-[10px] text-neutral-500">
            From <span className="font-bold text-[#111214]">{leadsThisMonth}</span> call{leadsThisMonth === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Financial Hero Banner */}
      <div className="relative flex min-w-0 flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl bg-black p-5 text-white shadow-md sm:p-6 lg:flex-row lg:items-center border border-neutral-800">
        <div className="space-y-1.5 z-10 flex-1 min-w-0 pr-0 lg:pr-4">
          <div className="flex items-center gap-1.5 text-[#f5c62e] text-[10px] font-semibold tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Total Lifetime Recovered Value
          </div>
          <h3 className="wrap-break-word text-3xl font-extrabold leading-tight tracking-tight tabular-nums text-white">{formatMoney(earnedTotal)}</h3>
          <p className="text-[11px] text-neutral-400 max-w-md leading-relaxed">
            Calculated across all <span className="font-bold text-white">{totalLeads}</span> missed leads saved with y'elllo.
          </p>
        </div>

        <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center shrink-0 z-10 w-full lg:w-auto">
          <span className="text-[9px] text-neutral-400 block uppercase font-mono tracking-wider">Status</span>
          <span className="mt-0.5 block wrap-break-word text-xs font-bold text-[#f5c62e]">Active Recovery</span>
        </div>
      </div>
    </div>
  );
}