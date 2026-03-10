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

// Helper for professional HTML (Ported and enhanced from emailTemplates.ts)
const generateHtmlEmail = (quotes: any[], profile: any, messageBody: string) => {
  const isComparison = quotes.length > 1;
  const firstQuote = quotes[0];

  const bodyParagraphs = (messageBody || '').split('\n').filter(line => line.trim()).map(line =>
    `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#374151;">${line}</p>`
  ).join('');
  const finalBody = bodyParagraphs || `<p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#374151;">Great connecting with you. Here are the latest terms for your scenario.</p>`;

  const renderQuoteBlock = (quote: any, index: number) => {
    const schedule = calculateAmortizationSchedule(quote.loan_amount || 0, quote.rate || 0, quote.term_years || 30);
    const firstYearPrincipal = schedule.slice(0, 12).reduce((acc, curr) => acc + curr.principal, 0);

    return `
      <div style="margin-bottom: 32px; ${isComparison ? 'border-top: 2px solid #e5e7eb; padding-top: 24px;' : ''}">
        ${isComparison ? `<h2 style="margin:0 0 16px 0;color:#111827;font-size:18px;font-weight:700;">Option ${index + 1}: ${quote.deal_type || 'Loan Terms'}</h2>` : ''}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:12px;">
          <tr>
            <td style="padding:24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
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
              </table>
            </td>
          </tr>
        </table>
        
        <div style="background:linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);border:1px solid #a7f3d0;border-radius:8px;padding:14px 18px;margin-top:12px;">
          <span style="font-size:14px;color:#166534;">📈 Year 1 equity build: <strong style="color:#15803d;">$${firstYearPrincipal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></span>
        </div>
      </div>
    `;
  };

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;font-family:Helvetica,Arial,sans-serif;background-color:#f3f4f6;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
    <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
          <tr><td style="padding:40px;">
              ${profile.logo_url ? `<img src="${profile.logo_url}" alt="${profile.name}" height="40" style="height:40px;display:block;" />` : `<div style="font-size:20px;font-weight:bold;color:#111827;">${profile.name || 'The OfferHero'}</div>`}
              
              <h1 style="margin:24px 0 12px 0;color:#111827;font-size:24px;font-weight:700;line-height:1.3;">
                ${isComparison ? 'Comparison of Loan Options' : `Updated Quote: ${firstQuote.property_address ? `${firstQuote.property_address} (${firstQuote.property_state})` : firstQuote.property_state || 'Your Deal'}`}
              </h1>

              ${firstQuote.property_address ? `
              <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px;border:1px solid #e2e8f0;">
                <div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600;letter-spacing:0.5px;margin-bottom:6px;">Subject Property</div>
                <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:4px;">${firstQuote.property_address}</div>
                <div style="font-size:14px;color:#475569;">${[firstQuote.property_city, firstQuote.property_state, firstQuote.property_zip].filter(Boolean).join(', ')}</div>
              </div>
              ` : ''}

              ${finalBody}
              
              ${quotes.map((q, i) => renderQuoteBlock(q, i)).join('')}

              <div style="font-size:13px;color:#6b7280;text-align:center;margin-top:32px;">
                <a href="${Deno.env.get("BASE_URL") || "https://theofferhero.com"}/?view=schedule&quoteId=${firstQuote.id}" style="display:inline-block;padding:12px 32px;background:#4f46e5;border-radius:8px;color:#ffffff;font-weight:700;text-decoration:none;box-shadow:0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                  View Full Interactive Schedule
                </a>
              </div>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;" />
              
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
              
              <div style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;line-height:1.5;">
                © ${new Date().getFullYear()} ${profile.company || profile.name || 'The OfferHero'}. All rights reserved.<br />
                Rates and terms subject to change based on market conditions.
              </div>
            </td></tr>
        </table>
      </td></tr>
  </table>
</body>
</html>`;
};


const calculateNextRunAt = (delayDays: number, preferredTime: string = '09:00', timezone: string = 'UTC'): string => {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + (delayDays || 0));

  const [hours, minutes] = (preferredTime || '09:00').split(':').map(Number);

  try {
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    const localString = `${year}-${month}-${day}T${h}:${m}:00`;

    let target = new Date(`${localString}Z`);
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
    return new Date(target.getTime() + diff).toISOString();
  } catch (e) {
    nextDate.setUTCHours(hours, minutes, 0, 0);
    return nextDate.toISOString();
  }
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
                campaigns ( name, user_id, preferred_run_time )
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

    for (const sub of (subscriptions as any[])) {
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

      // 2b. Fetch Comparison Quotes
      const { data: comparisons } = await supabase
        .from('quotes')
        .select('*')
        .eq('parent_quote_id', sub.lead_id);

      const allQuotes = [lead, ...(comparisons || [])];

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
        senderName: profile?.name || "",
        companyName: profile?.company || ""
      };

      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        body = body.replace(regex, value);
        subject = subject.replace(regex, value);
      }

      const html = generateHtmlEmail(allQuotes, profile || {}, body);

      // 6. Send Email
      const fromName = profile?.name || 'The OfferHero';
      // Use custom sender_email_prefix if set, otherwise generate from name
      const fromPrefix = profile?.sender_email_prefix || (profile?.name ? profile.name.toLowerCase().replace(/[^a-z0-9]/g, '.') : 'deals');
      const fromAddress = `${fromName} <${fromPrefix}@theofferhero.com>`;

      const emailPayload = {
        from: fromAddress,
        to: [lead.investor_email],
        subject: subject,
        html: html,
        tags: [
          { name: "campaign_id", value: sub.campaign_id },
          { name: "lead_id", value: sub.lead_id },
          { name: "step_id", value: step.id }
        ]
      };

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(emailPayload),
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
        const nextRun = calculateNextRunAt(
          nextStep.delay_days,
          sub.campaigns.preferred_run_time || '09:00',
          profile?.timezone || 'UTC'
        );
        updates.next_run_at = nextRun;
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
