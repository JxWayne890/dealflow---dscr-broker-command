import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';

const app = express();
const port = 3001;

// Initialize Resend with the user provided key
const resend = new Resend('re_59HGkUtF_64myzv2Pa6K8GYT2SMUFCDeb');

app.use(cors());
app.use(express.json());

app.post('/api/send-email', async (req, res) => {
  const { to, subject, html, text } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'DealFlow <deals@mastercleanhq.com>',
      to: [to], // Resend only allows sending to your own email during testing unless you verify a domain
      subject,
      html,
      text,
    });

    console.log('Email sent successfully:', data);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Email server running at http://localhost:${port}`);
});
