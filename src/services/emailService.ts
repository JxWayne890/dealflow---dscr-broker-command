import { Quote, BrokerProfile } from '../types';
import { supabase } from '../lib/supabase';

export const sendQuoteEmail = async (quote: Quote, emailContent: string, senderProfile?: BrokerProfile): Promise<{ success: boolean; error?: string }> => {
    try {
        // Create a safe prefix from the user's custom setting, or fall back to auto-generated from name
        let fromPrefix = 'deals'; // Default
        let fromName = 'The OfferHero';

        if (senderProfile) {
            fromName = senderProfile.name || fromName;
            // Use custom senderEmailPrefix if set, otherwise generate from name
            if (senderProfile.senderEmailPrefix) {
                fromPrefix = senderProfile.senderEmailPrefix;
            } else if (senderProfile.name) {
                fromPrefix = senderProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$|\.+$/g, '');
            }
        }

        const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
                to: quote.investorEmail,
                subject: `Deal Quote: ${quote.propertyState} - ${quote.dealType}`,
                html: emailContent,
                text: emailContent, // Consider removing this or stripping HTML if possible
                fromName,
                fromPrefix,
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
                fromName: 'The OfferHero Inquiry',
                fromPrefix: 'inquiries'
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
