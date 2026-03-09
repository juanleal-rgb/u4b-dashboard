// Data types and processing logic for U4B Dashboard

export type CallStatus =
  | 'Meeting scheduled'
  | 'Callback requested'
  | 'Send information'
  | 'No interest'
  | 'Not a fit'
  | 'Wrong contact'
  | 'Voicemail'
  | 'Hang up';

export type LeadCategory =
  | 'meeting_scheduled'
  | 'callback_requested'
  | 'send_information'
  | 'no_interest'
  | 'not_a_fit'
  | 'wrong_contact'
  | 'voicemail'
  | 'hang_up';

export interface CallRecord {
  id: number;
  phone: string;
  name: string | null;
  company: string | null;
  status: CallStatus;
  qualified: boolean;
  meeting: string | null;
  summary: string;
  attempt: number;
  duration: number;
  callUrl: string | null;
  createdAt: string;
}

export interface Lead {
  phone: string;
  name: string | null;
  company: string | null;
  calls: CallRecord[];
  totalCalls: number;
  latestStatus: CallStatus;
  latestCallDate: string;
  isQualified: boolean;
  hasMeeting: boolean;
  leadCategory: LeadCategory;
}

export interface DashboardStats {
  totalCalls: number;
  totalLeads: number;
  qualifiedLeads: number;
  qualifiedRate: number;
  meetingsScheduled: number;
  meetingRate: number;
  avgDuration: number;
}

// Maps a CallStatus to a LeadCategory
export function statusToCategory(status: CallStatus): LeadCategory {
  const map: Record<CallStatus, LeadCategory> = {
    'Meeting scheduled': 'meeting_scheduled',
    'Callback requested': 'callback_requested',
    'Send information': 'send_information',
    'No interest': 'no_interest',
    'Not a fit': 'not_a_fit',
    'Wrong contact': 'wrong_contact',
    'Voicemail': 'voicemail',
    'Hang up': 'hang_up',
  };
  return map[status] ?? 'hang_up';
}

// Priority order for determining lead category (highest priority first)
const CATEGORY_PRIORITY: LeadCategory[] = [
  'meeting_scheduled',
  'callback_requested',
  'send_information',
  'no_interest',
  'not_a_fit',
  'wrong_contact',
  'voicemail',
  'hang_up',
];

// Groups flat call records into leads by phone number
export function groupCallsIntoLeads(calls: CallRecord[]): Lead[] {
  const leadMap = new Map<string, CallRecord[]>();

  for (const call of calls) {
    const existing = leadMap.get(call.phone) ?? [];
    existing.push(call);
    leadMap.set(call.phone, existing);
  }

  const leads: Lead[] = [];

  leadMap.forEach((leadCalls, phone) => {
    // Sort calls by createdAt descending (newest first)
    const sorted = [...leadCalls].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const latest = sorted[0];

    // Use the name/company from the most recent call that has them
    const nameCall = sorted.find(c => c.name);
    const companyCall = sorted.find(c => c.company);

    const isQualified = sorted.some(c => c.qualified);
    const hasMeeting = sorted.some(c => c.status === 'Meeting scheduled' && c.meeting);

    // Determine lead category: use highest-priority status across all calls
    let bestCategory: LeadCategory = statusToCategory(latest.status);
    for (const call of sorted) {
      const cat = statusToCategory(call.status);
      if (CATEGORY_PRIORITY.indexOf(cat) < CATEGORY_PRIORITY.indexOf(bestCategory)) {
        bestCategory = cat;
      }
    }

    leads.push({
      phone,
      name: nameCall?.name ?? null,
      company: companyCall?.company ?? null,
      calls: sorted,
      totalCalls: sorted.length,
      latestStatus: latest.status,
      latestCallDate: latest.createdAt,
      isQualified,
      hasMeeting,
      leadCategory: bestCategory,
    });
  });

  // Sort leads: qualified first, then by latest call date
  leads.sort((a, b) => {
    if (a.isQualified && !b.isQualified) return -1;
    if (!a.isQualified && b.isQualified) return 1;
    return new Date(b.latestCallDate).getTime() - new Date(a.latestCallDate).getTime();
  });

  return leads;
}

// Compute dashboard stats from calls
export function computeStats(calls: CallRecord[]): DashboardStats {
  const totalCalls = calls.length;
  const phones = new Set(calls.map(c => c.phone));
  const totalLeads = phones.size;
  const qualifiedLeads = new Set(calls.filter(c => c.qualified).map(c => c.phone)).size;
  const qualifiedRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;
  const meetingsScheduled = new Set(
    calls.filter(c => c.status === 'Meeting scheduled').map(c => c.phone)
  ).size;
  const meetingRate = totalLeads > 0 ? (meetingsScheduled / totalLeads) * 100 : 0;
  const callsWithDuration = calls.filter(c => c.duration > 0);
  const avgDuration =
    callsWithDuration.length > 0
      ? callsWithDuration.reduce((sum, c) => sum + c.duration, 0) / callsWithDuration.length
      : 0;

  return {
    totalCalls,
    totalLeads,
    qualifiedLeads,
    qualifiedRate,
    meetingsScheduled,
    meetingRate,
    avgDuration,
  };
}

// Status display metadata
export const STATUS_META: Record<CallStatus, { label: string; color: string; bg: string; text: string }> = {
  'Meeting scheduled': { label: 'Meeting scheduled', color: '#00B14F', bg: 'bg-green-100', text: 'text-green-700' },
  'Callback requested': { label: 'Callback requested', color: '#3B82F6', bg: 'bg-blue-100', text: 'text-blue-700' },
  'Send information': { label: 'Send information', color: '#F59E0B', bg: 'bg-amber-100', text: 'text-amber-700' },
  'No interest': { label: 'No interest', color: '#EF4444', bg: 'bg-red-100', text: 'text-red-700' },
  'Not a fit': { label: 'Not a fit', color: '#B91C1C', bg: 'bg-red-100', text: 'text-red-800' },
  'Wrong contact': { label: 'Wrong contact', color: '#6B7280', bg: 'bg-gray-100', text: 'text-gray-600' },
  'Voicemail': { label: 'Voicemail', color: '#F97316', bg: 'bg-orange-100', text: 'text-orange-700' },
  'Hang up': { label: 'Hang up', color: '#D97706', bg: 'bg-amber-100', text: 'text-amber-800' },
};

export const ALL_STATUSES: CallStatus[] = [
  'Meeting scheduled',
  'Callback requested',
  'Send information',
  'No interest',
  'Not a fit',
  'Wrong contact',
  'Voicemail',
  'Hang up',
];
