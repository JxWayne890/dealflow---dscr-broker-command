import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req: Request) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const body = await req.json();
        const { to, subject, html, text } = body;

        const { data, error } = await resend.emails.send({
            from: 'The OfferHero <deals@theofferhero.com>',
            to: [to],
            subject,
            html,
            text,
        });

        if (error) {
            console.error('Resend API Error:', error);
            return new Response(JSON.stringify({ success: false, error: error.message }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export const config = {
    path: "/api/send-email"
};
