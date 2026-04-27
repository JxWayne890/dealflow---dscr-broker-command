import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

const confirmationPage = (ok: boolean) => `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>${ok ? 'Unsubscribed' : 'Unsubscribe'}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body{margin:0;padding:48px 16px;font-family:Helvetica,Arial,sans-serif;background:#f3f4f6;color:#1f2937;}
  .card{max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);text-align:center;}
  h1{font-size:22px;margin:0 0 12px 0;color:#111827;}
  p{font-size:15px;line-height:1.6;color:#4b5563;margin:0;}
</style></head>
<body><div class="card">
  <h1>${ok ? "You've been unsubscribed" : 'Unable to unsubscribe'}</h1>
  <p>${ok ? "You won't receive further emails from this campaign. If this was a mistake, contact the sender directly." : 'This unsubscribe link is invalid or has already been used.'}</p>
</div></body></html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response(confirmationPage(false), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const { data: sub, error: fetchError } = await supabase
    .from("campaign_subscriptions")
    .select("id, lead_id, campaign_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !sub) {
    if (req.method === "POST") {
      return new Response(JSON.stringify({ ok: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(confirmationPage(false), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const { error: deleteError } = await supabase
    .from("campaign_subscriptions")
    .delete()
    .eq("id", id);

  if (!deleteError) {
    await supabase.from("campaign_events").insert({
      campaign_id: sub.campaign_id,
      lead_id: sub.lead_id,
      type: "complained",
      metadata: { source: "list_unsubscribe" },
    });
  }

  if (req.method === "POST") {
    return new Response(JSON.stringify({ ok: !deleteError }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(confirmationPage(!deleteError), {
    status: deleteError ? 500 : 200,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
});
