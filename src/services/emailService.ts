import { Quote, BrokerProfile } from '../types';
import { supabase } from '../lib/supabase';

export const sendQuoteEmail = async (quote: Quote, emailContent: string, senderProfile?: BrokerProfile): Promise<{ success: boolean; error?: string }> => {
    try {
        // Single fixed mailbox; broker identity stays in display name only.
        const fromName = senderProfile?.name || 'The OfferHero';
        const replyTo = senderProfile?.email;

        // Conversational subject — avoids "Deal" / generic marketing patterns that
        // push Gmail to classify as Promotions instead of Primary.
        const subjectTarget = quote.propertyAddress || quote.propertyState || 'your scenario';
        const subject = `Quote for ${subjectTarget}`;

        const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
                to: quote.investorEmail,
                subject,
                html: emailContent,
                text: emailContent, // Consider removing this or stripping HTML if possible
                fromName,
                replyTo,
                quoteId: quote.id // IMPORTANT: Pass ID for webhook tracking
            }
        });

        if (error) {
            console.error("Supabase Function Error:", error);
            // Friendly error handling
            if (error.message?.includes('functions_client_error')) {
                return { success: false, error: "Cloud Function Error. Is the function deployed?" };
            }
            return { success: false, error: error.message || "Unknown Cloud Error" };
        }
        // New format: edge function always returns 200 with success/error in body
        console.log('[EMAIL DEBUG] Response data:', data);

        if (data?.success === true) {
            return { success: true };
        } else if (data?.error) {
            console.error("Resend API Error (via Cloud):", data.error);
            const errorMsg = data.error?.message || data.error?.name || JSON.stringify(data.error);
            return { success: false, error: `Email Service Error: ${errorMsg}` };
        }

        // Fallback for old format (if data has id)
        if (data?.id) {
            return { success: true };
        }

        return { success: false, error: "Unknown response from email service" };

    } catch (error: any) {
        console.error("Failed to invoke send-email:", error);
        return { success: false, error: "Network/Connection Error" };
    }
};

export const sendInquiryEmail = async (data: { name: string, email: string, phone: string, contactTime: string, inquiryType: string }): Promise<{ success: boolean; error?: string }> => {
    try {
        const html = `
            <h2>New License Inquiry</h2>
            <p><strong>Inquiry Type:</strong> ${data.inquiryType}</p>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
            <p><strong>Best Time to Contact:</strong> ${data.contactTime}</p>
            <hr />
            <p>Sent from The OfferHero Inquiry Page</p>
        `;

        const { error } = await supabase.functions.invoke('send-email', {
            body: {
                to: 'theprovidersystem@gmail.com',
                subject: `New Inquiry (${data.inquiryType}): ${data.name}`,
                html: html,
                text: `New Inquiry (${data.inquiryType}) from ${data.name}. Phone: ${data.phone}. Email: ${data.email}. Best Time: ${data.contactTime}`,
                fromName: 'The OfferHero Inquiry'
            }
        });

        if (error) {
            console.error("Supabase Function Error:", error);
            return { success: false, error: error.message || "Failed to send email" };
        }

        return { success: true };

    } catch (error: any) {
        console.error("Failed to send inquiry:", error);
        return { success: false, error: "Network/Connection Error" };
    }
};
