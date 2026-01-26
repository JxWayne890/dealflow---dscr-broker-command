import { Quote, BrokerProfile } from '../types';
import { calculateAmortizationSchedule } from './finance';
import { formatPhoneNumber } from './formatters';

export const generateTermSheetHtml = (quoteInput: Partial<Quote> | Partial<Quote>[], profile: BrokerProfile): string => {
    const quotes = Array.isArray(quoteInput) ? quoteInput : [quoteInput];
    const isComparison = quotes.length > 1;
    const firstQuote = quotes[0];
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const renderQuoteTerms = (q: Partial<Quote>, index: number) => {
        const equityBuild = calculateAmortizationSchedule(q.loanAmount || 0, q.rate || 0, q.termYears || 30)
            .slice(0, 12)
            .reduce((acc, curr) => acc + curr.principal, 0);

        // For comparison mode: Option 2+ gets a page break before it
        const pageBreakStyle = isComparison && index > 0 ? 'page-break-before: always;' : '';

        return `
        <div class="option-page" style="${pageBreakStyle}">
            <div class="option-header">
                <div class="option-badge">OPTION ${index + 1}</div>
                <div class="option-type">${q.dealType || 'Loan Terms'}</div>
            </div>
            
            <div class="terms-grid">
                <div class="terms-col">
                    <div class="section-header">Loan Terms</div>
                    <table class="terms-table">
                        <tr><td class="label">Loan Amount</td><td class="value">$${(q.loanAmount || 0).toLocaleString()}</td></tr>
                        <tr><td class="label">Loan-to-Value (LTV)</td><td class="value">${q.ltv || 0}%</td></tr>
                        <tr><td class="label">Interest Rate</td><td class="value">${q.rate || 0}%</td></tr>
                        <tr><td class="label">Loan Program</td><td class="value">DSCR (${(q.dealType || '').replace('Refi', 'Refinance').replace('(', ' - ').replace(')', '')})</td></tr>
                        <tr><td class="label">Loan Term</td><td class="value">${q.termYears || 30} Years</td></tr>
                        <tr><td class="label">Rate Type</td><td class="value">${q.rateType || 'Fixed'}</td></tr>
                        <tr><td class="label">Est. Monthly P&I</td><td class="value highlight-value">$${(q.monthlyPayment || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
                        <tr><td class="label">Prepayment Penalty</td><td class="value">${q.prepayPenalty || 'None'}</td></tr>
                    </table>
                </div>
                <div class="terms-col">
                    <div class="section-header">Estimated Costs & Fees</div>
                    <table class="terms-table">
                        <tr><td class="label">Lender Origination Fee</td><td class="value">$${(q.originationFee || 0).toLocaleString()}</td></tr>
                        <tr><td class="label">Underwriting Fee</td><td class="value">$${(q.uwFee || 0).toLocaleString()}</td></tr>
                        <tr><td class="label">Broker Fee</td><td class="value">${q.brokerFeePercent ? `${q.brokerFeePercent}%` : `$${(q.brokerFee || 0).toLocaleString()}`}</td></tr>
                        <tr><td class="label">Other Closing Fees</td><td class="value">$${(q.closingFees || 0).toLocaleString()}</td></tr>
                        <tr class="total-row">
                            <td class="label">Est. Closing Costs</td>
                            <td class="value total-value">
                                $${((q.originationFee || 0) + (q.uwFee || 0) + (q.brokerFee || 0) + (q.closingFees || 0)).toLocaleString()}
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <div class="highlight-box">
                <span class="icon">📈</span>
                <span class="text">Year 1 equity build estimate: <strong>$${equityBuild.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></span>
            </div>
            
            ${q.notes ? `
            <div class="notes-box">
                <div class="notes-label">Notes for Option ${index + 1}</div>
                <div class="notes-content">${q.notes.replace(/\n/g, '<br>')}</div>
            </div>` : ''}
        </div>
        `;
    };

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        @page {
            size: letter;
            margin: 0;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { 
            font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            color: #1e293b; 
            background: #fff; 
            font-size: 13px; 
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        /* Page container - each option fits on one page */
        .option-page {
            page-break-inside: avoid;
            padding: 30px 40px;
            min-height: 600px;
        }
        
        /* Header Banner */
        .header-banner {
            background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
            color: #fff;
            padding: 25px 40px;
        }
        .header-table { width: 100%; }
        .header-left { vertical-align: middle; }
        .header-right { vertical-align: middle; text-align: right; }
        .company-name { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .company-sub { font-size: 11px; color: #94a3b8; }
        .doc-title { font-size: 28px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 1px; }
        .doc-date { font-size: 11px; color: #94a3b8; margin-top: 4px; }

        /* Property Section */
        .property-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px 20px;
            margin: 20px 40px;
        }
        .property-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 4px; font-weight: 600; }
        .property-address { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .property-city { font-size: 13px; color: #475569; }

        /* Option Header */
        .option-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 3px solid #fbbf24;
        }
        .option-badge {
            background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
            color: #fbbf24;
            font-size: 14px;
            font-weight: 800;
            padding: 8px 16px;
            border-radius: 6px;
            letter-spacing: 1px;
        }
        .option-type {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
        }
        
        /* Section Headers */
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
        .terms-grid { 
            display: table; 
            width: 100%; 
            margin-bottom: 20px; 
        }
        .terms-col { 
            display: table-cell; 
            width: 50%; 
            vertical-align: top; 
        }
        .terms-col:first-child { padding-right: 20px; }
        .terms-col:last-child { padding-left: 20px; }
        
        .terms-table { width: 100%; border-collapse: collapse; }
        .terms-table tr { border-bottom: 1px solid #f1f5f9; }
        .terms-table tr:last-child { border-bottom: none; }
        .terms-table td { padding: 10px 0; }
        .terms-table .label { font-weight: 500; color: #475569; font-size: 13px; }
        .terms-table .value { font-weight: 700; color: #0f172a; text-align: right; font-size: 14px; }
        .terms-table .highlight-value { color: #059669; font-size: 16px; }
        .terms-table .total-row { border-top: 2px solid #e2e8f0; }
        .terms-table .total-row td { padding-top: 14px; }
        .terms-table .total-value { font-size: 18px; font-weight: 800; color: #0f172a; }

        /* Highlight Box */
        .highlight-box {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border: 1px solid #a7f3d0;
            border-radius: 8px;
            padding: 14px 18px;
            margin-bottom: 15px;
        }
        .highlight-box .icon { display: inline-block; margin-right: 10px; font-size: 16px; }
        .highlight-box .text { font-size: 13px; color: #166534; }
        .highlight-box strong { font-weight: 700; color: #15803d; }

        /* Notes Box */
        .notes-box {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 8px;
            padding: 14px 18px;
            margin-bottom: 15px;
        }
        .notes-box .notes-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #92400e; font-weight: 700; margin-bottom: 6px; }
        .notes-box .notes-content { font-size: 12px; color: #78350f; line-height: 1.5; }

        /* Footer */
        .footer { 
            background: #f8fafc; 
            border-top: 1px solid #e2e8f0; 
            padding: 20px 40px; 
            text-align: center;
            page-break-inside: avoid;
        }
        .footer-contact { font-weight: 600; color: #334155; font-size: 13px; margin-bottom: 8px; }
        .footer-legal { font-size: 11px; color: #94a3b8; line-height: 1.5; max-width: 550px; margin: 0 auto; }
        .footer-copyright { font-size: 9px; color: #cbd5e1; margin-top: 10px; }
    </style>
</head>
<body>

    <!-- Header Banner -->
    <div class="header-banner">
        <table class="header-table">
            <tr>
                <td class="header-left">
                    ${profile.logoUrl ? `<img src="${profile.logoUrl}" alt="${profile.name}" style="height: 40px; margin-bottom: 6px; display: block;" />` : ''}
                    <div class="company-name">${profile.company || profile.name}</div>
                    <div class="company-sub">${profile.title || 'Mortgage Broker'}</div>
                </td>
                <td class="header-right">
                    <div class="doc-title">${isComparison ? 'Loan Comparison' : 'Term Sheet'}</div>
                    <div class="doc-date">${today}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Property Section -->
    <div class="property-section">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 50%; vertical-align: top; border-right: 1px solid #e2e8f0; padding-right: 20px;">
                    <div class="property-label">Subject Property</div>
                    <div class="property-address">${firstQuote.propertyAddress || 'Property Address TBD'}</div>
                    <div class="property-city">${firstQuote.propertyCity ? `${firstQuote.propertyCity}, ` : ''}${firstQuote.propertyState || ''} ${firstQuote.propertyZip || ''}</div>
                </td>
                <td style="width: 25%; vertical-align: top; text-align: center; border-right: 1px solid #e2e8f0; padding: 0 15px;">
                    <div class="property-label">Based on Credit</div>
                    <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 4px;">${firstQuote.creditScore || '—'}</div>
                </td>
                <td style="width: 25%; vertical-align: top; text-align: right; padding-left: 20px;">
                    <div class="property-label">Lender Code</div>
                    <div style="font-size: 14px; font-weight: 800; color: #d97706; margin-top: 4px;">${firstQuote.lenderCode ? `#${firstQuote.lenderCode}` : '—'}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Quote Options - Each on its own page -->
    ${quotes.map((q, i) => renderQuoteTerms(q, i)).join('')}

    <!-- Footer -->
    <div class="footer">
        <div class="footer-contact">
            ${profile.name} &nbsp;•&nbsp; ${formatPhoneNumber(profile.phone || '')} &nbsp;•&nbsp; ${profile.website ? `<a href="${profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}" style="color: #334155; text-decoration: underline;">${profile.website}</a>` : ''}
        </div>
        <div class="footer-legal">
            This is not a commitment to lend. Rates and terms are subject to change based on market conditions, borrower creditworthiness, and property valuation. Quote based on ${firstQuote.creditScore ? `<strong>${firstQuote.creditScore}</strong>` : '___________'} credit score.
        </div>
        <div class="footer-copyright">
            © ${new Date().getFullYear()} ${profile.company || profile.name}. All rights reserved.
        </div>
    </div>

</body>
</html>`;
};

