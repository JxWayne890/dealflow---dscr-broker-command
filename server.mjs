import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3002;

// Robust initialization - don't crash if keys are missing
const resendKey = process.env.RESEND_API_KEY;
if (!resendKey) {
  console.warn("WARNING: RESEND_API_KEY is missing from environment variables. Email routes will fail.");
}
const resend = resendKey ? new Resend(resendKey) : null;
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("CRITICAL ERROR: STRIPE_SECRET_KEY is missing from environment variables.");
  // Don't crash immediately to allow other routes to work, but Stripe routes will fail.
}
const stripe = stripeKey ? new Stripe(stripeKey) : null;

app.use(cors());
app.use(express.json());

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      throw new Error("Stripe is not configured on the server. Missing STRIPE_SECRET_KEY.");
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'The OfferHero - Elite Producer Plan',
              description: 'Full access to the DSCR Broker Command platform with automated nurture, instant quotes, and analytics.',
            },
            unit_amount: 25000, // $250.00
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/send-email', async (req, res) => {
  const { to, subject, html, text, fromName, fromPrefix } = req.body;

  // Default to 'DealFlow' and 'deals' if not provided
  const safeName = fromName || 'DealFlow';
  const safePrefix = fromPrefix || 'deals';
  const fromAddress = `${safeName} <${safePrefix}@theofferhero.com>`;

  console.log('--- EMAIL SEND ATTEMPT ---');
  console.log(`FROM: ${fromAddress}`);
  console.log('TO:', to);

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return res.status(403).json({ success: false, error: error.message });
    }

    console.log('Email sent successfully:', data);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Catch Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Email server running at http://127.0.0.1:${port}`);
});
