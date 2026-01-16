import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface Lead {
    id: string;
    investorEmail: string;
    investorName?: string;
    propertyAddress?: string;
    [key: string]: any;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

        // 1. Fetch due subscriptions
        // We join with campaign_steps to get the CURRENT step details
        // We strictly filter for things due now or in the past
        const now = new Date().toISOString();

        // We need to fetch subscriptions that are active and due
        const { data: subscriptions, error: subError } = await supabase
            .from('campaign_subscriptions')
            .select(`
            id,
            lead_id,
            campaign_id,
            current_step_index,
            status,
            campaigns ( name, user_id ),
            campaign_steps!inner (
                id,
                order_index,
                subject_template,
                body_template,
                delay_days
            )
        `)
            .eq('status', 'active')
            .lte('next_run_at', now)
        // We filter steps where order_index matches current_step_index + 1 (since we're looking for the NEXT step to send)
        // Wait, logic check: 
        // If current_step_index is 0, we want step 1.
        // So we want campaign_steps.order_index == current_step_index + 1
        // However, Supabase filtering on inner joins with dynamic comparison is tricky.
        // Simplified approach: Fetch all due subscriptions, then fetch the specific steps we need in a second query or filter in memory if volume is low.
        // Better: Let's assume 'next_run_at' is correctly set. 
        // We just need the CAMPAIGN info and the LEAD info.
        // We can fetch the specific step later.

        if (subError) throw subError;
        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ message: "No campaigns due" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log(`Found ${subscriptions.length} campaigns due.`);
        const results = [];

        for (const sub of subscriptions) {
            // 2. Fetch Lead Details
            const { data: lead, error: leadError } = await supabase
                .from('quotes') // Assuming 'quotes' is the leads table
                .select('*')
                .eq('id', sub.lead_id)
                .single();

            if (leadError || !lead) {
                console.error(`Lead not found for sub ${sub.id}`);
                // Mark failed?
                await supabase.from('campaign_subscriptions').update({ status: 'failed', last_email_sent_at: now }).eq('id', sub.id);
                continue;
            }

            // 3. Identify the Step to send
            // If current_step_index is 0, we want step with order_index 1.
            const nextStepOrder = (sub.current_step_index || 0) + 1;

            // We need to find the step from the ones returned or query it?
            // In the query above we did `campaign_steps!inner`. 
            // This might return MULTIPLE rows per subscription if we didn't filter.
            // Correct approach: Query `campaign_steps` for this campaign_id and order_index.
            const { data: step, error: stepError } = await supabase
                .from('campaign_steps')
                .select('*')
                .eq('campaign_id', sub.campaign_id)
                .eq('order_index', nextStepOrder)
                .single();

            if (!step) {
                // No more steps? Mark completed.
                await supabase
                    .from('campaign_subscriptions')
                    .update({ status: 'completed', last_email_sent_at: now })
                    .eq('id', sub.id);
                results.push({ subId: sub.id, status: 'completed_no_more_steps' });
                continue;
            }

            // 4. Prepare Email
            let body = step.body_template || "";
            let subject = step.subject_template || "";

            // Replace variables
            const variables = {
                firstName: lead.investor_name?.split(' ')[0] || "there",
                fullName: lead.investor_name || "Investor",
                address: lead.property_address || "Property",
                dealType: lead.deal_type || "Deal",
                // Add more as needed
            };

            for (const [key, value] of Object.entries(variables)) {
                const regex = new RegExp(`{{${key}}}`, 'g');
                body = body.replace(regex, value);
                subject = subject.replace(regex, value);
            }

            // 5. Send Email
            // Construct "From" address - ideally this comes from the Campaign or User settings
            // For now, default to system
            const fromAddress = "DealFlow <deals@mastercleanhq.com>";

            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: fromAddress,
                    to: [lead.investor_email],
                    subject: subject,
                    html: body,
                    tags: [
                        { name: "campaign_id", value: sub.campaign_id },
                        { name: "lead_id", value: sub.lead_id },
                        { name: "step_id", value: step.id },
                        { name: "step_order", value: nextStepOrder.toString() }
                    ]
                }),
            });

            if (!res.ok) {
                console.error(`Failed to send email for sub ${sub.id}`);
                // Don't update status, retry later? Or mark failed?
                continue;
            }

            // 6. Update Subscription for NEXT step
            // We need to see if there is a step AFTER this one to calculate next_run_at
            const nextNextStepOrder = nextStepOrder + 1;
            const { data: nextStep } = await supabase
                .from('campaign_steps')
                .select('delay_days')
                .eq('campaign_id', sub.campaign_id)
                .eq('order_index', nextNextStepOrder)
                .single();

            let updates: any = {
                current_step_index: nextStepOrder,
                last_email_sent_at: now,
            };

            if (nextStep) {
                // Calculate next run time
                const nextRun = new Date();
                nextRun.setDate(nextRun.getDate() + nextStep.delay_days);
                updates.next_run_at = nextRun.toISOString();
            } else {
                // No next step, mark complete
                updates.status = 'completed';
                updates.next_run_at = null;
            }

            await supabase
                .from('campaign_subscriptions')
                .update(updates)
                .eq('id', sub.id);

            results.push({ subId: sub.id, status: 'sent', step: nextStepOrder });
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error processing campaigns:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
