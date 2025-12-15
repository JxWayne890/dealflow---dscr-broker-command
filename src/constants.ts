import { Quote, QuoteStatus, DealType, Investor } from './types';

export const APP_NAME = "DealFlow";

// Mock Data for initial state
export const MOCK_INVESTORS: Investor[] = [
  { id: '1', name: 'Alex Rivera', email: 'alex@riveracapital.com', company: 'Rivera Capital' },
  { id: '2', name: 'Sarah Chen', email: 'sarah.chen@horizonprops.com', company: 'Horizon Properties' },
  { id: '3', name: 'Mike Ross', email: 'mike@pearmanholdings.com', company: 'Pearman Holdings' },
];

export const MOCK_QUOTES: Quote[] = [
  {
    id: '101',
    investorId: '1',
    investorName: 'Alex Rivera',
    investorEmail: 'alex@riveracapital.com',
    propertyState: 'TX',
    dealType: DealType.PURCHASE,
    loanAmount: 450000,
    ltv: 75,
    rate: 7.25,
    termYears: 30,
    status: QuoteStatus.SENT,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    lastInteractionAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    followUpsEnabled: true,
    followUpSchedule: [
      { id: 'f1', dayOffset: 2, status: 'sent', scheduledDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString() },
      { id: 'f2', dayOffset: 5, status: 'pending', scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString() },
      { id: 'f3', dayOffset: 10, status: 'pending', scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString() },
    ]
  },
  {
    id: '102',
    investorId: '2',
    investorName: 'Sarah Chen',
    investorEmail: 'sarah.chen@horizonprops.com',
    propertyState: 'FL',
    dealType: DealType.REFI_CASH_OUT,
    loanAmount: 850000,
    ltv: 65,
    rate: 7.85,
    termYears: 30,
    status: QuoteStatus.VIEWED,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    lastInteractionAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    followUpsEnabled: true,
    followUpSchedule: [
      { id: 'f4', dayOffset: 2, status: 'pending', scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString() },
      { id: 'f5', dayOffset: 5, status: 'pending', scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString() },
      { id: 'f6', dayOffset: 10, status: 'pending', scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString() },
    ]
  }
];
