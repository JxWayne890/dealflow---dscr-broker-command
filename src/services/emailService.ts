import { Quote } from '../types';

export const sendQuoteEmail = async (quote: Quote, emailContent: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch('http://localhost:3001/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: quote.investorEmail,
                subject: `Deal Quote: ${quote.propertyState} - ${quote.dealType}`,
                html: emailContent.replace(/\n/g, '<br>'), // Simple newline to br conversion
                text: emailContent
            }),
        });

        const data = await response.json();
        return { success: data.success, error: data.error };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { success: false, error: "Network or Server Error" };
    }
};
