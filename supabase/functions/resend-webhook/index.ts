
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
    try {
        const event = await req.json();

        // Resend Webhook Event Structure
        // { type: 'email.opened', data: { created_at: '...', email_id: '...', tags: [...] } }

        const type = event.type;
        const data = event.data;
        const tags = data.tags || [];

        // Extract Tags
        const getTag = (name: string) => tags.find((t: any) => t.name === name)?.value;
        const campaignId = getTag("campaign_id");
        const stepId = getTag("step_id");
        const leadId = getTag("lead_id") || getTag("quote_id"); // Fallback to legacy quote_id

        console.log(`Received event ${type} for lead ${leadId}`);

        // 1. Log to Campaign Events (The "Journey")
        if (campaignId && leadId) {
            const { error } = await supabase
                .from('campaign_events')
                .insert({
                    campaign_id: campaignId,
                    step_id: stepId, // Might be undefined if global email, but campaign emails have it
                    lead_id: leadId,
                    type: type.replace('email.', ''), // 'opened', 'clicked', 'sent'
                    metadata: {
                        user_agent: data.user_agent,
                        url: data.url, // For clicks
                        email_id: data.email_id
                    }
                });

            if (error) console.error("Error logging campaign event:", error);
        }

        // 2. Legacy/Simple Status Updates (Keep existing logic for backward compat)
        if (leadId) {
            if (type === "email.opened") {
                // Update status to Active if it is currently 'Active' or 'Follow-up'
                // This keeps the deal within the active pipeline but notes the interaction
                await supabase
                    .from('quotes')
                    .update({
                        status: 'Active',
                        last_interaction_at: new Date().toISOString()
                    })
                    .eq('id', leadId)
                    .in('status', ['Active', 'Draft', 'Follow-up']);
            }
            else if (type === "email.clicked") {
                await supabase
                    .from('quotes')
                    .update({
                        last_interaction_at: new Date().toISOString()
                    })
                    .eq('id', leadId);
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
});
