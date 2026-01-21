
import { supabase } from '../lib/supabase';
import { generateHtmlEmail } from '../utils/emailTemplates';
import { ProfileService } from './profileService';
import { BASE_URL } from '../constants';
import { sendQuoteEmail } from './emailService';

export interface Campaign {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
    preferred_run_time?: string;
    created_at: string;
}

export interface CampaignStep {
    id?: string;
    campaign_id: string;
    order_index: number;
    delay_days: number;
    subject_template: string;
    body_template: string;
}

export interface CampaignEvent {
    id: string;
    campaign_id: string;
    step_id?: string;
    lead_id: string;
    type: 'sent' | 'opened' | 'clicked' | 'converted';
    metadata: any;
    created_at: string;
}

export interface CampaignStats {
    total_sent: number;
    total_opened: number;
    total_clicked: number;
    open_rate: number;
    click_rate: number;
}

export interface CampaignSubscription {
    id: string;
    campaign_id: string;
    lead_id: string;
    status: 'active' | 'completed' | 'cancelled' | 'paused';
    current_step_index: number;
    next_run_at: string;
    created_at: string;
    quotes?: {
        id: string;
        investorName: string;
        investorEmail: string;
        dealType: string;
        loanAmount: number;
        propertyAddress: string;
    }
}

