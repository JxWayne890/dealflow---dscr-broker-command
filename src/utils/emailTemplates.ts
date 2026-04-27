import { Quote, BrokerProfile } from '../types';
import { calculateAmortizationSchedule } from './finance';
import { formatPhoneNumber } from './formatters';

// Designed to look like an email a person typed in Gmail/Outlook, not a
// marketing automation. Heavy card layouts, branded headers, and copyright
// footers reliably push Gmail to classify mail as Promotions instead of
// Primary. Plain paragraphs + a small inline term list keeps it transactional.
export const generateHtmlEmail = (quoteInput: Partial<Quote> | Partial<Quote>[], profile: BrokerProfile, messageBody: string): string => {
  const quotes = Array.isArray(quoteInput) ? quoteInput : [quoteInput];
  const isComparison = quotes.length > 1;

  const escape = (s: string | undefined | null) =>
    String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

  const bodyParagraphs = (messageBody || '')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => `<p style="margin:0 0 12px 0;">${escape(line)}</p>`)
    .join('');

  const intro = bodyParagraphs || `<p style="margin:0 0 12px 0;">Here are the terms for your scenario.</p>`;

  const fmtMoney = (n?: number) => (n ?? 0).toLocaleString();
  const fmtMoney2 = (n?: number) =>
    (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const renderQuote = (q: Partial<Quote>, index: number) => {
    const equityBuild = calculateAmortizationSchedule(q.loanAmount || 0, q.rate || 0, q.termYears || 30)
      .slice(0, 12)
      .reduce((acc, curr) => acc + curr.principal, 0);

    const lines: string[] = [];
    lines.push(`<li>Loan amount: $${fmtMoney(q.loanAmount)}</li>`);
    lines.push(`<li>Rate: ${q.rate}% (${q.termYears || 30}-year ${q.rateType || 'fixed'})</li>`);
    lines.push(`<li>LTV: ${q.ltv}%</li>`);
    if (q.monthlyPayment) lines.push(`<li>Monthly P&amp;I: $${fmtMoney2(q.monthlyPayment)}</li>`);
    if (q.originationFee) {
      const orig = q.originationFeePercent ? `${q.originationFeePercent}%` : `$${fmtMoney(q.originationFee)}`;
      lines.push(`<li>Lender origination: ${orig}</li>`);
    }
    if (q.uwFee) lines.push(`<li>UW fee: $${fmtMoney(q.uwFee)}</li>`);
    if (q.brokerFee) {
      const brk = q.brokerFeePercent ? `${q.brokerFeePercent}%` : `$${fmtMoney(q.brokerFee)}`;
      lines.push(`<li>Broker fee: ${brk}</li>`);
    }
    if (q.closingFees) lines.push(`<li>Estimated closing fees: $${fmtMoney(q.closingFees)}</li>`);
    if (q.lenderCode) lines.push(`<li>Lender code: #${escape(q.lenderCode.toUpperCase())}</li>`);

    const heading = isComparison
      ? `<p style="margin:16px 0 6px 0;"><strong>Option ${index + 1}${q.dealType ? ` — ${escape(q.dealType)}` : ''}</strong></p>`
      : '';

    const equityNote = equityBuild > 0
      ? `<p style="margin:8px 0 0 0;">First year would build roughly <strong>$${equityBuild.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> in equity through principal paydown.</p>`
      : '';

    const note = q.notes ? `<p style="margin:8px 0 0 0;color:#555;"><em>Note: ${escape(q.notes)}</em></p>` : '';

    return `${heading}<ul style="margin:0 0 4px 0;padding-left:20px;">${lines.join('')}</ul>${equityNote}${note}`;
  };

  const firstQuote = quotes[0] || {};
  const propertyLine = firstQuote.propertyAddress
    ? `<p style="margin:0 0 12px 0;"><strong>Property:</strong> ${escape(firstQuote.propertyAddress)}${
        [firstQuote.propertyCity, firstQuote.propertyState, firstQuote.propertyZip].filter(Boolean).length
          ? `, ${escape([firstQuote.propertyCity, firstQuote.propertyState, firstQuote.propertyZip].filter(Boolean).join(', '))}`
          : ''
      }</p>`
    : '';

  const sigLines: string[] = [];
  sigLines.push(escape(profile.name || ''));
  if (profile.title) sigLines.push(escape(profile.title));
  if (profile.company) sigLines.push(escape(profile.company));
  const contactBits: string[] = [];
  if (profile.phone) contactBits.push(escape(formatPhoneNumber(profile.phone)));
  if (profile.website) {
    const w = profile.website.startsWith('http') ? profile.website : `https://${profile.website}`;
    contactBits.push(`<a href="${escape(w)}" style="color:#1a56db;">${escape(profile.website)}</a>`);
  }
  if (contactBits.length) sigLines.push(contactBits.join(' &middot; '));

  const signature = `<p style="margin:16px 0 0 0;">Best,<br>${sigLines.join('<br>')}</p>`;

  const closing = `<p style="margin:16px 0 0 0;">Let me know if these terms work or if you'd like to adjust anything.</p>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222;">
${intro}
${propertyLine}
${quotes.map(renderQuote).join('')}
${closing}
${signature}
</body></html>`;
};

export const generatePlainText = (quoteInput: Partial<Quote> | Partial<Quote>[], profile: BrokerProfile, messageBody: string): string => {
  const quotes = Array.isArray(quoteInput) ? quoteInput : [quoteInput];
  const isComparison = quotes.length > 1;

  const quoteSummaries = quotes.map((q, i) => {
    return `
${isComparison ? `OPTION ${i + 1}:` : 'DEAL TERMS:'}
- Type: ${q.dealType || 'Purchase'}
- Loan Amount: $${q.loanAmount?.toLocaleString()}
- LTV: ${q.ltv}%
- Rate: ${q.rate}%
- Term: ${q.termYears} Years (${q.rateType || 'Fixed'})
${q.lenderCode ? `- Lender Code: #${q.lenderCode.toUpperCase()}\n` : ''}${q.monthlyPayment ? `- Monthly P&I: $${q.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` : ''}${q.originationFee ? `- Lender Origination: ${q.originationFeePercent ? `${q.originationFeePercent}%` : `$${q.originationFee.toLocaleString()}`}\n` : ''}${q.uwFee ? `- UW Fee: $${q.uwFee.toLocaleString()}\n` : ''}${q.brokerFee ? `- Broker Fee: ${q.brokerFeePercent ? `${q.brokerFeePercent}%` : `$${q.brokerFee.toLocaleString()}`}\n` : ''}${q.closingFees ? `- Est. Closing Fees: $${q.closingFees.toLocaleString()}\n` : ''}${q.notes ? `- Notes: ${q.notes}\n` : ''}`;
  }).join('\n----------------------------------------\n');

  return `${messageBody}

${quoteSummaries}

Let me know if these terms work for you.

Best,
${profile.name}
${profile.title || ''}
${profile.phone ? formatPhoneNumber(profile.phone) : ''}
${profile.website || ''}
`;
};
