export enum DealType {
  PURCHASE = 'Purchase',
  REFI_RATE_TERM = 'Refi (Rate/Term)',
  REFI_CASH_OUT = 'Refi (Cash-Out)'
}

export enum QuoteStatus {
  DRAFT = 'Draft',
  ACTIVE = 'Active',
  FOLLOW_UP = 'Follow-up',
  WON = 'Won',
  LOST = 'Lost'
}

export interface Investor {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  properties?: string[];
}

export interface FollowUpEvent {
  id: string;
  dayOffset: number; // 2, 5, 10
  status: 'pending' | 'sent' | 'cancelled';
  scheduledDate: string; // ISO date
  sentDate?: string;
}

export interface Quote {
  id: string;
  investorId: string;
  investorName: string; // Denormalized for speed
  investorEmail: string;
  propertyAddress?: string;
  propertyState: string;
  dealType: DealType;
  loanAmount: number;
  ltv: number;
  rate: number;
  rateType?: 'Fixed' | 'ARM'; // Default to Fixed if missing
  termYears: number;
  originationFee?: number;
  uwFee?: number;
  monthlyPayment?: number;
  closingFees?: number;
  notes?: string;
  emailBody?: string;
  status: QuoteStatus;
  createdAt: string;
  lastInteractionAt?: string;
  followUpSchedule: FollowUpEvent[];
  followUpsEnabled: boolean;
  emailHtml?: string;
  scheduleUrl?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface DashboardMetrics {
  quotesToday: number;
  pendingFollowUps: number;
  activeVolume: number;
  conversionRate: number;
}

export interface BrokerProfile {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  headshotUrl?: string;
  title?: string;
  company?: string;
}

export type EmailFormat = 'text' | 'html';

export type QuoteFilter = 'all' | 'drafts' | 'active' | 'won' | 'lost' | 'needs_follow_up';

export type View = 'dashboard' | 'quotes' | 'new_quote' | 'detail' | 'investors' | 'analytics' | 'settings' | 'public_schedule' | 'campaigns' | 'campaign_editor';