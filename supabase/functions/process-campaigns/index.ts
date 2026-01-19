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

// Helper for amortization (Ported from finance.ts)
const calculateAmortizationSchedule = (loanAmount: number, annualRate: number, termYears: number) => {
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = (termYears || 30) * 12;
    // Basic payment formula
    const power = Math.pow(1 + monthlyRate, numberOfPayments);
    const monthlyPayment = loanAmount * (monthlyRate * power) / (power - 1);

    const schedule = [];
    let remainingBalance = loanAmount;
    for (let month = 1; month <= Math.min(numberOfPayments, 360); month++) {
        const interest = remainingBalance * monthlyRate;
        const principal = monthlyPayment - interest;
        remainingBalance -= principal;
        schedule.push({ principal, remainingBalance: Math.max(0, remainingBalance) });
    }
    return schedule;
};

// Helper for professional HTML (Ported from emailTemplates.ts)
const generateHtmlEmail = (quote: any, profile: any, messageBody: string) => {
    const bodyParagraphs = (messageBody || '').split('\n').filter(line => line.trim()).map(line =>
        `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#374151;">${line}</p>`
    ).join('');
    const finalBody = bodyParagraphs || `<p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#374151;">Great connecting with you. Here is the quote for your scenario.</p>`;

    const schedule = calculateAmortizationSchedule(quote.loan_amount || 0, quote.rate || 0, quote.term_years || 30);
    const firstYearPrincipal = schedule.slice(0, 12).reduce((acc, curr) => acc + curr.principal, 0);

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;font-family:Helvetica,Arial,sans-serif;background-color:#f3f4f6;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
    <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
          <tr><td style="padding:40px;">
              ${profile.logo_url ? `<img src="${profile.logo_url}" alt="${profile.name}" height="40" style="height:40px;display:block;" />` : `<div style="font-size:20px;font-weight:bold;color:#111827;">${profile.name || 'DealFlow'}</div>`}
              <h1 style="margin:24px 0 12px 0;color:#111827;font-size:24px;font-weight:700;line-height:1.3;">
                Quote for ${quote.property_address ? `${quote.property_address} (${quote.property_state})` : quote.property_state || 'Your Deal'} - ${quote.deal_type || 'Loan'}
              </h1>
              ${finalBody}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
                <tr><td style="padding:24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" style="padding-bottom:16px;">
                          <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Loan Amount</div>
                          <div style="font-size:18px;font-weight:700;color:#111827;">$${(quote.loan_amount || 0).toLocaleString()}</div>
                        </td>
                        <td width="50%" style="padding-bottom:16px;">
                          <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">LTV</div>
                          <div style="font-size:18px;font-weight:700;color:#111827;">${quote.ltv}%</div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%">
                          <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Interest Rate</div>
                          <div style="font-size:18px;font-weight:700;color:#111827;">${quote.rate}%</div>
                        </td>
                        <td width="50%">
                          <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Term</div>
                          <div style="font-size:18px;font-weight:700;color:#111827;">${quote.term_years || 30}-Year ${quote.rate_type || 'Fixed'}</div>
                        </td>
                      </tr>
                    </table></td></tr>
              </table>
              <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;margin-top:24px;border:1px dashed #d1d5db;">
                <h3 style="margin:0 0 12px 0;font-size:16px;color:#111827;">Amortization Highlights</h3>
                <p style="margin:0 0 12px 0;font-size:14px;color:#4b5563;line-height:1.5;">
                  The first year of your loan will build approximately <strong>$${firstYearPrincipal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> in equity through principal paydown.
                </p>
                <div style="font-size:13px;color:#6b7280;text-align:center;">
                  <a href="https://dealflow-dscr.vercel.app/?view=schedule&quoteId=${quote.id}" style="display:inline-block;padding:10px 24px;background:#4f46e5;border-radius:6px;color:#ffffff;font-weight:600;text-decoration:none;">
                    View Full Amortization Schedule
                  </a>
                </div>
              </div>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  ${profile.headshot_url ? `<td width="72" valign="top"><img src="${profile.headshot_url}" alt="${profile.name}" width="60" height="60" style="border-radius:50%;display:block;border:2px solid #e5e7eb;object-fit:cover;" /></td>` : ''}
                  <td valign="top" style="${profile.headshot_url ? 'padding-left:12px;' : ''}">
                    <div style="font-weight:700;color:#111827;font-size:16px;">${profile.name || 'DealFlow Team'}</div>
                    <div style="color:#4b5563;font-size:14px;margin-top:2px;">${profile.title || 'Loan Broker'}</div>
                    <div style="color:#6b7280;font-size:14px;margin-top:6px;">
                      ${profile.phone ? `<a href="tel:${profile.phone}" style="color:#6b7280;text-decoration:none;">${profile.phone}</a>` : ''}
                      ${profile.phone && profile.website ? '&nbsp;&nbsp;|&nbsp;&nbsp;' : ''}
                      ${profile.website ? `<a href="${profile.website}" style="color:#6b7280;text-decoration:none;">Website</a>` : ''}
                    </div>
                  </td>
                </tr>
              </table>
            </td></tr>
        </table>
      </td></tr>
  </table>
</body>
</html>`;
};

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

        const now = new Date().toISOString();

        // 1. Fetch due subscriptions
        const { data: subscriptions, error: subError } = await supabase
            .from('campaign_subscriptions')
            .select(`
                id, lead_id, campaign_id, current_step_index, status,
                campaigns ( name, user_id )
            `)
            .eq('status', 'active')
            .lte('next_run_at', now);

        if (subError) throw subError;
        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ message: "No campaigns due" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const results = [];

        for (const sub of subscriptions) {
            // 2. Fetch Lead Details
            const { data: lead, error: leadError } = await supabase
                .from('quotes')
                .select('*')
                .eq('id', sub.lead_id)
                .single();

            if (leadError || !lead) {
                console.error(`Lead not found for sub ${sub.id}`);
                await supabase.from('campaign_subscriptions').update({ status: 'failed', last_email_sent_at: now }).eq('id', sub.id);
                continue;
            }

            // 3. Fetch Broker Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sub.campaigns.user_id)
                .single();

            // 4. Identify the Step
            const nextStepOrder = (sub.current_step_index || 0) + 1;
            const { data: step } = await supabase
                .from('campaign_steps')
                .select('*')
                .eq('campaign_id', sub.campaign_id)
                .eq('order_index', nextStepOrder)
                .single();

            if (!step) {
                await supabase.from('campaign_subscriptions').update({ status: 'completed', last_email_sent_at: now }).eq('id', sub.id);
                results.push({ subId: sub.id, status: 'completed_no_more_steps' });
                continue;
            }

            // 5. Prepare Professional Email
            let body = step.body_template || "";
            let subject = step.subject_template || "";
            const variables = {
                firstName: lead.investor_name?.split(' ')[0] || "there",
                fullName: lead.investor_name || "Investor",
                address: lead.property_address || "Property",
                dealType: lead.deal_type || "Deal",
            };

            for (const [key, value] of Object.entries(variables)) {
                body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
                subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
            }

            const html = generateHtmlEmail(lead, profile || {}, body);

            // 6. Send Email
            const fromName = profile?.name || 'DealFlow';
            const fromPrefix = profile?.name ? profile.name.toLowerCase().replace(/[^a-z0-9]/g, '.') : 'deals';
            const fromAddress = `${fromName} <${fromPrefix}@mastercleanhq.com>`;

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
                    html: html,
                    tags: [
                        { name: "campaign_id", value: sub.campaign_id },
                        { name: "lead_id", value: sub.lead_id },
                        { name: "step_id", value: step.id }
                    ]
                }),
            });

            if (!res.ok) {
                console.error(`Failed to send email for sub ${sub.id}`, await res.text());
                continue;
            }

            // 7. Update Subscription for NEXT step
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
                const nextRun = new Date();
                nextRun.setDate(nextRun.getDate() + (nextStep.delay_days || 0));
                updates.next_run_at = nextRun.toISOString();
            } else {
                updates.status = 'completed';
                updates.next_run_at = null;
            }

            await supabase.from('campaign_subscriptions').update(updates).eq('id', sub.id);
            results.push({ subId: sub.id, status: 'sent', step: nextStepOrder });

            // Log event
            await supabase.from('campaign_events').insert({
                campaign_id: sub.campaign_id,
                step_id: step.id,
                lead_id: sub.lead_id,
                type: 'sent',
                metadata: { automated: true }
            });
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
