import { supabase } from '../lib/supabase';
import { Quote, QuoteStatus } from '../types';
import { ProfileService } from './profileService';

export const QuoteService = {
    async getQuotes(): Promise<Quote[]> {
        const { data, error } = await supabase
            .from('quotes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching quotes:', error);
            throw error;
        }

        // Map DB fields to Frontend types if needed (Supabase returns snake_case columns by default?)
        // Actually, Supabase JS client can return camelCase if configured, or we map manually.
        // For now, assuming we used snake_case in SQL but our types are camelCase. We must map!
        return data.map(mapDbToQuote);
    },

    async getQuote(id: string): Promise<Quote | null> {
        const { data, error } = await supabase
            .from('quotes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching quote:', error);
            return null;
        }

        return mapDbToQuote(data);
    },

    async createQuote(quote: Partial<Quote>): Promise<Quote> {
        const orgId = await ProfileService.getOrganizationId();
        if (!orgId) throw new Error('User not authenticated');

        const dbQuote = {
            ...mapQuoteToDb(quote),
            user_id: orgId
        };

        // Remove ID to let DB generate it, or use the one provided if we want client-side ID generation (UUID)
        // best practice: let DB handle or use UUID lib. Supabase handles default.

        const { data, error } = await supabase
            .from('quotes')
            .insert(dbQuote)
            .select()
            .single();

        if (error) {
            console.error('Supabase error inserting quote:', error);
            throw error;
        }

        return mapDbToQuote(data);
    },

    async updateQuote(id: string, updates: Partial<Quote>): Promise<Quote> {
        const dbUpdates = mapQuoteToDb(updates);
        const { data, error } = await supabase
            .from('quotes')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating quote:', error);
            throw error;
        }

        return mapDbToQuote(data);
    },

    async toggleFollowUps(id: string, enabled: boolean): Promise<Quote> {
        return this.updateQuote(id, { followUpsEnabled: enabled });
    },

    async getQuotesByInvestorId(investorId: string): Promise<Quote[]> {
        const { data, error } = await supabase
            .from('quotes')
            .select('*')
            .eq('investor_id', investorId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching investor quotes:', error);
            return [];
        }

        return data.map(mapDbToQuote);
    }
};

// Mappers to handle snake_case (DB) <-> camelCase (Client) adaptation
const mapDbToQuote = (row: any): Quote => ({
    id: row.id,
    investorId: row.investor_id,
    investorName: row.investor_name,
    investorEmail: row.investor_email,
    propertyAddress: row.property_address,
    propertyCity: row.property_city,
    propertyZip: row.property_zip,
    propertyState: row.property_state,
    dealType: row.deal_type,
    loanAmount: row.loan_amount,
    ltv: row.ltv,
    rate: row.rate,
    rateType: row.rate_type,
    termYears: row.term_years,
    originationFee: row.origination_fee,
    uwFee: row.uw_fee,
    monthlyPayment: row.monthly_payment,
    closingFees: row.closing_fees,
    notes: row.notes,
    emailBody: row.email_body,
    status: row.status as QuoteStatus,
    createdAt: row.created_at,
    lastInteractionAt: row.last_interaction_at, // Map if consistent
    followUpsEnabled: row.follow_ups_enabled,
    followUpSchedule: row.follow_up_schedule || [],
    emailHtml: row.email_html,
    scheduleUrl: row.schedule_url
});

const mapQuoteToDb = (quote: Partial<Quote>): any => {
    const db: any = {};

    // Clean up numeric values and UUIDs
    const cleanUuid = (val?: string) => (val && val.trim() !== '' && val !== 'undefined') ? val : null;
    const cleanNum = (val?: number) => (val !== undefined && !isNaN(val)) ? val : null;

    if (quote.investorId !== undefined) db.investor_id = cleanUuid(quote.investorId);
    if (quote.investorName !== undefined) db.investor_name = quote.investorName;
    if (quote.investorEmail !== undefined) db.investor_email = quote.investorEmail;
    if (quote.propertyAddress !== undefined) db.property_address = quote.propertyAddress;
    if (quote.propertyCity !== undefined) db.property_city = quote.propertyCity;
    if (quote.propertyZip !== undefined) db.property_zip = quote.propertyZip;
    if (quote.propertyState !== undefined) db.property_state = quote.propertyState;
    if (quote.dealType !== undefined) db.deal_type = quote.dealType;
    if (quote.loanAmount !== undefined) db.loan_amount = cleanNum(quote.loanAmount);
    if (quote.ltv !== undefined) db.ltv = cleanNum(quote.ltv);
    if (quote.rate !== undefined) db.rate = cleanNum(quote.rate);
    if (quote.rateType !== undefined) db.rate_type = quote.rateType;
    if (quote.termYears !== undefined) db.term_years = cleanNum(quote.termYears);
    if (quote.originationFee !== undefined) db.origination_fee = cleanNum(quote.originationFee);
    if (quote.uwFee !== undefined) db.uw_fee = cleanNum(quote.uwFee);
    if (quote.monthlyPayment !== undefined) db.monthly_payment = cleanNum(quote.monthlyPayment);
    if (quote.closingFees !== undefined) db.closing_fees = cleanNum(quote.closingFees);
    if (quote.notes !== undefined) db.notes = quote.notes;
    if (quote.emailBody !== undefined) db.email_body = quote.emailBody;
    if (quote.status !== undefined) db.status = quote.status;
    if (quote.followUpsEnabled !== undefined) db.follow_ups_enabled = quote.followUpsEnabled;
    if (quote.followUpSchedule !== undefined) db.follow_up_schedule = quote.followUpSchedule;
    if (quote.emailHtml !== undefined) db.email_html = quote.emailHtml;
    if (quote.scheduleUrl !== undefined) db.schedule_url = quote.scheduleUrl;

    return db;
};
