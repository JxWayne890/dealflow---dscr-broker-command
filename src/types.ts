export enum DealType {
  PURCHASE = 'Purchase',
  REFI_RATE_TERM = 'Refi (Rate/Term)',
  REFI_CASH_OUT = 'Refi (Cash-Out)'
}

export enum QuoteStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  VIEWED = 'Viewed',
  ACTIVE = 'Active',
  FOLLOW_UP = 'Follow-up',
  WON = 'Won',
  LOST = 'Lost',
  DOWNLOADED = 'Downloaded'
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
  propertyCity?: string;
  propertyZip?: string;
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
  brokerFee?: number;
  brokerFeePercent?: number;
  brokerFeeType?: '$' | '%';
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
  lenderCode?: string;
  prepayPenalty?: string;
  creditScore?: string;
  parentQuoteId?: string; // Links comparative quotes to a primary one
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

export interface Permissions {
  dashboard: boolean;
  quotes: boolean;
  investors: boolean;
  campaigns: boolean;
  analytics: boolean;
}

export interface WebsitePage {
  id: string;
  profileId: string;
  slug: string;
  title: string;
  content: any; // Flexible JSON content
  isPublished: boolean;
  order: number;
}

export interface BrokerProfile {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  headshotUrl?: string;
  title?: string;
  company?: string;
  timezone?: string;
  theme?: 'light' | 'dark';
  senderEmailPrefix?: string;
  role?: 'admin' | 'assistant';
  parentId?: string;
  permissions?: Permissions;
  inviteCode?: string;
  onboardingStatus?: 'joined' | 'pending_setup' | 'pending_payment' | 'active';
  autoSendQuoteEmail?: boolean;
  emailsSent?: number;
  subscriptionStatus?: 'trial' | 'active' | 'expired';
  websiteSubdomain?: string;
  websiteSettings?: {
    theme?: 'modern' | 'classic' | 'bold';
    primaryColor?: string;
    navLinks?: { label: string; url: string }[];
  };
}

export type EmailFormat = 'text' | 'html';

export type QuoteFilter = 'all' | 'drafts' | 'active' | 'won' | 'lost' | 'needs_follow_up';

export type View = 'dashboard' | 'quotes' | 'new_quote' | 'detail' | 'investors' | 'analytics' | 'settings' | 'public_schedule' | 'campaigns' | 'campaign_editor' | 'team' | 'confirmation' | 'dev' | 'website_builder';