import { Quote, BrokerProfile } from '../types';
import { calculateAmortizationSchedule } from './finance';
import { formatPhoneNumber } from './formatters';

export const generateTermSheetHtml = (quote: Partial<Quote>, profile: BrokerProfile): string => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const equityBuild = calculateAmortizationSchedule(quote.loanAmount || 0, quote.rate || 0, quote.termYears || 30)
        .slice(0, 12)
        .reduce((acc, curr) => acc + curr.principal, 0);

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            color: #1e293b; 
            background: #fff; 
            font-size: 13px; 
            line-height: 1.5;
        }
        
        /* Header Banner */
        .header-banner {
            background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
            color: #fff;
            padding: 30px 40px;
        }
        .header-table { width: 100%; }
        .header-left { vertical-align: middle; }
        .header-right { vertical-align: middle; text-align: right; }
        .company-name { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .company-sub { font-size: 12px; color: #94a3b8; }
        .doc-title { font-size: 32px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 1px; }
        .doc-date { font-size: 12px; color: #94a3b8; margin-top: 4px; }

        /* Content Area */
        .content { padding: 30px 40px; }
        
        /* Property Section */
        .property-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .property-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 6px; font-weight: 600; }
        .property-address { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .property-city { font-size: 14px; color: #475569; }
        
        /* Section */
        .section-header { 
            font-size: 11px; 
            font-weight: 700; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
            color: #64748b; 
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        /* Terms Grid */
        .terms-grid { display: table; width: 100%; margin-bottom: 25px; }
        .terms-col { display: table-cell; width: 50%; vertical-align: top; }
        .terms-col:first-child { padding-right: 15px; }
        .terms-col:last-child { padding-left: 15px; }
        
        .terms-table { width: 100%; border-collapse: collapse; }
        .terms-table tr { border-bottom: 1px solid #f1f5f9; }
        .terms-table tr:last-child { border-bottom: none; }
        .terms-table td { padding: 10px 0; }
        .terms-table .label { font-weight: 500; color: #475569; }
        .terms-table .value { font-weight: 700; color: #0f172a; text-align: right; font-size: 14px; }

        /* Highlight Box */
        .highlight-box {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border: 1px solid #a7f3d0;
            border-radius: 8px;
            padding: 18px 20px;
            margin-bottom: 25px;
        }
        .highlight-box .icon { display: inline-block; margin-right: 10px; font-size: 18px; }
        .highlight-box .text { font-size: 14px; color: #166534; }
        .highlight-box strong { font-weight: 700; color: #15803d; }

        /* Notes Box */
        .notes-box {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 8px;
            padding: 18px 20px;
            margin-bottom: 25px;
        }
        .notes-box .notes-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #92400e; font-weight: 700; margin-bottom: 8px; }
        .notes-box .notes-content { font-size: 13px; color: #78350f; line-height: 1.6; }

        /* Footer */
        .footer { 
            background: #f8fafc; 
            border-top: 1px solid #e2e8f0; 
            padding: 25px 40px; 
            text-align: center; 
        }
        .footer-contact { font-weight: 600; color: #334155; font-size: 14px; margin-bottom: 10px; }
        .footer-legal { font-size: 14px; color: #94a3b8; line-height: 1.6; max-width: 600px; margin: 0 auto; }
        .footer-copyright { font-size: 10px; color: #cbd5e1; margin-top: 12px; }
    </style>
</head>
<body>

    <!-- Header Banner -->
    <div class="header-banner">
        <table class="header-table">
            <tr>
                <td class="header-left">
                    ${profile.logoUrl ? `<img src="${profile.logoUrl}" alt="${profile.name}" style="height: 45px; margin-bottom: 8px; display: block;" />` : ''}
                    <div class="company-name">${profile.company || profile.name}</div>
                    <div class="company-sub">${profile.title || 'Mortgage Broker'}</div>
                </td>
                <td class="header-right">
                    <div class="doc-title">Term Sheet</div>
                    <div class="doc-date">${today}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Content -->
    <div class="content">
        
        <!-- Property Section -->
        <div class="property-section">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div class="property-label">Subject Property</div>
                    <div class="property-address">${quote.propertyAddress || 'Property Address TBD'}</div>
                    <div class="property-city">${quote.propertyCity ? `${quote.propertyCity}, ` : ''}${quote.propertyState || ''} ${quote.propertyZip || ''}</div>
                </div>
                ${quote.lenderCode ? `
                <div style="text-align: right;">
                    <div class="property-label">Lender Code</div>
                    <div style="font-size: 18px; font-weight: 800; color: #d97706; text-shadow: 0px 1px 1px rgba(0,0,0,0.1);">#${quote.lenderCode}</div>
                </div>` : ''}
            </div>
        </div>

        <!-- Terms Grid -->
        <div class="terms-grid">
            <div class="terms-col">
                <div class="section-header">Loan Terms</div>
                <table class="terms-table">
                    <tr><td class="label">Loan Amount</td><td class="value">$${(quote.loanAmount || 0).toLocaleString()}</td></tr>
                    <tr><td class="label">Loan-to-Value (LTV)</td><td class="value">${quote.ltv || 0}%</td></tr>
                    <tr><td class="label">Interest Rate</td><td class="value">${quote.rate || 0}%</td></tr>
                    <tr><td class="label">Loan Program</td><td class="value">DSCR (${(quote.dealType || '').replace('Refi', 'Refinance').replace('(', ' - ').replace(')', '')})</td></tr>
                    <tr><td class="label">Loan Term</td><td class="value">${quote.termYears || 30} Years</td></tr>
                    <tr><td class="label">Rate Type</td><td class="value">${quote.rateType || 'Fixed'}</td></tr>
                    <tr><td class="label">Est. Monthly P&I</td><td class="value">$${(quote.monthlyPayment || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
                    <tr><td class="label">Prepayment Penalty</td><td class="value">${quote.prepayPenalty || 'None'}</td></tr>
                </table>
            </div>
            <div class="terms-col">
                <div class="section-header">Estimated Costs & Fees</div>
                <table class="terms-table">
                    <tr><td class="label">Lender Origination Fee</td><td class="value">$${(quote.originationFee || 0).toLocaleString()}</td></tr>
                    <tr><td class="label">Underwriting Fee</td><td class="value">$${(quote.uwFee || 0).toLocaleString()}</td></tr>
                    <tr><td class="label">Broker Fee</td><td class="value">${quote.brokerFeePercent ? `${quote.brokerFeePercent}%` : `$${(quote.brokerFee || 0).toLocaleString()}`}</td></tr>
                    <tr><td class="label">Est. Closing Costs</td><td class="value">$${(quote.closingFees || 0).toLocaleString()}</td></tr>
                </table>
            </div>
        </div>

        <!-- Amortization Highlight -->
        <div class="highlight-box">
            <span class="icon">📈</span>
            <span class="text">The first year of your loan will build approximately <strong>$${equityBuild.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> in equity through principal paydown.</span>
        </div>

        <!-- Notes -->
        ${quote.notes ? `
        <div class="notes-box">
            <div class="notes-label">Additional Notes</div>
            <div class="notes-content">${quote.notes.replace(/\n/g, '<br>')}</div>
        </div>` : ''}

    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="footer-contact">
            ${profile.name} &nbsp;•&nbsp; ${formatPhoneNumber(profile.phone || '')} &nbsp;•&nbsp; ${profile.website ? `<a href="${profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}" style="color: #334155; text-decoration: underline;">${profile.website}</a>` : ''}
        </div>
        <div class="footer-legal">
            This is not a commitment to lend. Rates and terms are subject to change based on market conditions, borrower creditworthiness, and property valuation. Actual terms may vary. Quote based on ${quote.creditScore ? `<strong>${quote.creditScore}</strong>` : '___________'} credit score.
        </div>
        <div class="footer-copyright">
            © ${new Date().getFullYear()} ${profile.company || profile.name}. All rights reserved.
        </div>
    </div>

</body>
</html>`;
};
