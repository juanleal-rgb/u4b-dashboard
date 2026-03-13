'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Building2,
  User,
  Phone,
  ChevronDown,
  ChevronRight,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  MessageSquare,
  Timer,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Lead, CallRecord, CallStatus } from '@/lib/api';
import { STATUS_META, ALL_STATUSES } from '@/lib/api';

// Format duration in seconds to human-readable
function formatDuration(seconds: number): string {
  if (seconds === 0) return '-';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${minutes}m ${remaining}s`;
}

// Format a date string
function formatDate(iso: string): string {
  return format(new Date(iso), 'MMM d, yyyy HH:mm');
}

// Status badge component
function StatusBadge({ status }: { status: CallStatus }) {
  const meta = STATUS_META[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}>
      {meta.label}
    </span>
  );
}

// Qualified badge
function QualifiedBadge({ qualified }: { qualified: boolean }) {
  if (qualified) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle2 className="w-3 h-3" />
        Qualified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      <XCircle className="w-3 h-3" />
      Not qualified
    </span>
  );
}

// Expandable call history row
function CallHistoryRow({ call }: { call: CallRecord }) {
  return (
    <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-4 items-start py-3 px-4 border-b border-uber-gray-100 last:border-0 bg-uber-gray-50 text-sm">
      {/* Attempt */}
      <div className="flex items-center justify-center w-6 h-6 bg-uber-gray-200 rounded-full text-xs font-semibold text-uber-gray-600">
        {call.attempt}
      </div>

      {/* Status */}
      <div>
        <StatusBadge status={call.status} />
      </div>

      {/* Qualified */}
      <div>
        <QualifiedBadge qualified={call.qualified} />
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1 text-uber-gray-500">
        <Timer className="w-3.5 h-3.5" />
        <span>{formatDuration(call.duration)}</span>
      </div>

      {/* Meeting */}
      <div className="flex items-center gap-1 text-uber-gray-500">
        {call.meeting ? (
          <>
            <Calendar className="w-3.5 h-3.5 text-uber-green" />
            <span className="text-uber-green font-medium">
              {format(new Date(call.meeting), 'MMM d, HH:mm')}
            </span>
          </>
        ) : (
          <span className="text-uber-gray-300">—</span>
        )}
      </div>

      {/* Date */}
      <div className="text-uber-gray-400 text-xs">
        {formatDate(call.createdAt)}
      </div>

      {/* Summary + call link - full width below */}
      {(call.summary || call.callUrl) && (
        <div className="col-span-6 mt-2 flex flex-col gap-1.5">
          {call.summary && (
            <div className="flex items-start gap-2 bg-white rounded-lg px-3 py-2 border border-uber-gray-200">
              <MessageSquare className="w-3.5 h-3.5 text-uber-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-uber-gray-600 leading-relaxed">{call.summary}</p>
            </div>
          )}
          {call.callUrl && (
            <a
              href={call.callUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View call
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function CountryFlag({ country }: { country: string }) {
  const flag = country === 'US' ? '🇺🇸' : '🇪🇸';
  return <span className="text-base leading-none" title={country}>{flag}</span>;
}

// Lead row (expandable)
function LeadRow({ lead, showCountry }: { lead: Lead; showCountry?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const latestMeeting = lead.calls.find(c => c.meeting)?.meeting;

  return (
    <div className="border border-uber-gray-200 rounded-xl overflow-hidden mb-3 bg-white shadow-sm">
      {/* Main lead row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-[auto_2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-uber-gray-50 transition-colors text-left"
      >
        {/* Expand chevron */}
        <div className="text-uber-gray-400">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>

        {/* Company + Name */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-uber-gray-400 flex-shrink-0" />
            <span className="font-medium text-uber-black truncate">
              {lead.company ?? <span className="text-uber-gray-400 italic">Unknown company</span>}
            </span>
            {showCountry && <CountryFlag country={lead.country} />}
          </div>
          {lead.name && (
            <div className="flex items-center gap-2 mt-1">
              <User className="w-3.5 h-3.5 text-uber-gray-400 flex-shrink-0" />
              <span className="text-sm text-uber-gray-500 truncate">{lead.name}</span>
            </div>
          )}
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2 text-sm text-uber-gray-500">
          <Phone className="w-3.5 h-3.5 text-uber-gray-400 flex-shrink-0" />
          <span className="font-mono">{lead.phone}</span>
        </div>

        {/* Latest Status */}
        <div>
          <StatusBadge status={lead.latestStatus} />
        </div>

        {/* Qualified */}
        <div>
          <QualifiedBadge qualified={lead.isQualified} />
        </div>

        {/* Meeting / Last call */}
        <div className="text-sm">
          {latestMeeting ? (
            <div className="flex items-center gap-1 text-uber-green font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(latestMeeting), 'MMM d')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-uber-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">
                {formatDistanceToNow(new Date(lead.latestCallDate), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>

        {/* Attempts count */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-uber-gray-100 rounded-full">
          <Phone className="w-3 h-3 text-uber-gray-400" />
          <span className="text-xs font-medium text-uber-gray-600">{lead.totalCalls}</span>
        </div>
      </button>

      {/* Expanded call history */}
      {expanded && (
        <div className="border-t border-uber-gray-200">
          {/* Call history header */}
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-2 bg-uber-gray-50 border-b border-uber-gray-200">
            <div className="w-6" />
            <span className="text-[10px] font-semibold text-uber-gray-400 uppercase tracking-wide">Status</span>
            <span className="text-[10px] font-semibold text-uber-gray-400 uppercase tracking-wide">Qualified</span>
            <span className="text-[10px] font-semibold text-uber-gray-400 uppercase tracking-wide">Duration</span>
            <span className="text-[10px] font-semibold text-uber-gray-400 uppercase tracking-wide">Meeting</span>
            <span className="text-[10px] font-semibold text-uber-gray-400 uppercase tracking-wide">Date</span>
          </div>
          {lead.calls.map(call => (
            <CallHistoryRow key={call.id} call={call} />
          ))}
        </div>
      )}
    </div>
  );
}

interface LeadsTableProps {
  leads: Lead[];
  loading?: boolean;
  showCountry?: boolean;
}

export function LeadsTable({ leads, loading, showCountry }: LeadsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CallStatus | 'all'>('all');
  const [qualifiedFilter, setQualifiedFilter] = useState<'all' | 'qualified' | 'not_qualified'>('all');

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = lead.name?.toLowerCase().includes(q);
      const matchesCompany = lead.company?.toLowerCase().includes(q);
      const matchesPhone = lead.phone.includes(q);
      if (!matchesName && !matchesCompany && !matchesPhone) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && lead.latestStatus !== statusFilter) return false;

    // Qualified filter
    if (qualifiedFilter === 'qualified' && !lead.isQualified) return false;
    if (qualifiedFilter === 'not_qualified' && lead.isQualified) return false;

    return true;
  });

  // Loading skeleton
  if (loading && leads.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="bg-white rounded-xl border border-uber-gray-200 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-uber-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, company or phone..."
              className="w-full pl-9 pr-4 py-2 border border-uber-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-uber-green/30"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Qualified filter */}
            <div className="flex items-center gap-1 bg-uber-gray-100 rounded-lg p-1">
              {(['all', 'qualified', 'not_qualified'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setQualifiedFilter(opt)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    qualifiedFilter === opt
                      ? 'bg-white text-uber-black shadow-sm'
                      : 'text-uber-gray-500 hover:text-uber-black'
                  }`}
                >
                  {opt === 'all' ? 'All' : opt === 'qualified' ? 'Qualified' : 'Not qualified'}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-uber-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as CallStatus | 'all')}
                className="appearance-none pl-8 pr-7 py-1.5 text-xs border border-uber-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-uber-green/30 cursor-pointer"
              >
                <option value="all">All statuses</option>
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-uber-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Result count */}
        <div className="mt-2 text-xs text-uber-gray-400">
          Showing {filteredLeads.length} of {leads.length} leads
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[auto_2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-2">
        <div className="w-4" />
        <span className="text-xs font-semibold text-uber-gray-400 uppercase tracking-wide">Company / Name</span>
        <span className="text-xs font-semibold text-uber-gray-400 uppercase tracking-wide">Phone</span>
        <span className="text-xs font-semibold text-uber-gray-400 uppercase tracking-wide">Last Status</span>
        <span className="text-xs font-semibold text-uber-gray-400 uppercase tracking-wide">Qualified</span>
        <span className="text-xs font-semibold text-uber-gray-400 uppercase tracking-wide">Meeting / Last call</span>
        <span className="text-xs font-semibold text-uber-gray-400 uppercase tracking-wide">#</span>
      </div>

      {/* Lead rows */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-xl border border-uber-gray-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-uber-gray-100 flex items-center justify-center mx-auto mb-3">
            <Phone className="w-6 h-6 text-uber-gray-400" />
          </div>
          <p className="text-uber-gray-500 font-medium">No leads found</p>
          <p className="text-sm text-uber-gray-400 mt-1">
            {leads.length === 0
              ? 'No calls received yet. Webhook data will appear here.'
              : 'Try adjusting your filters.'}
          </p>
        </div>
      ) : (
        filteredLeads.map(lead => <LeadRow key={lead.phone} lead={lead} showCountry={showCountry} />)
      )}
    </div>
  );
}
