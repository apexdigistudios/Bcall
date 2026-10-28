"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, DollarSign, Calendar, Sparkles, ShieldCheck, RefreshCw, Users, ArrowUpRight, Check, Edit3 } from "lucide-react";

export default function AnalyticsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [averageIncome, setAverageIncome] = useState<string>("200");
  const [currency, setCurrency] = useState<string>("GHS");
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1, GHS: 15.5, EUR: 0.92, GBP: 0.79, NGN: 1500 });
  const [refreshingRates, setRefreshingRates] = useState(false);
  const [ratesUpdatedMsg, setRatesUpdatedMsg] = useState(false);
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
    const { data: callsData } = await supabase
      .from("call_events")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (callsData) setCalls(callsData);

    const { data: bizData } = await supabase.from("businesses").select("*").limit(1).single();
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
    setLoading(false);
  }

  async function fetchLiveRates() {
    setRefreshingRates(true);
    setRatesUpdatedMsg(false);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data && data.rates) {
        setRates(data.rates);
        setRatesUpdatedMsg(true);
        setTimeout(() => setRatesUpdatedMsg(false), 3000);
      }
    } catch (err) {
      console.error("Failed to fetch live exchange rates:", err);
    }
    setRefreshingRates(false);
  }

  function handleCurrencyChange(newCurr: string) {
    const currentVal = parseFloat(averageIncome) || 0;
    const currentRates = rates[previousCurrency] ? rates : { [previousCurrency]: 1, [newCurr]: 1 };
    
    const rateFrom = currentRates[previousCurrency] || 1;
    const rateTo = currentRates[newCurr] || 1;
    
    const valueInUSD = currentVal / rateFrom;
    const convertedValue = valueInUSD * rateTo;

    setAverageIncome(convertedValue.toFixed(2));
    setCurrency(newCurr);
    setPreviousCurrency(newCurr);
  }

  async function handleSaveIncomeAndCurrency() {
    setSavingIncome(true);
    const numericIncome = parseFloat(averageIncome) || 0;

    if (business?.id) {
      await supabase.from("businesses").update({ 
        average_income: numericIncome,
        currency: currency 
      }).eq("id", business.id);
    }
    setSavingIncome(false);
    setIsEditingIncome(false);
    setIncomeSavedSuccess(true);
    setTimeout(() => setIncomeSavedSuccess(false), 3000);
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

  const numericBaseIncome = parseFloat(averageIncome) || 0;
  
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
    return <div className="p-8 text-center text-xs text-[#686b73]">Loading analytics dashboard...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-28 px-2 sm:px-0">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#111214]">Financial & Lead Analytics</h2>
          <p className="text-xs text-[#686b73] mt-0.5">
            Real-time performance metrics and recovered revenue tracking.
          </p>
        </div>

        {/* Compact Average Value & Currency Controller Card */}
        <div className="bg-white rounded-2xl border border-[#e7e7e9] p-3 shadow-sm flex flex-col gap-2 shrink-0 w-full sm:w-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-semibold text-[#686b73] uppercase">Avg Value / Currency</span>
            </div>
            <button
              onClick={fetchLiveRates}
              disabled={refreshingRates}
              title="Refresh Live Market Rates"
              className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${refreshingRates ? "animate-spin text-blue-700" : ""}`} /> 
              {refreshingRates ? "Updating..." : "Refresh Rates"}
            </button>
          </div>

          {ratesUpdatedMsg && (
            <span className="text-[10px] text-emerald-600 font-semibold text-center bg-emerald-50 py-0.5 rounded">
              Live market rates updated successfully!
            </span>
          )}

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#e7e7e9]">
            {!isEditingIncome ? (
              <div className="flex items-center justify-between w-full gap-4">
                <span className="text-xs font-bold font-mono text-[#111214]">
                  {currency} {Number(averageIncome).toLocaleString()}
                </span>
                <button
                  onClick={() => setIsEditingIncome(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#f7f7f5] border border-[#e7e7e9] text-[11px] font-semibold text-[#111214] hover:bg-[#ecece8] flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 w-full">
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="px-1.5 py-1 rounded-lg border border-[#e7e7e9] bg-[#f7f7f5] text-[11px] font-bold text-[#111214] focus:outline-none"
                >
                  <option value="GHS">GHS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="NGN">NGN</option>
                </select>
                <input
                  type="text"
                  value={averageIncome}
                  onChange={(e) => setAverageIncome(e.target.value)}
                  placeholder="200"
                  className="w-24 px-2 py-1 rounded-lg border border-[#e7e7e9] bg-[#f7f7f5] text-[11px] font-bold text-[#111214] focus:outline-none"
                />
                <button
                  disabled={savingIncome}
                  onClick={handleSaveIncomeAndCurrency}
                  className="px-3 py-1 rounded-lg bg-[#111214] text-white hover:bg-black text-[11px] font-semibold flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> {savingIncome ? "..." : "Save"}
                </button>
              </div>
            )}
          </div>
          {incomeSavedSuccess && (
            <span className="text-[10px] text-emerald-600 font-semibold text-center animate-pulse">Saved successfully!</span>
          )}
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-white rounded-2xl border border-[#e7e7e9] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#686b73]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Leads Captured</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-3xl font-bold text-[#111214] font-mono">{totalLeads.toLocaleString()}</h3>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> 100% missed call recovery
          </p>
        </div>

        {/* Today Revenue */}
        <div className="bg-white rounded-2xl border border-[#e7e7e9] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#686b73]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Today's Revenue</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-3xl font-bold text-[#111214] font-mono">{formatMoney(earnedToday)}</h3>
          <p className="text-[11px] text-[#686b73]">
            From <span className="font-semibold text-[#111214]">{leadsToday}</span> call{leadsToday === 1 ? "" : "s"} today
          </p>
        </div>

        {/* Weekly Revenue */}
        <div className="bg-white rounded-2xl border border-[#e7e7e9] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#686b73]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">This Week</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-3xl font-bold text-[#111214] font-mono">{formatMoney(earnedWeek)}</h3>
          <p className="text-[11px] text-[#686b73]">
            From <span className="font-semibold text-[#111214]">{leadsThisWeek}</span> call{leadsThisWeek === 1 ? "" : "s"} this week
          </p>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-2xl border border-[#e7e7e9] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#686b73]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">This Month</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-3xl font-bold text-[#111214] font-mono">{formatMoney(earnedMonth)}</h3>
          <p className="text-[11px] text-[#686b73]">
            From <span className="font-semibold text-[#111214]">{leadsThisMonth}</span> call{leadsThisMonth === 1 ? "" : "s"} this month
          </p>
        </div>
      </div>

      {/* Financial Hero Banner (Fixed Overlay & Spacing) */}
      <div className="bg-[#111214] text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-[#f5c62e]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 z-10 flex-1 min-w-0 pr-0 lg:pr-4">
          <div className="flex items-center gap-2 text-[#f5c62e] text-xs font-semibold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4 shrink-0" /> Total Lifetime Recovered Value
          </div>
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-mono tracking-tight wrap-break-word">{formatMoney(earnedTotal)}</h3>
          <p className="text-xs text-white/70 max-w-lg leading-relaxed">
            Calculated across all <span className="text-white font-semibold">{totalLeads}</span> missed leads saved with CALLBACKLY.
          </p>
        </div>

        <div className="px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center shrink-0 z-10 w-full lg:w-auto">
          <span className="text-[10px] text-white/60 block uppercase font-semibold tracking-wider">Conversion Health</span>
          <span className="text-base sm:text-lg font-bold text-[#f5c62e] block mt-0.5">Saved with CALLBACKLY</span>
        </div>
      </div>
    </div>
  );
}