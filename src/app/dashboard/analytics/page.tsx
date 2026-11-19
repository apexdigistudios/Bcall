"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, DollarSign, Calendar, Sparkles, ShieldCheck, RefreshCw, Users, ArrowUpRight, Check, Edit3, LineChart, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Chart view switcher state: 'day' | 'week' | 'month'
  const [chartView, setChartView] = useState<"day" | "week" | "month">("day");

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

  // Real chart data aggregation based on selected chartView (day, week, month)
  const getChartData = () => {
    if (chartView === "day") {
      // Last 7 days
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(now.getDate() - (6 - i));
        const dStr = d.toDateString();
        const count = calls.filter(c => new Date(c.created_at).toDateString() === dStr).length;
        return { label: d.toLocaleDateString([], { weekday: 'short' }), count };
      });
    } else if (chartView === "week") {
      // Last 6 weeks
      return Array.from({ length: 6 }, (_, i) => {
        const start = new Date();
        start.setDate(now.getDate() - (5 - i) * 7 - 6);
        const end = new Date();
        end.setDate(now.getDate() - (5 - i) * 7);
        const count = calls.filter(c => {
          const dt = new Date(c.created_at);
          return dt >= start && dt <= end;
        }).length;
        return { label: `Wk ${i + 1}`, count };
      });
    } else {
      // Last 6 months
      return Array.from({ length: 6 }, (_, i) => {
        const targetMonth = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const mYear = targetMonth.getFullYear();
        const mMonth = targetMonth.getMonth();
        const count = calls.filter(c => {
          const dt = new Date(c.created_at);
          return dt.getFullYear() === mYear && dt.getMonth() === mMonth;
        }).length;
        return { label: targetMonth.toLocaleDateString([], { month: 'short' }), count };
      });
    }
  };

  const currentChartData = getChartData();
  const maxChartCount = Math.max(...currentChartData.map(d => d.count), 1);

  if (loading) {
    return <div className="w-full py-16 text-center text-xs font-mono text-zinc-500 bg-transparent">Loading analytics...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-5 pb-20 px-2 sm:px-0 bg-transparent min-h-screen text-zinc-900 dark:text-zinc-100 font-sans text-[11px]">
      {analyticsError && (
        <p role="alert" className="wrap-break-word rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-900 dark:text-rose-200 font-medium">{analyticsError}</p>
      )}

      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-[#282B29] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[9px] font-mono tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">y'elllo / Metrics</span>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Analytics & Revenue</h2>
        </div>
      </div>

      {/* Separated Settings Grid: Currency Selector & Average Customer Value */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Currency & Live Market Rates Control Box */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-zinc-200 dark:border-[#282B29] bg-white dark:bg-[#191B1A] p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#141615] border border-zinc-200 dark:border-[#282B29] flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0 font-bold">
                <DollarSign className="w-3.5 h-3.5 text-[#EAB308]" />
              </div>
              <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Currency Selection</span>
            </div>
            <Button
              onClick={fetchLiveRates}
              disabled={refreshingRates}
              title="Refresh Live Market Rates"
              variant="neutral"
              size="xs"
              className="text-[10px]"
            >
              <RefreshCw className={`w-3 h-3 text-zinc-500 ${refreshingRates ? "animate-spin" : ""}`} />
              {refreshingRates ? "Updating..." : "Rates"}
            </Button>
          </div>

          {ratesUpdatedMsg && (
            <span role="status" className="rounded-md bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 py-1 text-center text-[10px] font-semibold">
              Rates updated successfully
            </span>
          )}
          {ratesError && <p role="alert" className="wrap-break-word text-[10px] text-rose-600">{ratesError}</p>}

          <div className="pt-2 border-t border-zinc-100 dark:border-[#282B29]">
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              aria-label="Select currency"
              className="w-full h-9 rounded-lg border border-zinc-300 dark:border-[#282B29] bg-zinc-50 dark:bg-[#141615] px-3 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value="GHS">GHS (Ghanaian Cedi)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
              <option value="NGN">NGN (Nigerian Naira)</option>
            </select>
          </div>
        </div>

        {/* Average Customer Value Control Box with 6th-grade explanation */}
        <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-zinc-200 dark:border-[#282B29] bg-white dark:bg-[#191B1A] p-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Average Customer Value</span>
              <span className="text-[10px] font-mono font-semibold text-[#EAB308]">{currency}</span>
            </div>
            {/* 6th grade explanation */}
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Think of this as the average money you make when a customer buys something or books with you.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-[#282B29]">
            {!isEditingIncome ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {currency} {Number(averageIncome).toLocaleString()}
                </span>
                <Button
                  type="button"
                  onClick={() => setIsEditingIncome(true)}
                  variant="neutral"
                  size="xs"
                  className="text-[10px]"
                >
                  <Edit3 className="w-3 h-3" /> Edit Value
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  aria-label="Average customer value"
                  value={averageIncome}
                  onChange={(e) => setAverageIncome(e.target.value)}
                  placeholder="0"
                  className="flex-1 h-8 rounded-lg border border-zinc-300 dark:border-[#282B29] bg-zinc-50 dark:bg-[#141615] px-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none font-mono"
                />
                <Button
                  type="button"
                  disabled={savingIncome}
                  onClick={handleSaveIncomeAndCurrency}
                  variant="primary"
                  size="sm"
                  className="min-h-8 px-3"
                >
                  <Check className="w-3 h-3" /> {savingIncome ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
            {incomeSavedSuccess && (
              <span role="status" className="block mt-1 text-[10px] font-semibold text-center text-emerald-600 dark:text-emerald-400">Saved successfully!</span>
            )}
          </div>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0 space-y-2 rounded-xl border border-zinc-200 dark:border-[#282B29] bg-white dark:bg-[#191B1A] p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total Leads</span>
            <Users className="w-4 h-4 text-[#EAB308]" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">{totalLeads.toLocaleString()}</h3>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> 100% captured in real-time
          </p>
        </div>

        <div className="min-w-0 space-y-2 rounded-xl border border-zinc-200 dark:border-[#282B29] bg-white dark:bg-[#191B1A] p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">Today</span>
            <Calendar className="w-4 h-4 text-[#EAB308]" />
          </div>
          <h3 className="wrap-break-word text-2xl font-bold tracking-tight font-mono text-zinc-900 dark:text-zinc-100">{formatMoney(earnedToday)}</h3>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
            From <span className="font-bold text-zinc-900 dark:text-zinc-100">{leadsToday}</span> call{leadsToday === 1 ? "" : "s"}
          </p>
        </div>

        <div className="min-w-0 space-y-2 rounded-xl border border-zinc-200 dark:border-[#282B29] bg-white dark:bg-[#191B1A] p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">This Week</span>
            <TrendingUp className="w-4 h-4 text-[#EAB308]" />
          </div>
          <h3 className="wrap-break-word text-2xl font-bold tracking-tight font-mono text-zinc-900 dark:text-zinc-100">{formatMoney(earnedWeek)}</h3>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
            From <span className="font-bold text-zinc-900 dark:text-zinc-100">{leadsThisWeek}</span> call{leadsThisWeek === 1 ? "" : "s"}
          </p>
        </div>

        <div className="min-w-0 space-y-2 rounded-xl border border-zinc-200 dark:border-[#282B29] bg-white dark:bg-[#191B1A] p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">This Month</span>
            <Sparkles className="w-4 h-4 text-[#EAB308]" />
          </div>
          <h3 className="wrap-break-word text-2xl font-bold tracking-tight font-mono text-zinc-900 dark:text-zinc-100">{formatMoney(earnedMonth)}</h3>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
            From <span className="font-bold text-zinc-900 dark:text-zinc-100">{leadsThisMonth}</span> call{leadsThisMonth === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Real-Data SVG Line Chart Card with Day / Week / Month Switcher */}
      <div className="p-4 bg-white dark:bg-[#191B1A] rounded-xl border border-zinc-200 dark:border-[#282B29] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-[#EAB308]" />
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Recovery Velocity Trend</h3>
          </div>

          {/* Day / Week / Month Switcher Tabs */}
          <div className="flex items-center bg-zinc-100 dark:bg-[#141615] p-1 rounded-lg border border-zinc-200 dark:border-[#282B29]">
            {(["day", "week", "month"] as const).map((view) => (
              <Button
                key={view}
                type="button"
                onClick={() => setChartView(view)}
                variant={chartView === view ? "primary" : "ghost"}
                size="xs"
                className={`capitalize ${
                  chartView === view
                    ? "shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {view}
              </Button>
            ))}
          </div>
        </div>

        {/* Real Data SVG Line Chart */}
        <div className="h-32 w-full bg-zinc-50 dark:bg-[#141615] rounded-lg border border-zinc-200 dark:border-[#282B29] p-3 flex flex-col justify-between">
          <div className="relative h-20 w-full">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
              <div className="border-b border-zinc-300 dark:border-zinc-700 w-full" />
              <div className="border-b border-zinc-300 dark:border-zinc-700 w-full" />
              <div className="border-b border-zinc-300 dark:border-zinc-700 w-full" />
            </div>

            {/* SVG Polyline representing real call counts */}
            <svg className="absolute inset-0 h-full w-full overflow-visible">
              <polyline
                fill="none"
                stroke="#EAB308"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={currentChartData
                  .map((d, i) => {
                    const x = (i / (currentChartData.length - 1 || 1)) * 100;
                    const y = 100 - (d.count / maxChartCount) * 80;
                    return `${x}%,${y}%`;
                  })
                  .join(" ")}
              />
            </svg>

            {/* Data points */}
            <div className="absolute inset-0 flex justify-between items-center pointer-events-none px-1">
              {currentChartData.map((d, i) => {
                const topPct = 100 - (d.count / maxChartCount) * 80;
                return (
                  <div key={i} className="flex flex-col items-center relative" style={{ transform: `translateY(${topPct - 50}%)` }}>
                    <div className="w-2 h-2 rounded-full bg-[#EAB308] border-2 border-white dark:border-[#191B1A] shadow-xs" title={`${d.count} calls`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800 px-1">
            {currentChartData.map((d, i) => (
              <span key={i} className="text-[9px] font-mono text-zinc-500 text-center flex-1 truncate">
                {d.label} ({d.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Hero Banner */}
      <div className="relative flex min-w-0 flex-col items-start justify-between gap-4 overflow-hidden rounded-xl bg-zinc-900 dark:bg-[#191B1A] p-5 text-white shadow-md sm:p-6 lg:flex-row lg:items-center border border-zinc-800 dark:border-[#282B29]">
        <div className="space-y-1.5 z-10 flex-1 min-w-0 pr-0 lg:pr-4">
          <div className="flex items-center gap-1.5 text-[#EAB308] text-[10px] font-bold tracking-wider uppercase font-mono">
            <ShieldCheck className="w-4 h-4 shrink-0" /> Total Lifetime Recovered Value
          </div>
          <h3 className="wrap-break-word text-3xl font-extrabold leading-tight tracking-tight tabular-nums text-white font-mono">{formatMoney(earnedTotal)}</h3>
          <p className="text-[11px] text-zinc-400 max-w-md leading-relaxed">
            Calculated across all <span className="font-bold text-white">{totalLeads}</span> missed leads captured and converted with y'elllo.
          </p>
        </div>

        <div className="px-4 py-3 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-center shrink-0 z-10 w-full lg:w-auto">
          <span className="text-[9px] text-zinc-400 block uppercase font-mono tracking-wider">Gateway Status</span>
          <span className="mt-0.5 block wrap-break-word text-xs font-bold text-[#EAB308]">Active Recovery</span>
        </div>
      </div>
    </div>
  );
}