import React from 'react';
import { Icons } from '../components/Icons';
import { Quote } from '../types';
import { calculateAmortizationSchedule } from '../utils/finance';

export const PublicSchedule = ({ quote }: { quote: Quote }) => {
    const amortizationSchedule = calculateAmortizationSchedule(quote.loanAmount, quote.rate, quote.termYears);

    // Summary calculations
    const totalInterest = amortizationSchedule.reduce((sum, e) => sum + e.interest, 0);
    const totalCost = quote.loanAmount + totalInterest;
    const monthlyPayment = amortizationSchedule[0]?.payment || 0;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Header / Branding */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                        <Icons.PieChart className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Amortization Schedule</h1>
                    <p className="mt-2 text-lg text-gray-500 max-w-2xl">
                        Detailed breakdown of your DSCR loan for <span className="text-gray-900 font-semibold">{quote.propertyAddress || quote.propertyState}</span>
                    </p>
                </div>

                {/* Key Terms Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
                        <div className="p-6 text-center">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Loan Amount</p>
                            <p className="text-xl font-bold text-gray-900">${quote.loanAmount.toLocaleString()}</p>
                        </div>
                        <div className="p-6 text-center">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Interest Rate</p>
                            <p className="text-xl font-bold text-gray-900">{quote.rate}%</p>
                        </div>
                        <div className="p-6 text-center">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Loan Term</p>
                            <p className="text-xl font-bold text-gray-900">{quote.termYears} Years</p>
                        </div>
                        <div className="p-6 text-center">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Monthly P&I</p>
                            <p className="text-xl font-bold text-emerald-600">${monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>

                {/* Lifetime Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                        <div className="p-3 bg-amber-50 rounded-xl">
                            <Icons.TrendingUp className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Cost of Borrowing (Interest)</p>
                            <p className="text-2xl font-bold text-gray-900">${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            <p className="text-xs text-gray-400 mt-1">Total interest paid over {quote.termYears} years</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 rounded-xl">
                            <Icons.FileText className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Principal + Interest</p>
                            <p className="text-2xl font-bold text-gray-900">${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            <p className="text-xs text-gray-400 mt-1">Total repayment amount</p>
                        </div>
                    </div>
                </div>

                {/* The Modern Schedule Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-12">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900">Payment Breakdown</h3>
                        <p className="text-sm text-gray-500">Explore how your equity builds month over month</p>
                    </div>

                    <div className="overflow-x-auto max-h-[800px] overflow-y-auto custom-scrollbar">
                        <table className="min-w-full text-sm">
                            <thead className="sticky top-0 bg-white shadow-sm z-10">
                                <tr className="bg-gray-50/80 backdrop-blur-sm">
                                    <th className="text-left py-4 px-6 font-semibold text-gray-500">Month</th>
                                    <th className="text-left py-4 px-4 font-semibold text-gray-500">Principal vs Interest</th>
                                    <th className="text-right py-4 px-4 font-semibold text-gray-500">Payment</th>
                                    <th className="text-right py-4 px-6 font-semibold text-gray-500">Remaining Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {amortizationSchedule.map((entry) => {
                                    const pPerc = (entry.principal / entry.payment) * 100;
                                    const iPerc = 100 - pPerc;
                                    const isYearEnd = entry.month % 12 === 0;

                                    return (
                                        <React.Fragment key={entry.month}>
                                            <tr className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="py-4 px-6 text-gray-500 font-medium">Month {entry.month}</td>
                                                <td className="py-4 px-4 min-w-[180px]">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                                                            <div
                                                                className="h-full bg-emerald-500 transition-all duration-500"
                                                                style={{ width: `${pPerc}%` }}
                                                            />
                                                            <div
                                                                className="h-full bg-amber-400 transition-all duration-500"
                                                                style={{ width: `${iPerc}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between items-center text-[11px]">
                                                            <span className="text-emerald-600 font-semibold">${entry.principal.toLocaleString(undefined, { maximumFractionDigits: 0 })} Principal</span>
                                                            <span className="text-amber-600 font-semibold">${entry.interest.toLocaleString(undefined, { maximumFractionDigits: 0 })} Interest</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-right text-gray-900 font-bold">
                                                    ${entry.payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-4 px-6 text-right text-gray-600 font-medium font-mono">
                                                    ${entry.remainingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </td>
                                            </tr>
                                            {isYearEnd && entry.month < amortizationSchedule.length && (
                                                <tr className="bg-gray-50/50">
                                                    <td colSpan={4} className="py-3 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                                                        End of Year {entry.month / 12}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="text-center text-gray-400 text-xs mb-12">
                    <p>© {new Date().getFullYear()} DealFlow DSCR. All figures are estimates based on standard amortization formulas.</p>
                </div>
            </div>
        </div>
    );
};
