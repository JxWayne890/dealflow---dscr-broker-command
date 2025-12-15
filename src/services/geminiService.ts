import { Quote } from "../types";

export const generateQuoteEmail = (quoteData: Partial<Quote>): string => {
  return `Subject: DSCR Loan Quote - ${quoteData.propertyState || 'Property'}

Hi ${quoteData.investorName?.split(' ')[0] || 'Investor'},

Great connecting with you. Based on the details provided, here is the quote for your ${quoteData.dealType || 'deal'} scenario in ${quoteData.propertyState || 'your target market'}:

Loan Amount: $${quoteData.loanAmount?.toLocaleString() || '0'}
LTV: ${quoteData.ltv}%
Rate: ${quoteData.rate}%
Term: ${quoteData.termYears} Years

${quoteData.notes ? `Note: ${quoteData.notes}\n` : ''}
Let me know if these terms work for you and I can lock this in today.

Best,
[Your Name]`;
};