export const campaignService = {
    async getCampaigns() {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Campaign[];
    },

    async getCampaign(id: string) {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Campaign;
    },

    async createCampaign(campaign: Partial<Campaign>) {
        const orgId = await ProfileService.getOrganizationId();
        const { data, error } = await supabase
            .from('campaigns')
            .insert({
                ...campaign,
                user_id: orgId
            })
            .select()
            .single();

        if (error) throw error;
        return data as Campaign;
    },

    async updateCampaign(id: string, updates: Partial<Campaign>) {
        const { data, error } = await supabase
            .from('campaigns')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Campaign;
    },

    async deleteCampaign(id: string) {
        const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async deleteCampaigns(ids: string[]) {
        if (ids.length === 0) return;
        const { error } = await supabase
            .from('campaigns')
            .delete()
            .in('id', ids);

        if (error) throw error;
    },

    async getCampaignSteps(campaignId: string) {
        const { data, error } = await supabase
            .from('campaign_steps')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('order_index', { ascending: true });

        if (error) throw error;
        return data as CampaignStep[];
    },

    async saveCampaignSteps(campaignId: string, steps: CampaignStep[]) {
        const { error: deleteError } = await supabase
            .from('campaign_steps')
            .delete()
            .eq('campaign_id', campaignId);

        if (deleteError) throw deleteError;

        const stepsToInsert = steps.map((s, idx) => ({
            campaign_id: campaignId,
            order_index: idx + 1,
            delay_days: s.delay_days,
            subject_template: s.subject_template,
            body_template: s.body_template
        }));

        const { data, error: insertError } = await supabase
            .from('campaign_steps')
            .insert(stepsToInsert)
            .select();

        if (insertError) throw insertError;
        return data;
    },

    /**
     * Calculates the next run date/time based on delay, preferred runtime, and timezone.
     */
    calculateNextRunAt(delayDays: number, preferredTime: string = '09:00', timezone: string = 'UTC'): string {
        const now = new Date();
        const nextDate = new Date();
        nextDate.setDate(now.getDate() + delayDays);

        // Parse preferredTime (HH:mm)
        const [hours, minutes] = preferredTime.split(':').map(Number);

        // We want to create a date in the target timezone at the specific hour/minute
        // Javascript's Date doesn't have native "create in this timezone" easily without offsets.
        // A reliable way is to use Intl to see what the current offset is or construct a string.

        try {
            // Create a string that Date.parse will treat as the local time in that timezone
            // Example: 2026-01-19T09:00:00.000 (Local)
            const year = nextDate.getFullYear();
            const month = String(nextDate.getMonth() + 1).padStart(2, '0');
            const day = String(nextDate.getDate()).padStart(2, '0');
            const h = String(hours).padStart(2, '0');
            const m = String(minutes).padStart(2, '0');

            // Construct a local ISO-like string
            const localString = `${year}-${month}-${day}T${h}:${m}:00`;

            // Use Intl.DateTimeFormat to find the UTC equivalent
            // This is slightly tricky, a simpler way is to use the fact that
            // new Date().toLocaleString("en-US", {timeZone: "America/New_York"}) gives us the time there.

            // For MVP/Robustness without external libs, we'll use a trick:
            // 1. Create a Date object for the target time in UTC
            let target = new Date(`${localString}Z`); // Temporary UTC anchor

            // 2. Find the difference between UTC and the requested timezone at that moment
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: 'numeric', minute: 'numeric', second: 'numeric',
                hour12: false
            });

            const parts = formatter.formatToParts(target);
            const getPart = (type: string) => parts.find(p => p.type === type)?.value;

            const tzYear = Number(getPart('year'));
            const tzMonth = Number(getPart('month'));
            const tzDay = Number(getPart('day'));
            const tzHour = Number(getPart('hour'));
            const tzMin = Number(getPart('minute'));

            const tzDate = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMin));
            const diff = target.getTime() - tzDate.getTime();

            // Adjust the original target by the difference to get the correct UTC time
            return new Date(target.getTime() + diff).toISOString();
        } catch (e) {
            console.error('Error calculating timezone offset, falling back to UTC', e);
            nextDate.setUTCHours(hours, minutes, 0, 0);
            return nextDate.toISOString();
        }
    },

    async subscribeLead(campaignId: string, leadId: string) {
        const { data: steps, error: stepError } = await supabase
            .from('campaign_steps')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('order_index', { ascending: true })
            .limit(1);

        if (stepError) throw stepError;
        if (!steps || steps.length === 0) throw new Error("Campaign has no steps");

        const firstStep = steps[0];

        // Fetch Campaign and Profile for settings
        const { data: campaign } = await supabase
            .from('campaigns')
            .select('preferred_run_time, user_id')
            .eq('id', campaignId)
            .single();

        const profile = await ProfileService.getProfile(); // Assuming this fetches current user's profile

        const nextRun = this.calculateNextRunAt(
            firstStep.delay_days,
            campaign?.preferred_run_time || '09:00',
            profile?.timezone || 'UTC'
        );

        const { error } = await supabase
            .from('campaign_subscriptions')
            .insert({
                campaign_id: campaignId,
                lead_id: leadId,
                current_step_index: 0,
                status: 'active',
                next_run_at: nextRun
            });

        if (error) throw error;
    },

    async getLeadEvents(leadId: string) {
        const { data, error } = await supabase
            .from('campaign_events')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as CampaignEvent[];
    },

    async getCampaignSubscriptions(campaignId: string) {
        const { data, error } = await supabase
            .from('campaign_subscriptions')
            .select(`
                *,
                quotes (
                    id,
                    investor_name, 
                    investor_email,
                    deal_type,
                    loan_amount,
                    property_address
                )
            `)
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data?.map(sub => ({
            ...sub,
            quotes: sub.quotes ? {
                id: sub.quotes.id,
                investorName: sub.quotes.investor_name,
                investorEmail: sub.quotes.investor_email,
                dealType: sub.quotes.deal_type,
                loanAmount: sub.quotes.loan_amount,
                propertyAddress: sub.quotes.property_address
            } : undefined
        })) as CampaignSubscription[];
    },

    async getCampaignStats(campaignId: string): Promise<CampaignStats> {
        // For MVP, we'll fetch raw events and aggregate in JS. 
        // In prod, use a SQL view or RPC.
        const { data, error } = await supabase
            .from('campaign_events')
            .select('type')
            .eq('campaign_id', campaignId);

        if (error) throw error;

        const events = data || [];
        const sent = events.filter(e => e.type === 'sent').length;
        const opened = events.filter(e => e.type === 'opened').length;
        const clicked = events.filter(e => e.type === 'clicked').length;

        return {
            total_sent: sent,
            total_opened: opened,
            total_clicked: clicked,
            open_rate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
            click_rate: sent > 0 ? Math.round((clicked / sent) * 100) : 0
        };
    },

    async triggerImmediateEmail(subscriptionId: string, stepOrder?: number) {
        // 1. Fetch subscription with quote details
        const { data: sub, error: subError } = await supabase
            .from('campaign_subscriptions')
            .select(`
                *,
                quotes (
                    *
                ),
                campaigns (
                    preferred_run_time,
                    user_id
                )
            `)
            .eq('id', subscriptionId)
            .single();

        if (subError || !sub) throw new Error('Subscription not found');
        if (!sub.quotes) throw new Error('Quote not found for this subscription');

        // 2. Identify the campaign step to send
        const sendStepOrder = stepOrder || (sub.current_step_index || 0) + 1;
        const { data: step, error: stepError } = await supabase
            .from('campaign_steps')
            .select('*')
            .eq('campaign_id', sub.campaign_id)
            .eq('order_index', sendStepOrder)
            .single();

        if (stepError || !step) throw new Error('No step found for this campaign');

        // 3. Get Agent Profile and Prepare content
        const profile = await ProfileService.getProfile();
        if (!profile) throw new Error('Broker profile not found. Please set up your profile in Settings.');

        let bodyTemplate = step.body_template || '';
        let subjectTemplate = step.subject_template || '';

        const variables: Record<string, string> = {
            firstName: sub.quotes.investor_name?.split(' ')[0] || 'there',
            fullName: sub.quotes.investor_name || 'Investor',
            address: sub.quotes.property_address || 'Property',
            dealType: sub.quotes.deal_type || 'Deal',
            senderName: profile.name || '',
            companyName: profile.company || ''
        };

        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            bodyTemplate = bodyTemplate.replace(regex, value);
            subjectTemplate = subjectTemplate.replace(regex, value);
        }

        // 4. Map database quote row back to Quote type for generator
        const quoteObj = {
            id: sub.quotes.id,
            investorName: sub.quotes.investor_name,
            investorEmail: sub.quotes.investor_email,
            propertyAddress: sub.quotes.property_address,
            propertyState: sub.quotes.property_state,
            loanAmount: sub.quotes.loan_amount,
            ltv: sub.quotes.ltv,
            rate: sub.quotes.rate,
            termYears: sub.quotes.term_years,
            rateType: sub.quotes.rate_type,
            monthlyPayment: sub.quotes.monthly_payment,
            closingFees: sub.quotes.closing_fees,
            originationFee: sub.quotes.origination_fee,
            uwFee: sub.quotes.uw_fee,
            dealType: sub.quotes.deal_type,
            scheduleUrl: `${BASE_URL}/?view=schedule&quoteId=${sub.quotes.id}`
        };

        const html = generateHtmlEmail(quoteObj, profile, bodyTemplate);

        // 5. Send using the established email service (invokes Supabase 'send-email' function)
        const result = await sendQuoteEmail(quoteObj as any, html, profile);

        if (!result.success) {
            throw new Error(result.error || 'Failed to send email');
        }

        // 6. Update subscription for next step
        const now = new Date().toISOString();
        const nextNextStepOrder = sendStepOrder + 1;
        const { data: nextStep } = await supabase
            .from('campaign_steps')
            .select('delay_days')
            .eq('campaign_id', sub.campaign_id)
            .eq('order_index', nextNextStepOrder)
            .single();

        const updates: any = {
            current_step_index: sendStepOrder,
            last_email_sent_at: now,
        };

        if (nextStep) {
            const nextRun = this.calculateNextRunAt(
                nextStep.delay_days,
                (sub as any).campaigns.preferred_run_time || '09:00',
                profile?.timezone || 'UTC'
            );
            updates.next_run_at = nextRun;
        } else {
            updates.status = 'completed';
            updates.next_run_at = null;
        }

        await supabase
            .from('campaign_subscriptions')
            .update(updates)
            .eq('id', subscriptionId);

        // 7. Log the event
        await supabase.from('campaign_events').insert({
            campaign_id: sub.campaign_id,
            step_id: step.id,
            lead_id: sub.lead_id,
            type: 'sent',
            metadata: { manual_trigger: true }
        });
    }
};
