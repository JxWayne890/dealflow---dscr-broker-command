import { Quote, BrokerProfile } from '../types';
import { supabase } from '../lib/supabase';

export const sendQuoteEmail = async (quote: Quote, emailContent: string, senderProfile?: BrokerProfile): Promise<{ success: boolean; error?: string }> => {
    try {
        // Create a safe prefix from the user's name (e.g. "John Johnson" -> "john.johnson")
        // Remove special chars, lower case, replace spaces with dots
        let fromPrefix = 'deals'; // Default
        let fromName = 'DealFlow';

        if (senderProfile?.name) {
            fromName = senderProfile.name;
            fromPrefix = senderProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.+$/g, '');
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

        // Resend returns an ID like { id: "..." }
        if (data?.id) {
            return { success: true };
        } else if (data?.error) {
            console.error("Resend API Error (via Cloud):", data.error);
            return { success: false, error: `Email Service Error: ${JSON.stringify(data.error)}` };
        }

        return { success: true }; // Fallback

    } catch (error: any) {
        console.error("Failed to invoke send-email:", error);
        return { success: false, error: "Network/Connection Error" };
    }
};
