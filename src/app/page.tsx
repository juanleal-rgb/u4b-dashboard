'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import {
  RefreshCw,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Radio,
  BarChart2,
  Eye,
  Lock,
  ChevronDown,
  Calendar,
  Zap,
} from 'lucide-react';
import { LeadsTable } from '@/components/LeadsTable';
import { AnalyzeDashboard } from '@/components/AnalyzeDashboard';
import type { Lead, CallRecord, DashboardStats } from '@/lib/api';
import { groupCallsIntoLeads, computeStats } from '@/lib/api';

// Toast notification type
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface CallsResponse {
  leads: Lead[];
  calls: CallRecord[];
  stats: DashboardStats;
  globalMinDate?: string | null;
  error?: string;
  missing?: string[];
}

type TabView = 'monitor' | 'analyze';
type CountryFilter = 'ES' | 'UK' | 'Both';


// Toast notification component
function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(onClose, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  const styles = {
    success: { bg: 'bg-uber-black', icon: CheckCircle },
    error: { bg: 'bg-red-600', icon: XCircle },
    info: { bg: 'bg-uber-black', icon: Radio },
  };

  const { bg, icon: ToastIcon } = styles[toast.type];

  return (
    <div className={`${bg} text-white rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-[300px] max-w-sm animate-fade-in`}>
      <ToastIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-white/80 mt-1">{toast.message}</p>
        )}
      </div>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map(toast => (
        <ToastNotification key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

// Login Screen Component
function LoginScreen({ onLogin }: { onLogin: (role: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('dashboard_auth', 'true');
        localStorage.setItem('dashboard_role', data.role ?? 'viewer');
        onLogin(data.role ?? 'viewer');
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-uber-black flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Image
            src="https://media.licdn.com/dms/image/v2/C4D0BAQG09E_9m95YQQ/company-logo_200_200/company-logo_200_200/0/1630492686215/uber_for_business_logo?e=2147483647&v=beta&t=BYn3QunRRwNP7dD0vE5Bw2kD7xKgEbPNeIN8V7GHRqA"
            alt="Uber for Business"
            width={120}
            height={40}
            className="h-10 w-auto"
            unoptimized
          />
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-uber-gray-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-uber-gray-500" />
          </div>
          <h1 className="text-xl font-bold text-uber-black">U4B Dashboard</h1>
          <p className="text-sm text-uber-gray-500 mt-1">Enter password to access the dashboard</p>
        </div>

        <div className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && password && handleSubmit()}
            placeholder="Password"
            autoComplete="off"
            className="w-full px-4 py-3 border border-uber-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-uber-green focus:border-transparent text-uber-black placeholder:text-uber-gray-400"
            autoFocus
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !password}
            className="w-full py-3 bg-uber-black text-white rounded-lg font-medium hover:bg-uber-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [data, setData] = useState<CallsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isFirstLoad = useRef(true);
  const configLoaded = useRef(false);

  // Tab navigation - default to Analyze
  const [activeTab, setActiveTab] = useState<TabView>('analyze');

  // Country filter
  const [countryFilter, setCountryFilter] = useState<CountryFilter>('Both');

  // Batch launch
  const [launchingBatch, setLaunchingBatch] = useState(false);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);

  const handleTabChange = useCallback((tab: TabView) => {
    setActiveTab(tab);
    setSelectedWeekIndex(tab === 'analyze' ? 0 : 1);
  }, []);

  // Global date filter
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const endOfYear = `${now.getFullYear()}-12-31`;
    return { start: today, end: endOfYear };
  });

  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);
  const [configStartDate, setConfigStartDate] = useState<string>('2026-01-01');
  const [globalMinDate, setGlobalMinDate] = useState<string | null>(null);

  const weeks = useMemo(() => {
    const weeksList: { label: string; start: string; end: string; isSpecial?: boolean }[] = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const getMonday = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      return d;
    };

    // All time: start from first real call date (or configStartDate fallback), end today
    const allTimeStart = globalMinDate ?? configStartDate;
    weeksList.push({
      label: 'All time',
      start: allTimeStart,
      end: today,
      isSpecial: true,
    });

    // This week
    const thisWeekMonday = getMonday(now);
    const thisWeekSunday = new Date(thisWeekMonday);
    thisWeekSunday.setDate(thisWeekSunday.getDate() + 6);
    weeksList.push({
      label: 'This week',
      start: thisWeekMonday.toISOString().split('T')[0],
      end: thisWeekSunday.toISOString().split('T')[0],
      isSpecial: true,
    });

    // Last week
    const lastWeekMonday = new Date(thisWeekMonday);
    lastWeekMonday.setDate(lastWeekMonday.getDate() - 7);
    const lastWeekSunday = new Date(lastWeekMonday);
    lastWeekSunday.setDate(lastWeekSunday.getDate() + 6);
    weeksList.push({
      label: 'Last week',
      start: lastWeekMonday.toISOString().split('T')[0],
      end: lastWeekSunday.toISOString().split('T')[0],
      isSpecial: true,
    });

    // Older weeks from first call date (or config start date)
    const dataStartMonday = getMonday(new Date(globalMinDate ?? configStartDate));
    const twoWeeksAgoMonday = new Date(thisWeekMonday);
    twoWeeksAgoMonday.setDate(twoWeeksAgoMonday.getDate() - 14);
    const current = new Date(twoWeeksAgoMonday);
    while (current >= dataStartMonday) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const day = weekStart.getDate();
      const month = weekStart.toLocaleDateString('en-US', { month: 'short' });
      weeksList.push({
        label: `Week ${day} ${month}`,
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0],
      });
      current.setDate(current.getDate() - 7);
    }

    return weeksList;
  }, [configStartDate, globalMinDate]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const launchBatch = useCallback(async (country: 'ES' | 'UK') => {
    setShowBatchDropdown(false);
    setLaunchingBatch(true);
    try {
      const res = await fetch('/api/launch-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ type: 'error', title: 'Launch failed', message: data.error ?? 'Unknown error' });
      } else {
        addToast({
          type: 'success',
          title: 'Batch launched',
          message: `${country === 'ES' ? '🇪🇸 Spain' : '🇬🇧 UK'} batch started successfully`,
        });
      }
    } catch {
      addToast({ type: 'error', title: 'Launch failed', message: 'Could not reach the server' });
    } finally {
      setLaunchingBatch(false);
    }
  }, [addToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const auth = localStorage.getItem('dashboard_auth');
    const role = localStorage.getItem('dashboard_role');
    setIsAuthenticated(auth === 'true');
    setIsAdmin(role === 'admin');
  }, []);

  const fetchData = useCallback(async () => {
    try {
      if (isFirstLoad.current) {
        setLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
      });
      const response = await fetch(`/api/calls?${params}`);
      const result = await response.json();

      if (result.error) {
        setError(result.error + (result.missing ? `: ${result.missing.join(', ')}` : ''));
        return;
      }

      setData(result);
      if (result.globalMinDate) setGlobalMinDate(result.globalMinDate);
      setLastUpdated(new Date());
      isFirstLoad.current = false;
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Load initial config
  useEffect(() => {
    if (configLoaded.current) return;
    configLoaded.current = true;

    fetch('/api/config')
      .then(res => res.json())
      .then(cfg => {
        if (cfg.runsStartDate) {
          setConfigStartDate(cfg.runsStartDate);
        }
      })
      .catch(err => console.error('Failed to load config:', err));
  }, []);

  // Update dateRange when week selection changes
  useEffect(() => {
    if (weeks.length > 0 && selectedWeekIndex < weeks.length) {
      const week = weeks[selectedWeekIndex];
      setDateRange({ start: week.start, end: week.end });
    }
  }, [weeks, selectedWeekIndex]);

  // Fetch data on mount and auto-refresh every 10 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Toast for any errors
  useEffect(() => {
    if (error) {
      addToast({ type: 'error', title: 'Error', message: error, duration: 8000 });
    }
  }, [error, addToast]);

  const allCalls = data?.calls ?? [];

  const filteredCalls = useMemo(() => {
    if (countryFilter === 'Both') return allCalls;
    return allCalls.filter(c => c.country === countryFilter);
  }, [allCalls, countryFilter]);

  const leads = useMemo(() => groupCallsIntoLeads(filteredCalls), [filteredCalls]);
  const calls = filteredCalls;
  const stats = useMemo(() => computeStats(filteredCalls), [filteredCalls]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-uber-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={(role) => { setIsAuthenticated(true); setIsAdmin(role === 'admin'); }} />;
  }

  return (
    <div className="min-h-screen bg-uber-gray-50">
      {/* Header */}
      <header className="bg-uber-black">
        <div className="px-6 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4">

          {/* LEFT: Logo + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src="https://media.licdn.com/dms/image/v2/C4D0BAQG09E_9m95YQQ/company-logo_200_200/company-logo_200_200/0/1630492686215/uber_for_business_logo?e=2147483647&v=beta&t=BYn3QunRRwNP7dD0vE5Bw2kD7xKgEbPNeIN8V7GHRqA"
              alt="Uber for Business"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover flex-none"
              unoptimized
            />
            <div className="h-6 w-px bg-white/20 flex-none" />
            <span className="text-white font-medium whitespace-nowrap">U4B Dashboard</span>
          </div>

          {/* CENTER: Country filter + Tabs */}
          <div className="flex items-center gap-2">
            {/* Country pills */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              {([
                { value: 'ES', full: '🇪🇸 Spain', short: '🇪🇸' },
                { value: 'UK', full: '🇬🇧 UK',    short: '🇬🇧' },
                { value: 'Both', full: '🌍 Both',  short: '🌍' },
              ] as { value: CountryFilter; full: string; short: string }[]).map(({ value, full, short }) => (
                <button
                  key={value}
                  onClick={() => setCountryFilter(value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    countryFilter === value ? 'bg-white text-uber-black' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span className="hidden lg:inline">{full}</span>
                  <span className="lg:hidden">{short}</span>
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-white/20" />

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => handleTabChange('analyze')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'analyze' ? 'bg-white text-uber-black' : 'text-white/70 hover:text-white'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span className="hidden sm:inline">Analyze</span>
              </button>
              <button
                onClick={() => handleTabChange('monitor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'monitor' ? 'bg-white text-uber-black' : 'text-white/70 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Monitor</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Week filter + Launch Batch + Live + Refresh */}
          <div className="flex items-center gap-2 justify-end">

            {/* Week select */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
              <select
                value={selectedWeekIndex}
                onChange={(e) => setSelectedWeekIndex(parseInt(e.target.value))}
                className="appearance-none bg-white/10 text-white text-sm pl-9 pr-8 py-1.5 rounded-lg border border-white/20 cursor-pointer hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-uber-green/50"
              >
                {weeks.map((week, index) => (
                  <option key={index} value={index} className="text-uber-black bg-white">
                    {week.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
            </div>

            {/* Date range label — hidden below xl */}
            <span className="text-white/60 text-xs whitespace-nowrap hidden xl:inline">
              {new Date(dateRange.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' – '}
              {new Date(dateRange.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>

            <div className="h-5 w-px bg-white/20" />

            {/* Launch Batch — admin only */}
            <div className="relative" title={!isAdmin ? 'Admin access required to launch batches' : undefined}>
              {countryFilter !== 'Both' ? (
                <button
                  onClick={() => launchBatch(countryFilter as 'ES' | 'UK')}
                  disabled={launchingBatch || !isAdmin}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-uber-green hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {launchingBatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span className="hidden md:inline">Launch Batch</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => isAdmin && setShowBatchDropdown(v => !v)}
                    disabled={launchingBatch || !isAdmin}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-uber-green hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    {launchingBatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    <span className="hidden md:inline">Launch Batch</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {showBatchDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowBatchDropdown(false)} />
                      <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-uber-gray-200 py-1 z-50 min-w-[140px]">
                        <button onClick={() => launchBatch('ES')} className="w-full text-left px-4 py-2 text-sm text-uber-black hover:bg-uber-gray-50 flex items-center gap-2 cursor-pointer">
                          🇪🇸 Spain
                        </button>
                        <button onClick={() => launchBatch('UK')} className="w-full text-left px-4 py-2 text-sm text-uber-black hover:bg-uber-gray-50 flex items-center gap-2 cursor-pointer">
                          🇬🇧 UK
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="h-5 w-px bg-white/20" />

            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-uber-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-uber-green" />
              </span>
              <span className="text-xs text-white/70">LIVE</span>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Error state */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-800">{error}</p>
              <button
                onClick={fetchData}
                className="text-sm text-red-600 hover:text-red-700 underline mt-1"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'monitor' ? (
          <LeadsTable leads={leads} loading={loading} showCountry={countryFilter === 'Both'} />
        ) : (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-uber-black">Analytics Overview</h2>
            <AnalyzeDashboard calls={calls} leads={leads} stats={stats} loading={loading} />
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
