export interface AmortizationEntry {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    remainingBalance: number;
}

export const calculateAmortizationSchedule = (
    loanAmount: number,
    annualRate: number,
    termYears: number
): AmortizationEntry[] => {
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = termYears * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const schedule: AmortizationEntry[] = [];
    let remainingBalance = loanAmount;

    for (let month = 1; month <= numberOfPayments; month++) {
        const interest = remainingBalance * monthlyRate;
        const principal = monthlyPayment - interest;
        remainingBalance -= principal;

        schedule.push({
            month,
            payment: monthlyPayment,
            principal,
            interest,
            remainingBalance: Math.max(0, remainingBalance)
        });
    }

    return schedule;
};
