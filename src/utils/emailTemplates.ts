import { Quote, BrokerProfile } from '../types';

export const generateHtmlEmail = (quote: Partial<Quote>, profile: BrokerProfile, messageBody: string): string => {
    // Basic formatting for the message body (newlines to <br>)
    const formattedBody = messageBody.replace(/\n/g, '<br>');

    // Default placeholders if profile is missing bits (though UI ensures defaults)
    const logoSection = profile.logoUrl
        ? `<div style="margin-bottom: 24px;"><img src="${profile.logoUrl}" alt="${profile.name}" height="40" style="height: 40px; display: block;"></div>`
        : `<div style="margin-bottom: 24px; font-size: 20px; font-weight: bold; color: #333;">${profile.name}</div>`;

    const headshotSection = profile.headshotUrl
        ? `<img src="${profile.headshotUrl}" alt="${profile.name}" width="60" height="60" style="border-radius: 50%; width: 60px; height: 60px; object-fit: cover; border: 2px solid #e5e7eb;">`
        : '';

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; margin-top: 32px; margin-bottom: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        ${logoSection}

        <!-- Hero / Subject Context -->
        <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin-bottom: 24px; line-height: 1.3;">
            Quote for ${quote.propertyAddress ? `${quote.propertyAddress} (${quote.propertyState})` : quote.propertyState || 'Your Deal'} - ${quote.dealType || 'Loan'}
        </h1>

        <!-- Custom Message Body -->
        <div style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 32px;">
            ${formattedBody}
        </div>

        <!-- Deal Terms Grid -->
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td width="50%" style="padding-bottom: 16px;">
                        <div style="font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 4px;">Loan Amount</div>
                        <div style="font-size: 18px; font-weight: 700; color: #111827;">$${quote.loanAmount?.toLocaleString()}</div>
                    </td>
                    <td width="50%" style="padding-bottom: 16px;">
                        <div style="font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 4px;">LTV</div>
                        <div style="font-size: 18px; font-weight: 700; color: #111827;">${quote.ltv}%</div>
                    </td>
                </tr>
                <tr>
                    <td width="50%">
                        <div style="font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 4px;">Interest Rate</div>
                        <div style="font-size: 18px; font-weight: 700; color: #111827;">${quote.rate}%</div>
                    </td>
                    <td width="50%">
                        <div style="font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 4px;">Term</div>
                        <div style="font-size: 18px; font-weight: 700; color: #111827;">${quote.termYears} Years</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Call to Action Button -->
        <div style="text-align: center; margin-bottom: 32px;">
            <a href="mailto:${profile.email}?subject=Re: Deal Quote" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                Reply to Lock Rate
            </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 32px;">

        <!-- Footer / Signature -->
        <div style="display: flex; align-items: center; gap: 16px;">
            ${headshotSection}
            <div style="margin-left: ${profile.headshotUrl ? '16px' : '0'};">
                <div style="font-weight: 700; color: #111827; font-size: 16px;">${profile.name}</div>
                <div style="color: #4b5563; font-size: 14px;">${profile.title || 'Loan Broker'}</div>
                <div style="color: #6b7280; font-size: 14px; margin-top: 4px;">
                    ${profile.phone ? `<a href="tel:${profile.phone}" style="color: #6b7280; text-decoration: none;">${profile.phone}</a>` : ''}
                    ${profile.phone && profile.website ? ' | ' : ''}
                    ${profile.website ? `<a href="${profile.website}" style="color: #6b7280; text-decoration: none;">Website</a>` : ''}
                </div>
            </div>
        </div>
        
        <div style="margin-top: 32px; font-size: 12px; color: #9ca3af; text-align: center;">
            © ${new Date().getFullYear()} ${profile.name}. All rights reserved.<br>
            Rates and terms subject to change based on market conditions.
        </div>
    </div>
</body>
</html>
    `;
};

export const generatePlainText = (quote: Partial<Quote>, profile: BrokerProfile, messageBody: string): string => {
    return `Subject: DSCR Loan Quote - ${quote.propertyAddress ? `${quote.propertyAddress} (${quote.propertyState})` : quote.propertyState || 'Property'}

${messageBody}

----------------------------------------
DEAL TERMS:
- Loan Amount: $${quote.loanAmount?.toLocaleString()}
- LTV: ${quote.ltv}%
- Rate: ${quote.rate}%
- Term: ${quote.termYears} Years
----------------------------------------

Let me know if these terms work for you.

Best,
${profile.name}
${profile.title}
${profile.phone || ''}
${profile.website || ''}
`;
};
