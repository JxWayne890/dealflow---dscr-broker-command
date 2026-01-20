
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
    to: string;
    subject: string;
    html: string;
    text: string;
    fromName?: string;
    fromPrefix?: string;
    quoteId?: string; // For tracking
}

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { to, subject, html, text, fromName = "The OfferHero", fromPrefix = "deals", quoteId }: EmailRequest = await req.json();

        if (!RESEND_API_KEY) {
            throw new Error("Missing RESEND_API_KEY");
        }

        // Construct "From" address
        // e.g. "John Doe <john.doe@theofferhero.com>"
        // NOTE: This domain must be verified in Resend.
        const fromAddress = `${fromName} <${fromPrefix}@theofferhero.com>`;

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: fromAddress,
                to: [to], // Resend expects an array or string
                subject: subject,
                html: html,
                text: text,
                tags: quoteId ? [{ name: "quote_id", value: quoteId }] : undefined,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Resend API Error:", data);
            return new Response(JSON.stringify({ error: data }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
