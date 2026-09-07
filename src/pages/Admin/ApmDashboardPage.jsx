import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Filter,
  Search,
  Calendar,
  Layers,
  Shield,
  Zap,
  Terminal,
  ChevronRight,
  ExternalLink,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getApmOverview,
  getExecutionLogs,
  getCronMonitoring,
  triggerEdgeFunction
} from '../../services/adminService';
import LogDetailModal from '../../components/admin/LogDetailModal';
import ManageAdminsModal from '../../components/admin/ManageAdminsModal';

// Helper to translate cron expression to human readable format
function formatCronSchedule(schedule) {
  if (!schedule) return 'Custom schedule';
  const s = schedule.trim();
  if (s === '0 * * * *') return 'Hourly at :00';
  if (s === '*/15 * * * *') return 'Every 15 minutes';
  if (s === '*/30 * * * *') return 'Every 30 minutes';
  if (s === '0 2 * * *') return 'Daily at 02:00 UTC (07:30 IST)';
  if (s === '0 0 * * *') return 'Daily at midnight';
  if (s === '0 10 * * 1-5') return 'Weekdays at 10:00 UTC';
  if (s === '30 3 * * *') return 'Daily at 03:30 UTC (09:00 IST)';
  return s;
}

function formatIST(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export default function ApmDashboardPage() {
  const navigate = useNavigate();
  const { user, isAdmin, adminRole, loading: authLoading } = useAuth();

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState('functions'); // 'functions' | 'crons' | 'admins'
  const [showManageAdmins, setShowManageAdmins] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Data states
  const [overview, setOverview] = useState(null);
  const [logsData, setLogsData] = useState({ total: 0, logs: [] });
  const [cronData, setCronData] = useState({ jobs: [], runs: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30); // seconds (0 = off)

  // Filters for execution logs
  const [filterFunction, setFilterFunction] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // '' | 'SUCCESS' | 'FAILED'
  const [filterCaller, setFilterCaller] = useState(''); // '' | 'CRON' | 'USER' | 'SYSTEM'
  const [searchQuery, setSearchQuery] = useState('');
  const [cronFailureOnly, setCronFailureOnly] = useState(false);

  // Trigger function test state
  const [triggeringFn, setTriggeringFn] = useState(null);
  const [triggerToast, setTriggerToast] = useState(null);

  // Fetch all APM data
  const loadData = useCallback(async (isSilent = false) => {
    if (!isAdmin) return;
    try {
      if (!isSilent) setRefreshing(true);
      const [ov, logs, crons] = await Promise.all([
        getApmOverview().catch((err) => { console.warn('Overview err:', err); return null; }),
        getExecutionLogs({
          functionName: filterFunction || null,
          status: filterStatus || null,
          callerType: filterCaller || null,
          limit: 60,
          offset: 0,
        }).catch((err) => { console.warn('Logs err:', err); return { total: 0, logs: [] }; }),
        getCronMonitoring(50).catch((err) => { console.warn('Crons err:', err); return { jobs: [], runs: [] }; }),
      ]);

      if (ov) setOverview(ov);
      if (logs) setLogsData(logs);
      if (crons) setCronData(crons);
    } catch (err) {
      console.error('APM data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, filterFunction, filterStatus, filterCaller]);

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAdmin, authLoading, loadData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0 || !isAdmin) return;
    const interval = setInterval(() => {
      loadData(true);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, isAdmin, loadData]);

  // Handle manual test trigger
  const handleTriggerFunction = async (fnName) => {
    try {
      setTriggeringFn(fnName);
      setTriggerToast({ type: 'info', message: `Triggering ${fnName}...` });
      const res = await triggerEdgeFunction(fnName);
      setTriggerToast({
        type: 'success',
        message: `Successfully executed ${fnName}! Status: ${res?.status || 200}`,
      });
      // Refresh logs after 1.5s
      setTimeout(() => loadData(true), 1500);
      setTimeout(() => setTriggerToast(null), 4000);
    } catch (err) {
      setTriggerToast({
        type: 'error',
        message: `Execution failed for ${fnName}: ${err.message || 'Unknown error'}`,
      });
      setTimeout(() => setTriggerToast(null), 5000);
    } finally {
      setTriggeringFn(null);
    }
  };

  // Filtered logs by search query
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logsData.logs;
    const q = searchQuery.toLowerCase();
    return logsData.logs.filter((l) =>
      (l.function_name && l.function_name.toLowerCase().includes(q)) ||
      (l.user_email && l.user_email.toLowerCase().includes(q)) ||
      (l.error_message && l.error_message.toLowerCase().includes(q))
    );
  }, [logsData.logs, searchQuery]);

  // Filtered cron runs
  const filteredCronRuns = useMemo(() => {
    if (!cronFailureOnly) return cronData.runs;
    return cronData.runs.filter((r) => r.status !== 'succeeded');
  }, [cronData.runs, cronFailureOnly]);

  // Guard against non-admin
  if (!authLoading && !isAdmin) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center bg-[var(--bg)] text-[var(--text)]">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4">
          <Shield size={32} />
        </div>
        <h2 className="text-xl font-bold">Admin Privileges Required</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)] max-w-sm">
          The Application Performance Monitoring console is restricted to platform administrators.
        </p>
        <button
          onClick={() => navigate('/settings')}
          className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Settings</span>
        </button>
      </div>
    );
  }

  const hasIssues = (overview?.failed_runs_24h || 0) > 0 || (overview?.cron_failures_24h || 0) > 0;

  return (
    <div className="min-h-0 flex-1 flex flex-col overflow-y-auto bg-[var(--bg)] text-[var(--text)]">
      {/* ── Top Header Bar (Safe-Area Aware for iPhone Notch / Dynamic Island) ── */}
      <header
        className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 sm:gap-4 px-3 sm:px-6 pb-3.5 sm:pb-4 border-b border-[var(--card-border)] backdrop-blur-xl"
        style={{
          background: 'var(--header-bg)',
          paddingTop: 'max(1rem, calc(env(safe-area-inset-top, 0px) + 0.75rem))',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--input-bg)] border border-[var(--card-border)] transition-colors cursor-pointer"
            title="Return to Settings"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <h1
                className="font-bold tracking-tight text-[var(--text)] whitespace-nowrap"
                style={{ fontSize: 'clamp(0.925rem, 3.2vw, 1.125rem)' }}
              >
                System Monitor &amp; APM
              </h1>
              <span
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold border whitespace-nowrap shrink-0 ${
                  hasIssues
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
                    hasIssues ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                  }`}
                />
                <span>{hasIssues ? 'Failures Detected' : 'All Systems Operational'}</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Live Edge Function telemetry &amp; pg_cron automation health
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Auto Refresh selector */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] px-3 py-1.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]">
            <Clock size={13} />
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-[var(--text)] outline-none cursor-pointer"
            >
              <option value={0}>Auto: Off</option>
              <option value={15}>Auto: 15s</option>
              <option value={30}>Auto: 30s</option>
              <option value={60}>Auto: 60s</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--text)] hover:bg-[var(--input-bg)] border border-[var(--card-border)] transition-all cursor-pointer disabled:opacity-50"
            title="Refresh logs immediately"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-emerald-400' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Manage Admins button */}
          <button
            onClick={() => setShowManageAdmins(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer"
          >
            <Users size={14} />
            <span>Admins</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div
        className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full"
        style={{
          paddingBottom: 'calc(6.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Toast Feedback */}
        {triggerToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-lg ${
              triggerToast.type === 'error'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                : triggerToast.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
            }`}
          >
            <span>{triggerToast.message}</span>
            <button onClick={() => setTriggerToast(null)} className="p-1 hover:opacity-80">
              &times;
            </button>
          </motion.div>
        )}

        {/* ── Executive KPI Metric Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3.5">
          {/* Card 1: Health Pulse */}
          <div
            className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl flex flex-col justify-between"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Health Status
              </span>
              <Activity
                size={16}
                className={hasIssues ? 'text-rose-400' : 'text-emerald-400'}
              />
            </div>
            <div className="mt-2">
              <span
                className={`text-base font-extrabold ${
                  hasIssues ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {hasIssues ? 'ATTENTION' : 'HEALTHY'}
              </span>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] mt-0.5">
                {overview?.cron_failures_24h || 0} cron errors (24h)
              </p>
            </div>
          </div>

          {/* Card 2: 24h Invocations */}
          <div
            className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl flex flex-col justify-between"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Invocations (24h)
              </span>
              <Zap size={16} className="text-amber-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)]">
                {overview?.total_runs_24h ?? 0}
              </span>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] mt-0.5">
                {overview?.success_runs_24h ?? 0} succeeded
              </p>
            </div>
          </div>

          {/* Card 3: Error Rate */}
          <div
            className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl flex flex-col justify-between"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Error Rate
              </span>
              <AlertTriangle
                size={16}
                className={
                  (overview?.error_rate_pct || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
                }
              />
            </div>
            <div className="mt-2">
              <span
                className={`text-xl sm:text-2xl font-black tracking-tight ${
                  (overview?.error_rate_pct || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {overview?.error_rate_pct ?? '0.00'}%
              </span>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] mt-0.5">
                {overview?.failed_runs_24h ?? 0} failed calls
              </p>
            </div>
          </div>

          {/* Card 4: Avg Execution Latency */}
          <div
            className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl flex flex-col justify-between"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Avg Latency
              </span>
              <Clock size={16} className="text-sky-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)]">
                {overview?.avg_duration_ms ?? 0} ms
              </span>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] mt-0.5">
                Max: {overview?.max_duration_ms ?? 0} ms
              </p>
            </div>
          </div>

          {/* Card 5: pg_cron Active */}
          <div
            className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl flex flex-col justify-between col-span-2 md:col-span-1"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Active Crons
              </span>
              <Layers size={16} className="text-indigo-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)]">
                {overview?.active_crons_count ?? 10}/10
              </span>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] mt-0.5">
                Scheduled in pg_cron
              </p>
            </div>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('functions')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'functions'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--card-bg)]'
            }`}
          >
            <Terminal size={14} />
            <span>Edge Functions ({overview?.function_breakdown?.length || 12})</span>
          </button>

          <button
            onClick={() => setActiveTab('crons')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'crons'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--card-bg)]'
            }`}
          >
            <Layers size={14} />
            <span>pg_cron Scheduled Jobs ({cronData.jobs?.length || 10})</span>
          </button>
        </div>

        {/* ── TAB 1: Edge Functions Performance & Live Log Stream ── */}
        {activeTab === 'functions' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Function Breakdown Matrix */}
            <div
              className="rounded-2xl sm:rounded-3xl p-3 sm:p-5 overflow-hidden"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)]">
                    Edge Functions Summary (24h)
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Performance latency and invocation health across all deployed functions
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      className="border-b text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]"
                      style={{ borderColor: 'var(--card-border)' }}
                    >
                      <th className="pb-3 pr-4">Function Name</th>
                      <th className="pb-3 px-3 text-center">Total Runs</th>
                      <th className="pb-3 px-3 text-center">Success</th>
                      <th className="pb-3 px-3 text-center">Failures</th>
                      <th className="pb-3 px-3 text-right">Avg Latency</th>
                      <th className="pb-3 px-3 text-right">Last Execution</th>
                      <th className="pb-3 pl-3 text-right">Quick Test</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--card-border)]">
                    {(overview?.function_breakdown || []).map((fn) => {
                      const isTriggering = triggeringFn === fn.function_name;
                      const hasFailures = fn.failed_runs > 0;

                      return (
                        <tr key={fn.function_name} className="hover:bg-[var(--input-bg)]/40 transition-colors">
                          <td className="py-3 pr-4 font-mono font-bold text-[var(--text)]">
                            {fn.function_name}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold">
                            {fn.total_runs}
                          </td>
                          <td className="py-3 px-3 text-center text-emerald-400 font-semibold">
                            {fn.success_runs}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold">
                            {hasFailures ? (
                              <span className="text-rose-400 font-bold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25">
                                {fn.failed_runs}
                              </span>
                            ) : (
                              <span className="text-[var(--text-muted)]">0</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {fn.avg_duration_ms} ms
                          </td>
                          <td className="py-3 px-3 text-right text-[var(--text-muted)] font-mono text-[11px]">
                            {formatIST(fn.last_run_at)}
                          </td>
                          <td className="py-3 pl-3 text-right">
                            <button
                              type="button"
                              disabled={isTriggering}
                              onClick={() => handleTriggerFunction(fn.function_name)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-slate-700/60 hover:bg-emerald-600 disabled:opacity-40 transition-all cursor-pointer"
                              title={`Trigger ${fn.function_name} now`}
                            >
                              <Play size={10} className={isTriggering ? 'animate-spin' : ''} />
                              <span>{isTriggering ? 'Running' : 'Test'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Execution Logs Filter Bar & Table */}
            <div
              className="rounded-2xl sm:rounded-3xl p-3 sm:p-5 overflow-hidden space-y-3.5 sm:space-y-4"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)]">
                    Execution Logs Stream ({logsData.total} records)
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Click any execution row to inspect complete JSON payloads and error traces
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Search box */}
                  <div className="relative flex-1 sm:flex-initial min-w-[150px]">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                      type="text"
                      placeholder="Search function, user, error..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-auto pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500/50"
                      style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--card-border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>

                  {/* Status filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex-1 sm:flex-initial px-2.5 py-1.5 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--card-border)',
                      color: 'var(--text)',
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="FAILED">Failures Only</option>
                    <option value="SUCCESS">Success Only</option>
                  </select>

                  {/* Caller Type filter */}
                  <select
                    value={filterCaller}
                    onChange={(e) => setFilterCaller(e.target.value)}
                    className="flex-1 sm:flex-initial px-2.5 py-1.5 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--card-border)',
                      color: 'var(--text)',
                    }}
                  >
                    <option value="">All Callers</option>
                    <option value="CRON">CRON Only</option>
                    <option value="USER">USER Only</option>
                    <option value="SYSTEM">SYSTEM Only</option>
                  </select>
                </div>
              </div>

              {/* Log Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      className="border-b text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]"
                      style={{ borderColor: 'var(--card-border)' }}
                    >
                      <th className="pb-3 pr-3">Timestamp (IST)</th>
                      <th className="pb-3 px-3">Function</th>
                      <th className="pb-3 px-3">Caller</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3">HTTP</th>
                      <th className="pb-3 px-3 text-right">Latency</th>
                      <th className="pb-3 pl-3">Diagnostics / User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--card-border)]">
                    {filteredLogs.map((log) => {
                      const isFailed = log.status === 'FAILED' || log.response_status >= 400;

                      return (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          className="hover:bg-[var(--input-bg)]/60 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 pr-3 font-mono text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                            {formatIST(log.created_at)}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[var(--text)] group-hover:text-emerald-400 transition-colors">
                            {log.function_name}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase border ${
                                log.caller_type === 'CRON'
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/25'
                                  : log.caller_type === 'USER'
                                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/25'
                                  : 'bg-slate-500/10 text-slate-400 border-slate-500/25'
                              }`}
                            >
                              {log.caller_type}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase border ${
                                isFailed
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold">
                            <span className={isFailed ? 'text-rose-400 font-bold' : 'text-[var(--text-muted)]'}>
                              {log.response_status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                            {log.duration_ms} ms
                          </td>
                          <td className="py-3 pl-3 truncate max-w-[200px] text-[11px] text-[var(--text-muted)]">
                            {log.error_message ? (
                              <span className="text-rose-400 font-semibold">{log.error_message}</span>
                            ) : log.user_email ? (
                              log.user_email
                            ) : (
                              'Automated Cron'
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-[var(--text-muted)]">
                          No execution logs match the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: pg_cron Schedules & Execution History ── */}
        {activeTab === 'crons' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Scheduled Cron Jobs */}
            <div
              className="rounded-2xl sm:rounded-3xl p-3 sm:p-5 overflow-hidden"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div className="mb-4">
                <h3 className="text-sm font-bold text-[var(--text)]">
                  Scheduled pg_cron Jobs ({cronData.jobs?.length || 10})
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Active cron schedules and automated background dispatchers in PostgreSQL
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(cronData.jobs || []).map((job) => (
                  <div
                    key={job.jobid}
                    className="p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between space-y-2.5 sm:space-y-3"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--card-border)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[var(--text)]">
                            {job.jobname}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--card-border)] text-[var(--text-2)] font-mono">
                            #{job.jobid}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-400 font-medium mt-1">
                          {formatCronSchedule(job.schedule)}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide border ${
                          job.active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                        }`}
                      >
                        {job.active ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>

                    <div
                      className="p-2.5 rounded-xl font-mono text-[11px] font-medium truncate select-all"
                      style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--card-border)',
                        color: 'var(--text)',
                      }}
                      title={job.command}
                    >
                      {job.command}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cron Run History Table */}
            <div
              className="rounded-2xl sm:rounded-3xl p-3 sm:p-5 overflow-hidden space-y-3.5 sm:space-y-4"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)]">
                    Recent pg_cron Execution Runs ({filteredCronRuns.length})
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Execution status, timestamps, and return codes from pg_cron
                  </p>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cronFailureOnly}
                    onChange={(e) => setCronFailureOnly(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Failures Only</span>
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      className="border-b text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]"
                      style={{ borderColor: 'var(--card-border)' }}
                    >
                      <th className="pb-3 pr-4">Job Name</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3">Start Time (IST)</th>
                      <th className="pb-3 px-3 text-right">Duration</th>
                      <th className="pb-3 pl-3">Return Message / Diagnostic</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--card-border)]">
                    {filteredCronRuns.map((run) => {
                      const isSucceeded = run.status === 'succeeded';

                      return (
                        <tr key={run.runid} className="hover:bg-[var(--input-bg)]/40 transition-colors">
                          <td className="py-3 pr-4 font-mono font-bold text-[var(--text)]">
                            {run.jobname}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase border ${
                                isSucceeded
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                              }`}
                            >
                              {run.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                            {formatIST(run.start_time)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {run.duration_ms ?? 0} ms
                          </td>
                          <td className="py-3 pl-3 text-[11px] font-mono text-[var(--text)] truncate max-w-xs">
                            {run.return_message || '—'}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredCronRuns.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-[var(--text-muted)]">
                          No cron executions match the filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <LogDetailModal
        log={selectedLog}
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
      />

      <ManageAdminsModal
        isOpen={showManageAdmins}
        onClose={() => setShowManageAdmins(false)}
      />
    </div>
  );
}
