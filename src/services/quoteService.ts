import { supabase } from '../lib/supabase';
import { Quote, QuoteStatus } from '../types';

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const dbQuote = {
            ...mapQuoteToDb(quote),
            user_id: user.id
        };

        // Remove ID to let DB generate it, or use the one provided if we want client-side ID generation (UUID)
        // best practice: let DB handle or use UUID lib. Supabase handles default.

        const { data, error } = await supabase
            .from('quotes')
            .insert(dbQuote)
            .select()
            .single();

        if (error) {
            console.error('Error creating quote:', error);
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
    }
};

// Mappers to handle snake_case (DB) <-> camelCase (Client) adaptation
const mapDbToQuote = (row: any): Quote => ({
    id: row.id,
    investorId: row.investor_id,
    investorName: row.investor_name,
    investorEmail: row.investor_email,
    propertyAddress: row.property_address,
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
    if (quote.investorId !== undefined) db.investor_id = quote.investorId;
    if (quote.investorName !== undefined) db.investor_name = quote.investorName;
    if (quote.investorEmail !== undefined) db.investor_email = quote.investorEmail;
    if (quote.propertyAddress !== undefined) db.property_address = quote.propertyAddress;
    if (quote.propertyState !== undefined) db.property_state = quote.propertyState;
    if (quote.dealType !== undefined) db.deal_type = quote.dealType;
    if (quote.loanAmount !== undefined) db.loan_amount = quote.loanAmount;
    if (quote.ltv !== undefined) db.ltv = quote.ltv;
    if (quote.rate !== undefined) db.rate = quote.rate;
    if (quote.rateType !== undefined) db.rate_type = quote.rateType;
    if (quote.termYears !== undefined) db.term_years = quote.termYears;
    if (quote.originationFee !== undefined) db.origination_fee = quote.originationFee;
    if (quote.uwFee !== undefined) db.uw_fee = quote.uwFee;
    if (quote.monthlyPayment !== undefined) db.monthly_payment = quote.monthlyPayment;
    if (quote.closingFees !== undefined) db.closing_fees = quote.closingFees;
    if (quote.notes !== undefined) db.notes = quote.notes;
    if (quote.emailBody !== undefined) db.email_body = quote.emailBody;
    if (quote.status !== undefined) db.status = quote.status;
    if (quote.followUpsEnabled !== undefined) db.follow_ups_enabled = quote.followUpsEnabled;
    if (quote.followUpSchedule !== undefined) db.follow_up_schedule = quote.followUpSchedule;
    if (quote.emailHtml !== undefined) db.email_html = quote.emailHtml;
    if (quote.scheduleUrl !== undefined) db.schedule_url = quote.scheduleUrl;
    // user_id is handled by RLS policies generally, but might need to be explicit if inserting
    // Actually, usually we insert with `auth.uid()` if we have a trigger,
    // OR we pass it from session. For now, relying on Supabase to set it might require a trigger
    // or we must pass it. The API usually requires it if column is not nullable.
    // Let's assume we pass it from the Service caller or context for now, OR rely on backend trigger.
    // The policy "Users can insert own quotes" checks (auth.uid() = user_id), so we MUST send user_id.
    // I'll add user_id injection in the Service method if session is available, or rely on caller?

    // Better: Helper to get current user
    return db;
};
