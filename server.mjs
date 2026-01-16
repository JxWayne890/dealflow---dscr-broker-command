import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';

const app = express();
const port = 3002;

// Reverting to the hardcoded key that was working before
const resend = new Resend('re_59HGkUtF_64myzv2Pa6K8GYT2SMUFCDeb');

app.use(cors());
app.use(express.json());

app.post('/api/send-email', async (req, res) => {
  const { to, subject, html, text, fromName, fromPrefix } = req.body;

  // Default to 'DealFlow' and 'deals' if not provided
  const safeName = fromName || 'DealFlow';
  const safePrefix = fromPrefix || 'deals';
  const fromAddress = `${safeName} <${safePrefix}@mastercleanhq.com>`;

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
