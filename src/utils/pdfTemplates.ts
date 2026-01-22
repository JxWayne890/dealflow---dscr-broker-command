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
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #eaeaea; padding-bottom: 20px; }
        .logo-section { max-width: 300px; }
        .logo-section img { height: 50px; margin-bottom: 10px; }
        .logo-section h1 { margin: 0; font-size: 24px; font-weight: 700; color: #111; }
        .meta-data { text-align: right; }
        .doc-title { font-size: 32px; font-weight: 800; color: #111; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: -0.5px; }
        .doc-date { font-size: 14px; color: #666; }
        
        .section { margin-bottom: 35px; }
        .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 20px; }
        
        .grid { display: block; width: 100%; overflow: hidden; }
        .col { float: left; width: 48%; margin-right: 4%; box-sizing: border-box; }
        .col:last-child { margin-right: 0; }
        
        .row { margin-bottom: 12px; display: flex; justify-content: space-between; border-bottom: 1px dashed #f0f0f0; padding-bottom: 4px; }
        .label { font-weight: 500; color: #555; font-size: 14px; }
        .value { font-weight: 700; color: #111; font-size: 14px; text-align: right; }
        
        .notes-box { background: #fafafa; border: 1px solid #eee; padding: 15px; border-radius: 6px; font-size: 13px; line-height: 1.5; color: #444; }
        
        .amortization-box { background: #f8fcf8; border: 1px solid #e8f5e9; padding: 15px; border-radius: 6px; }
        .highlight-text { font-size: 14px; color: #2e7d32; line-height: 1.5; font-weight: 500; }
        
        .footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid #eaeaea;text-align: center; color: #888; font-size: 11px; line-height: 1.4; }
        .broker-info { margin-bottom: 15px; font-size: 13px; color: #333; font-weight: 600; }

        /* Clearfix */
        .clearfix::after { content: ""; clear: both; display: table; }
    </style>
</head>
<body>

    <div class="header clearfix">
        <div class="logo-section" style="float:left;">
            ${profile.logoUrl ? `<img src="${profile.logoUrl}" alt="${profile.name}" />` : ''}
            <h1>${profile.company || profile.name}</h1>
            <div style="font-size:12px;color:#666;margin-top:4px;">${profile.title || 'Mortgage Broker'}</div>
        </div>
        <div class="meta-data" style="float:right;">
            <div class="doc-title">Term Sheet</div>
            <div class="doc-date">Prepared on ${today}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Property Information</div>
        <div style="font-size: 18px; font-weight: 600; color: #000; margin-bottom: 6px;">
            ${quote.propertyAddress || 'TBD Property'}
        </div>
        <div style="font-size: 14px; color: #444;">
            ${quote.propertyCity ? `${quote.propertyCity}, ` : ''}${quote.propertyState} ${quote.propertyZip || ''}
        </div>
    </div>

    <div class="section clearfix">
        <div class="section-title">Loan Terms</div>
        
        <div class="col">
            <div class="row"><span class="label">Loan Amount</span><span class="value">$${quote.loanAmount?.toLocaleString()}</span></div>
            <div class="row"><span class="label">LTV</span><span class="value">${quote.ltv}%</span></div>
            <div class="row"><span class="label">Interest Rate</span><span class="value">${quote.rate}%</span></div>
            <div class="row"><span class="label">Loan Program</span><span class="value">DSCR (${quote.dealType})</span></div>
        </div>
        
        <div class="col">
            <div class="row"><span class="label">Term</span><span class="value">${quote.termYears} Years</span></div>
            <div class="row"><span class="label">Rate Type</span><span class="value">${quote.rateType || 'Fixed'}</span></div>
            ${quote.monthlyPayment ? `<div class="row"><span class="label">Monthly P&I</span><span class="value">$${quote.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>` : ''}
            <div class="row"><span class="label">Prepay Penalty</span><span class="value">${quote.prepayPenalty || 'N/A'}</span></div>
        </div>
    </div>

    <div class="section clearfix">
        <div class="section-title">Estimated Funds</div>
        
        <div class="col">
           ${quote.originationFee ? `<div class="row"><span class="label">Lender Fee</span><span class="value">$${quote.originationFee.toLocaleString()}</span></div>` : ''}
           ${quote.uwFee ? `<div class="row"><span class="label">Underwriting Fee</span><span class="value">$${quote.uwFee.toLocaleString()}</span></div>` : ''}
           ${quote.closingFees ? `<div class="row"><span class="label">Est. Closing Costs</span><span class="value">$${quote.closingFees.toLocaleString()}</span></div>` : ''}
        </div>
        
        <div class="col">
            ${quote.brokerFee ? `
            <div class="row">
                <span class="label">Broker Fee</span>
                <span class="value">${quote.brokerFeePercent ? `${quote.brokerFeePercent}%` : `$${quote.brokerFee.toLocaleString()}`}</span>
            </div>` : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Amortization Analysis</div>
        <div class="amortization-box">
            <div class="highlight-text">
                The first year of your loan will build approximately <strong>$${equityBuild.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> in equity through principal paydown.
            </div>
        </div>
    </div>

    ${quote.notes ? `
    <div class="section">
        <div class="section-title">Notes</div>
        <div class="notes-box">
            ${quote.notes.replace(/\n/g, '<br>')}
        </div>
    </div>` : ''}

    <div class="footer">
        <div class="broker-info">
            ${profile.name} &bull; ${formatPhoneNumber(profile.phone || '')} &bull; ${profile.website}
        </div>
        <div>
            This is not a commitment to lend. Rates and terms are subject to change based on market conditions, borrower creditworthiness, and property valuation. 
            Actual terms may vary. Quote based on hypothetical credit score.
        </div>
        <div style="margin-top: 10px;">
            &copy; ${new Date().getFullYear()} ${profile.company || profile.name}. All rights reserved.
        </div>
    </div>

</body>
</html>`;
};
