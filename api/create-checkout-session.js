import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

    try {
        const { interval = 'month' } = req.body;
        const amount = interval === 'year' ? 250000 : 25000;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `The OfferHero - Elite Producer (${interval === 'year' ? 'Annual' : 'Monthly'})`,
                            description: 'Full access to the DSCR Broker Command platform with automated nurture, instant quotes, and analytics.',
                        },
                        unit_amount: amount,
                        recurring: {
                            interval: interval,
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/pricing`,
        });

        return res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Stripe Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
