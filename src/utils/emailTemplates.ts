import { Quote, BrokerProfile } from '../types';
import { calculateAmortizationSchedule } from './finance';
import { formatPhoneNumber } from './formatters';

export const generateHtmlEmail = (quote: Partial<Quote>, profile: BrokerProfile, messageBody: string): string => {
  // Basic formatting for the message body (newlines to <br>)
  // The user asked for NO <br> tags except where needed.
  // We'll wrap paragraphs in <p> labels if possible, but simplest is to just use the one block for now.
  // The user's mock uses a <p> tag for the body.
  // Let's wrap the messageBody in a p tag style.

  // We need to be careful with newlines. If messageBody has newlines, we might need <br> inside the p?
  // User said: "DO NOT add <br> tags for spacing except where explicitly needed." && "Use margin and padding instead of <br>"
  // But for the user's *input text*, <br> is the only way to show line breaks within a single text block unless we split by newline and make multiple <p>s.
  // I will stick to the previous safe replace for the body text itself, or split into paragraphs if I want to be fancy.
  // For safety and strict adherence to "clean", let's split into paragraphs.
  const bodyParagraphs = messageBody.split('\n').filter(line => line.trim()).map(line =>
    `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#374151;">${line}</p>`
  ).join('');

  // If no body, use a default <p> to avoid breaking layout? Or just empty.
  const finalBody = bodyParagraphs || `<p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#374151;">Great connecting with you. Here is the quote for your scenario.</p>`;

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
                Quote for ${quote.propertyAddress ? `${quote.propertyAddress} (${quote.propertyState})` : quote.propertyState || 'Your Deal'} - ${quote.dealType || 'Loan'}
              </h1>

              ${finalBody}

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
                <tr>
                  <td style="padding:24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" style="padding-bottom:16px;">
                          <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Loan Amount</div>
                          <div style="font-size:18px;font-weight:700;color:#111827;">$${quote.loanAmount?.toLocaleString()}</div>
                        </td>
                        <td width="50%" style="padding-bottom:16px;">
                          <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">LTV</div>
                          <div style="font-size:18px;font-weight:700;color:#111827;">${quote.ltv}%</div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%">
                          <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Interest Rate</div>
                          <div style="font-size:18px;font-weight:700;color:#111827;">${quote.rate}%</div>
                        </td>
                        <td width="50%">
                          <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Term</div>
                          <div style="font-size:18px;font-weight:700;color:#111827;">${quote.termYears}-Year ${quote.rateType || 'Fixed'}</div>
                        </td>
                      </tr>
                      ${(quote.monthlyPayment || quote.closingFees || quote.originationFee || quote.uwFee) ? `
                      <tr>
                        <td colspan="2" style="padding-top:16px;">
                          <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                ${quote.monthlyPayment ? `
                                <td width="50%" valign="top" style="padding-bottom:12px;">
                                  <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Monthly P&I</div>
                                  <div style="font-size:18px;font-weight:700;color:#111827;">$${quote.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                </td>` : ''}
                                ${quote.closingFees ? `
                                <td width="50%" valign="top" style="padding-bottom:12px;">
                                  <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Est. Closing Fees</div>
                                  <div style="font-size:18px;font-weight:700;color:#111827;">$${quote.closingFees.toLocaleString()}</div>
                                </td>` : ''}
                              </tr>
                              ${(quote.originationFee || quote.uwFee || quote.brokerFee) ? `
                              <tr>
                                ${quote.originationFee ? `
                                <td width="33%" valign="top">
                                  <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Lender Origination</div>
                                  <div style="font-size:18px;font-weight:700;color:#111827;">$${quote.originationFee.toLocaleString()}</div>
                                </td>` : ''}
                                ${quote.uwFee ? `
                                <td width="33%" valign="top">
                                  <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">UW Fee</div>
                                  <div style="font-size:18px;font-weight:700;color:#111827;">$${quote.uwFee.toLocaleString()}</div>
                                </td>` : ''}
                                  <td width="33%" valign="top">
                                    <div style="font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:4px;">Broker Fee</div>
                                    <div style="font-size:18px;font-weight:700;color:#111827;">${quote.brokerFeePercent ? `${quote.brokerFeePercent}%` : `$${quote.brokerFee.toLocaleString()}`}</div>
                                  </td>` : ''}
                              </tr>` : ''}
                            </table>
                          </div>
                        </td>
                      </tr>` : ''
}
</table>
  </td>
  </tr>
  </table>
  < div style = "background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;border:1px dashed #d1d5db;" >
    <h3 style="margin:0 0 12px 0;font-size:16px;color:#111827;" > Amortization Highlights </h3>
      < p style = "margin:0 0 12px 0;font-size:14px;color:#4b5563;line-height:1.5;" >
        The first year of your loan will build approximately < strong > $${ calculateAmortizationSchedule(quote.loanAmount || 0, quote.rate || 0, quote.termYears || 30).slice(0, 12).reduce((acc, curr) => acc + curr.principal, 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) } </strong> in equity through principal paydown.
          </p>
          < div style = "font-size:13px;color:#6b7280;text-align:center;" >

            </div>
            </div>

            < hr style = "border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

              <table role="presentation" width = "100%" cellpadding = "0" cellspacing = "0" border = "0" >
                <tr>
                ${
  profile.headshotUrl ? `
                  <td width="72" valign="top">
                    <img src="${profile.headshotUrl}"
                         alt="${profile.name}" width="60" height="60"
                         style="border-radius:50%;display:block;border:2px solid #e5e7eb;object-fit:cover;" />
                  </td>` : ''
}
<td valign="top" style = "${profile.headshotUrl ? 'padding-left:12px;' : ''}" >
  <div style="font-weight:700;color:#111827;font-size:16px;" > ${ profile.name } </div>
    < div style = "color:#4b5563;font-size:14px;margin-top:2px;" > ${ profile.title || 'Loan Broker' } </div>
                      ${ profile.company ? `<div style="color:#4b5563;font-size:14px;margin-top:2px;">${profile.company}</div>` : '' }
<div style="color:#6b7280;font-size:14px;margin-top:6px;" >
  ${ profile.phone ? `<a href="tel:${profile.phone.replace(/[^0-9+]/g, '')}" style="color:#6b7280;text-decoration:none;">${formatPhoneNumber(profile.phone)}</a>` : '' }
                        ${ profile.phone && profile.website ? '&nbsp;&nbsp;|&nbsp;&nbsp;' : '' }
                        ${ profile.website ? `<a href="${profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}" style="color:#6b7280;text-decoration:none;">${profile.website}</a>` : '' }
</div>
  </td>
  </tr>
  </table>

  < div style = "margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;line-height:1.5;" >
                © ${ new Date().getFullYear() } ${ profile.company || profile.name }. All rights reserved.< br />
  Rates and terms subject to change based on market conditions.Quote based on _____ credit score.
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

export const generatePlainText = (quote: Partial<Quote>, profile: BrokerProfile, messageBody: string): string => {
  return `Subject: DSCR Loan Quote - ${quote.propertyAddress ? `${quote.propertyAddress} (${quote.propertyState})` : quote.propertyState || 'Property'}

${messageBody}

----------------------------------------
DEAL TERMS:
- Loan Amount: $${quote.loanAmount?.toLocaleString()}
- LTV: ${quote.ltv}%
- Rate: ${quote.rate}%
- Term: ${quote.termYears} Years (${quote.rateType || 'Fixed'})
${quote.monthlyPayment ? `- Monthly P&I: $${quote.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` : ''}${quote.originationFee ? `- Lender Origination: $${quote.originationFee.toLocaleString()}\n` : ''}${quote.uwFee ? `- UW Fee: $${quote.uwFee.toLocaleString()}\n` : ''}${quote.brokerFee ? `- Broker Fee: ${quote.brokerFeePercent ? `${quote.brokerFeePercent}%` : `$${quote.brokerFee.toLocaleString()}`}\n` : ''}${quote.closingFees ? `- Est. Closing Fees: $${quote.closingFees.toLocaleString()}\n` : ''}----------------------------------------

----------------------------------------

*Full 30-year amortization schedule is available upon request.
Let me know if these terms work for you.

Best,
${profile.name}
${profile.title}
${profile.phone ? formatPhoneNumber(profile.phone) : ''}
${profile.website || ''}

Rates and terms subject to change based on market conditions. Quote based on _____ credit score.
`;
};
