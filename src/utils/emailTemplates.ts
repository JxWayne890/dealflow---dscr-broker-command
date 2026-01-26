import { Quote, BrokerProfile } from '../types';
import { calculateAmortizationSchedule } from './finance';
import { formatPhoneNumber } from './formatters';

export const generateHtmlEmail = (quoteInput: Partial<Quote> | Partial<Quote>[], profile: BrokerProfile, messageBody: string): string => {
  const quotes = Array.isArray(quoteInput) ? quoteInput : [quoteInput];
  const isComparison = quotes.length > 1;

  // Basic formatting for the message body (newlines to <br>)
  const bodyParagraphs = messageBody.split('\n').filter(line => line.trim()).map(line =>
    `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#374151;">${line}</p>`
  ).join('');

  const finalBody = bodyParagraphs || `<p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#374151;">Great connecting with you. Here is the quote for your scenario.</p>`;

  const renderQuoteBlock = (q: Partial<Quote>, index: number) => {
    return `
      <div style="margin-bottom: 32px; ${isComparison ? 'border-top: 2px solid #e5e7eb; padding-top: 24px;' : ''}">
        ${isComparison ? `<h2 style="margin:0 0 16px 0;color:#111827;font-size:18px;font-weight:700;">Option ${index + 1}: ${q.dealType || 'Loan Terms'}</h2>` : ''}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
          <tr>
            <td style="padding:24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" style="padding-bottom:16px;">
                    <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Loan Amount</div>
                    <div style="font-size:18px;font-weight:700;color:#111827;">$${q.loanAmount?.toLocaleString()}</div>
                  </td>
                  <td width="50%" style="padding-bottom:16px;">
                    <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">LTV</div>
                    <div style="font-size:18px;font-weight:700;color:#111827;">${q.ltv}%</div>
                  </td>
                </tr>
                <tr>
                  <td width="50%">
                    <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Interest Rate</div>
                    <div style="font-size:18px;font-weight:700;color:#111827;">${q.rate}%</div>
                  </td>
                  <td width="50%">
                    <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Term</div>
                    <div style="font-size:18px;font-weight:700;color:#111827;">${q.termYears}-Year ${q.rateType || 'Fixed'}</div>
                  </td>
                </tr>
                ${(q.monthlyPayment || q.closingFees || q.originationFee || q.uwFee) ? `
                <tr>
                  <td colspan="2" style="padding-top:16px;">
                    <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          ${q.monthlyPayment ? `
                          <td width="50%" valign="top" style="padding-bottom:12px;">
                            <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Monthly P&I</div>
                            <div style="font-size:18px;font-weight:700;color:#111827;">$${q.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </td>` : ''}
                          ${q.closingFees ? `
                          <td width="50%" valign="top" style="padding-bottom:12px;">
                            <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Est. Closing Fees</div>
                            <div style="font-size:18px;font-weight:700;color:#111827;">$${q.closingFees.toLocaleString()}</div>
                          </td>` : ''}
                        </tr>
                        ${(q.originationFee || q.uwFee || q.brokerFee) ? `
                        <tr>
                          ${q.originationFee ? `
                          <td width="33%" valign="top">
                            <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Lender Origination</div>
                            <div style="font-size:18px;font-weight:700;color:#111827;">$${q.originationFee.toLocaleString()}</div>
                          </td>` : ''}
                          ${q.uwFee ? `
                          <td width="33%" valign="top">
                            <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">UW Fee</div>
                            <div style="font-size:18px;font-weight:700;color:#111827;">$${q.uwFee.toLocaleString()}</div>
                          </td>` : ''}
                          ${q.brokerFee ? `
                            <td width="33%" valign="top">
                              <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Broker Fee</div>
                              <div style="font-size:18px;font-weight:700;color:#111827;">${q.brokerFeePercent ? `${q.brokerFeePercent}%` : `$${q.brokerFee.toLocaleString()}`}</div>
                            </td>` : ''}
                        </tr>` : ''}
                      </table>
                    </div>
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>
        </table>
        ${q.notes ? `<p style="margin:12px 0 0 0;font-size:14px;color:#4b5563;font-style:italic;">Note: ${q.notes}</p>` : ''}
      </div>
    `;
  };

  const firstQuote = quotes[0];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="margin:0;padding:0;font-family:Helvetica,Arial,sans-serif;background-color:#f3f4f6;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding:40px;">
              ${profile.logoUrl ? `<img src="${profile.logoUrl}" alt="${profile.name}" height="40" style="height:40px;display:block;" />` : `<div style="font-size:20px;font-weight:bold;color:#111827;">${profile.name}</div>`}

              <h1 style="margin:24px 0 12px 0;color:#111827;font-size:24px;font-weight:700;line-height:1.3;">
                ${isComparison ? 'Comparison of Loan Options' : `Quote for ${firstQuote.propertyAddress ? `${firstQuote.propertyAddress} (${firstQuote.propertyState})` : firstQuote.propertyState || 'Your Deal'} - ${firstQuote.dealType || 'Loan'}`}
              </h1>

              ${finalBody}

              ${quotes.map((q, i) => renderQuoteBlock(q, i)).join('')}

              <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;border:1px dashed #d1d5db;">
                <h3 style="margin:0 0 12px 0;font-size:16px;color:#111827;">Deal Overview</h3>
                <p style="margin:0 0 12px 0;font-size:14px;color:#4b5563;line-height:1.5;">
                  The first year of your loan will build approximately <strong>$${calculateAmortizationSchedule(firstQuote.loanAmount || 0, firstQuote.rate || 0, firstQuote.termYears || 30).slice(0, 12).reduce((acc, curr) => acc + curr.principal, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> in equity through principal paydown.
                </p>
              </div>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                ${profile.headshotUrl ? `
                  <td width="72" valign="top">
                    <img src="${profile.headshotUrl}"
                         alt="${profile.name}" width="60" height="60"
                         style="border-radius:50%;display:block;border:2px solid #e5e7eb;object-fit:cover;" />
                  </td>` : ''}
                  <td valign="top" style="${profile.headshotUrl ? 'padding-left:12px;' : ''}">
                    <div style="font-weight:700;color:#111827;font-size:16px;">${profile.name}</div>
                    <div style="color:#4b5563;font-size:14px;margin-top:2px;">${profile.title || 'Loan Broker'}</div>
                    ${profile.company ? `<div style="color:#4b5563;font-size:14px;margin-top:2px;">${profile.company}</div>` : ''}
                    <div style="color:#6b7280;font-size:14px;margin-top:6px;">
                      ${profile.phone ? `<a href="tel:${profile.phone.replace(/[^0-9+]/g, '')}" style="color:#6b7280;text-decoration:none;">${formatPhoneNumber(profile.phone)}</a>` : ''}
                      ${profile.phone && profile.website ? '&nbsp;&nbsp;|&nbsp;&nbsp;' : ''}
                      ${profile.website ? `<a href="${profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}" style="color:#6b7280;text-decoration:none;">${profile.website}</a>` : ''}
                    </div>
                  </td>
                </tr>
              </table>

              <div style="margin-top:24px;font-size:14px;color:#9ca3af;text-align:center;line-height:1.5;">
                © ${new Date().getFullYear()} ${profile.company || profile.name}. All rights reserved.<br />
                Rates and terms subject to change based on market conditions. Quote based on ${firstQuote.creditScore ? `<strong>${firstQuote.creditScore}</strong>` : '_____'} credit score.
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const generatePlainText = (quoteInput: Partial<Quote> | Partial<Quote>[], profile: BrokerProfile, messageBody: string): string => {
  const quotes = Array.isArray(quoteInput) ? quoteInput : [quoteInput];
  const isComparison = quotes.length > 1;

  const quoteSummaries = quotes.map((q, i) => {
    return `
${isComparison ? `OPTION ${i + 1}:` : 'DEAL TERMS:'}
- Loan Amount: $${q.loanAmount?.toLocaleString()}
- LTV: ${q.ltv}%
- Rate: ${q.rate}%
- Term: ${q.termYears} Years (${q.rateType || 'Fixed'})
${q.monthlyPayment ? `- Monthly P&I: $${q.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` : ''}${q.originationFee ? `- Lender Origination: $${q.originationFee.toLocaleString()}\n` : ''}${q.uwFee ? `- UW Fee: $${q.uwFee.toLocaleString()}\n` : ''}${q.brokerFee ? `- Broker Fee: ${q.brokerFeePercent ? `${q.brokerFeePercent}%` : `$${q.brokerFee.toLocaleString()}`}\n` : ''}${q.closingFees ? `- Est. Closing Fees: $${q.closingFees.toLocaleString()}\n` : ''}${q.notes ? `- Notes: ${q.notes}\n` : ''}`;
  }).join('\n----------------------------------------\n');

  return `Subject: ${isComparison ? 'DSCR Loan Comparison' : `DSCR Loan Quote - ${quotes[0].propertyAddress ? `${quotes[0].propertyAddress} (${quotes[0].propertyState})` : quotes[0].propertyState || 'Property'}`}

${messageBody}

----------------------------------------
${quoteSummaries}
----------------------------------------

*Full 30-year amortization schedule is available upon request.
Let me know if these terms work for you.

Best,
${profile.name}
${profile.title}
${profile.phone ? formatPhoneNumber(profile.phone) : ''}
${profile.website || ''}

Rates and terms subject to change based on market conditions. Quote based on ${quotes[0].creditScore || '_____'} credit score.
`;
};

