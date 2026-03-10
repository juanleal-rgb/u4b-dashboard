'use client';

import { useMemo } from 'react';
import {
  Phone,
  Users,
  CheckCircle2,
  Calendar,
  Timer,
  XCircle,
  PhoneMissed,
  Voicemail,
  PhoneOff,
  Info,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import type { Lead, CallRecord, DashboardStats, CallStatus } from '@/lib/api';
import { STATUS_META, ALL_STATUSES } from '@/lib/api';

interface AnalyzeDashboardProps {
  calls: CallRecord[];
  leads: Lead[];
  stats?: DashboardStats;
  loading?: boolean;
}

// Format duration in seconds to human-readable
function formatDuration(seconds: number): string {
  if (seconds === 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
}

// KPI Card component
function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'green',
  tooltip,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Phone;
  color?: 'green' | 'blue' | 'amber' | 'purple' | 'red' | 'gray';
  tooltip?: string;
}) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-uber-gray-100 text-uber-gray-500',
  };

  return (
    <div className="bg-white rounded-xl border border-uber-gray-100 p-5 relative group">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-uber-gray-500 uppercase tracking-wide">{title}</p>
            {tooltip && (
              <div className="relative">
                <Info className="w-3 h-3 text-uber-gray-300 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-uber-black text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {tooltip}
                </div>
              </div>
            )}
          </div>
          <p className="text-3xl font-bold mt-2 text-uber-black">{value}</p>
          {subtitle && (
            <p className="text-xs text-uber-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// Status breakdown horizontal bar chart — one count per partner (lead), based on latest status
function StatusChart({ leads }: { leads: Lead[] }) {
  const counts = useMemo(() => {
    const result: Record<CallStatus, number> = {} as Record<CallStatus, number>;
    for (const s of ALL_STATUSES) result[s] = 0;
    for (const lead of leads) {
      if (result[lead.latestStatus] !== undefined) {
        result[lead.latestStatus]++;
      }
    }
    return result;
  }, [leads]);

  const total = leads.length;
  const maxCount = Math.max(...Object.values(counts), 1);

  // Group into positive / follow-up / negative
  const positiveStatuses: CallStatus[] = ['Meeting scheduled'];
  const followUpStatuses: CallStatus[] = ['Callback requested', 'Send information'];
  const negativeStatuses: CallStatus[] = ['No interest', 'Not a fit', 'Wrong contact', 'Voicemail', 'Hang up'];

  const totalPositive = positiveStatuses.reduce((s, k) => s + counts[k], 0);
  const totalFollowUp = followUpStatuses.reduce((s, k) => s + counts[k], 0);
  const totalNegative = negativeStatuses.reduce((s, k) => s + counts[k], 0);

  const statusIcons: Partial<Record<CallStatus, typeof Phone>> = {
    'Meeting scheduled': Calendar,
    'Callback requested': Phone,
    'Send information': Info,
    'No interest': XCircle,
    'Not a fit': XCircle,
    'Wrong contact': PhoneOff,
    'Voicemail': Voicemail,
    'Hang up': PhoneMissed,
  };

  function renderGroup(statuses: CallStatus[], sectionLabel: string, sectionColor: string) {
    return (
      <div>
        <p className={`text-[10px] font-semibold uppercase tracking-wide mb-2 flex items-center gap-1 ${sectionColor}`}>
          <TrendingUp className="w-3 h-3" />
          {sectionLabel}
        </p>
        <div className="space-y-2">
          {statuses.map(status => {
            const count = counts[status];
            const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            const barWidth = (count / maxCount) * 100;
            const meta = STATUS_META[status];
            const Icon = statusIcons[status] ?? Phone;

            return (
              <div key={status} className="flex items-center gap-3 group relative">
                <Icon className={`w-4 h-4 flex-shrink-0 ${count > 0 ? 'text-uber-gray-400' : 'text-uber-gray-200'}`} />
                <span className={`text-xs w-32 truncate ${count > 0 ? 'text-uber-gray-600' : 'text-uber-gray-300'}`}>
                  {meta.label}
                </span>
                <div className="flex-1 h-5 bg-uber-gray-100 rounded-full overflow-hidden relative">
                  {count > 0 && (
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(barWidth, 4)}%`, backgroundColor: meta.color }}
                    />
                  )}
                  {count > 0 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-uber-gray-600">
                      {count}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium w-12 text-right ${count > 0 ? 'text-uber-gray-600' : 'text-uber-gray-300'}`}>
                  {count > 0 ? `${percent}%` : '0'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-uber-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-uber-black">Partner Status Breakdown</h3>
        {total > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-600 font-medium">{totalPositive} meetings</span>
            <span className="text-uber-gray-300">|</span>
            <span className="text-blue-600 font-medium">{totalFollowUp} follow-up</span>
            <span className="text-uber-gray-300">|</span>
            <span className="text-red-500 font-medium">{totalNegative} negative</span>
          </div>
        )}
      </div>

      {total === 0 ? (
        <p className="text-sm text-uber-gray-400 text-center py-8">No partners in selected period</p>
      ) : (
        <div className="space-y-4">
          {renderGroup(positiveStatuses, 'Meetings Scheduled', 'text-green-600')}
          <div className="pt-3 border-t border-uber-gray-100">
            {renderGroup(followUpStatuses, 'Follow-up Needed', 'text-blue-600')}
          </div>
          <div className="pt-3 border-t border-uber-gray-100">
            {renderGroup(negativeStatuses, 'Negative / No Contact', 'text-red-500')}
          </div>
        </div>
      )}
    </div>
  );
}

// Qualified vs Not Qualified pie chart
function QualifiedChart({ leads }: { leads: Lead[] }) {
  const qualified = leads.filter(l => l.isQualified).length;
  const notQualified = leads.length - qualified;

  const data = [
    { name: 'Qualified', value: qualified, color: '#00B14F' },
    { name: 'Not qualified', value: notQualified, color: '#E0E0E0' },
  ].filter(d => d.value > 0);

  const total = leads.length;

  return (
    <div className="bg-white rounded-xl border border-uber-gray-100 p-5">
      <h3 className="text-sm font-semibold text-uber-black mb-4">Lead Qualification</h3>

      {total === 0 ? (
        <p className="text-sm text-uber-gray-400 text-center py-8">No leads in selected period</p>
      ) : (
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 flex-shrink-0">
            <PieChart width={128} height={128}>
              <Pie
                data={data}
                cx={60}
                cy={60}
                innerRadius={36}
                outerRadius={56}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} leads`, '']}
              />
            </PieChart>
          </div>
          <div className="flex-1 space-y-2">
            {data.map(entry => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-uber-gray-600">{entry.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-uber-black">{entry.value}</span>
                  <span className="text-xs text-uber-gray-400 ml-1">
                    ({total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-uber-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-uber-gray-400">Total leads</span>
                <span className="font-bold text-uber-black">{total}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Calls per day trend chart
function CallsTrendChart({ calls }: { calls: CallRecord[] }) {
  const chartData = useMemo(() => {
    if (calls.length === 0) return [];

    const dayMap = new Map<string, { date: string; total: number; qualified: number; meetings: number }>();

    for (const call of calls) {
      const day = call.createdAt.split('T')[0];
      const existing = dayMap.get(day) ?? {
        date: day,
        total: 0,
        qualified: 0,
        meetings: 0,
      };
      existing.total++;
      if (call.qualified) existing.qualified++;
      if (call.status === 'Meeting scheduled') existing.meetings++;
      dayMap.set(day, existing);
    }

    return [...dayMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        ...v,
        date: new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }));
  }, [calls]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-uber-gray-100 p-5">
        <h3 className="text-sm font-semibold text-uber-black mb-4">Calls Over Time</h3>
        <p className="text-sm text-uber-gray-400 text-center py-8">No calls in selected period</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-uber-gray-100 p-5">
      <h3 className="text-sm font-semibold text-uber-black mb-4">Calls Over Time</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#8F8F8F' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#8F8F8F' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #EEEEEE',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line
            type="monotone"
            dataKey="total"
            name="Total calls"
            stroke="#000000"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="qualified"
            name="Qualified"
            stroke="#00B14F"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="meetings"
            name="Meetings"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Status distribution bar chart for leads
function LeadStatusBarChart({ leads }: { leads: Lead[] }) {
  const data = useMemo(() => {
    const counts: Partial<Record<CallStatus, number>> = {};
    for (const lead of leads) {
      counts[lead.latestStatus] = (counts[lead.latestStatus] ?? 0) + 1;
    }
    return ALL_STATUSES
      .map(s => ({
        name: s.replace(' ', '\n'),
        fullName: s,
        count: counts[s] ?? 0,
        color: STATUS_META[s].color,
      }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-uber-gray-100 p-5">
        <h3 className="text-sm font-semibold text-uber-black mb-4">Lead Distribution by Last Status</h3>
        <p className="text-sm text-uber-gray-400 text-center py-8">No leads in selected period</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-uber-gray-100 p-5">
      <h3 className="text-sm font-semibold text-uber-black mb-4">Lead Distribution by Last Status</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
          <XAxis
            dataKey="fullName"
            tick={{ fontSize: 10, fill: '#8F8F8F' }}
            axisLine={false}
            tickLine={false}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#8F8F8F' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #EEEEEE',
              fontSize: '12px',
            }}
            formatter={(value) => [value, 'Leads']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AnalyzeDashboard({ calls, leads, stats, loading }: AnalyzeDashboardProps) {
  if (loading && calls.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalCalls = stats?.totalCalls ?? calls.length;
  const totalLeads = stats?.totalLeads ?? leads.length;
  const qualifiedLeads = stats?.qualifiedLeads ?? leads.filter(l => l.isQualified).length;
  const qualifiedRate = stats?.qualifiedRate ?? (totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0);
  const meetingsScheduled = stats?.meetingsScheduled ?? leads.filter(l => l.hasMeeting).length;
  const meetingRate = stats?.meetingRate ?? (totalLeads > 0 ? (meetingsScheduled / totalLeads) * 100 : 0);
  const avgDuration = stats?.avgDuration ?? 0;

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Calls"
          value={totalCalls}
          subtitle="All webhook calls received"
          icon={Phone}
          color="gray"
        />
        <KPICard
          title="Unique Leads"
          value={totalLeads}
          subtitle="Distinct phone numbers"
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Qualified Leads"
          value={`${qualifiedLeads}`}
          subtitle={`${qualifiedRate.toFixed(1)}% of leads`}
          icon={CheckCircle2}
          color="green"
          tooltip="Leads where at least one call was marked qualified=true"
        />
        <KPICard
          title="Meetings Scheduled"
          value={`${meetingsScheduled}`}
          subtitle={`${meetingRate.toFixed(1)}% meeting rate`}
          icon={Calendar}
          color="amber"
          tooltip="Leads with at least one call with status 'Meeting scheduled'"
        />
        <KPICard
          title="Avg Call Duration"
          value={formatDuration(Math.round(avgDuration))}
          subtitle="Excluding voicemail & hang ups"
          icon={Timer}
          color="purple"
          tooltip="Average duration of contacted calls (excludes Voicemail and Hang up)"
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <StatusChart leads={leads} />
        <QualifiedChart leads={leads} />
        <CallsTrendChart calls={calls} />
        <LeadStatusBarChart leads={leads} />
      </div>
    </div>
  );
}
