export enum DealType {
  PURCHASE = 'Purchase',
  REFI_RATE_TERM = 'Refi (Rate/Term)',
  REFI_CASH_OUT = 'Refi (Cash-Out)'
}

export enum QuoteStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  VIEWED = 'Viewed',
  REPLIED = 'Replied',
  CLOSED_WON = 'Closed Won',
  CLOSED_LOST = 'Closed Lost'
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
  termYears: number;
  notes?: string;
  emailBody?: string;
  status: QuoteStatus;
  createdAt: string;
  lastInteractionAt?: string;
  followUpSchedule: FollowUpEvent[];
  followUpsEnabled: boolean;
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
}

export type EmailFormat = 'text' | 'html';