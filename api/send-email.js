import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, subject, html, text, fromName = 'DealFlow', fromPrefix = 'deals' } = req.body;

    if (!to || !subject) {
        return res.status(400).json({ error: 'Missing required fields: to, subject' });
    }

    const fromAddress = `${fromName} <${fromPrefix}@theofferhero.com>`;

    try {
        const { data, error } = await resend.emails.send({
            from: fromAddress,
            to: [to],
            subject,
            html: html || text,
            text: text || html,
        });

        if (error) {
            console.error('Resend API Error:', error);
            return res.status(400).json({ success: false, error: error.message });
        }

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
