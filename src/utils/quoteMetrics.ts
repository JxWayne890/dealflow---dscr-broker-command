import { Quote, QuoteStatus } from '../types';

const OPEN_QUOTED_STATUSES = new Set<QuoteStatus>([
    QuoteStatus.SENT,
    QuoteStatus.VIEWED,
    QuoteStatus.ACTIVE,
    QuoteStatus.FOLLOW_UP,
    QuoteStatus.DOWNLOADED,
]);

export const isOpenQuotedDeal = (quote: Quote) => OPEN_QUOTED_STATUSES.has(quote.status);

export const isPrimaryQuote = (quote: Quote) => !quote.parentQuoteId;

const normalizeKeyPart = (value?: string | number) => String(value ?? '').trim().toLowerCase();

export const getDealKey = (quote: Quote) => [
    normalizeKeyPart(quote.investorEmail || quote.investorName),
    normalizeKeyPart(quote.propertyAddress),
    normalizeKeyPart(quote.propertyCity),
    normalizeKeyPart(quote.propertyState),
    normalizeKeyPart(quote.propertyZip),
    normalizeKeyPart(quote.dealType),
    normalizeKeyPart(quote.loanAmount),
].join('|');

export const getUniquePrimaryDeals = (quotes: Quote[]) => {
    const sortedNewestFirst = [...quotes].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    const seen = new Set<string>();
    const uniqueDeals: Quote[] = [];

    for (const quote of sortedNewestFirst) {
        if (!isPrimaryQuote(quote)) continue;

        const key = getDealKey(quote);
        if (seen.has(key)) continue;

        seen.add(key);
        uniqueDeals.push(quote);
    }

    return uniqueDeals;
};

export const getActiveQuotedDeals = (quotes: Quote[]) => (
    getUniquePrimaryDeals(quotes).filter(isOpenQuotedDeal)
);
