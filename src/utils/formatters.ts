export const formatPhoneNumber = (value: string) => {
    if (!value) return value;

    // Remove all non-numeric characters
    const digits = value.replace(/\D/g, '');

    // Limit to 10 digits
    const trimmed = digits.slice(0, 10);

    if (trimmed.length <= 3) return trimmed;
    if (trimmed.length <= 6) return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3)}`;
    return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6, 10)}`;
};

export const stripNonDigits = (value: string) => {
    return value.replace(/\D/g, '');
};

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const formatDate = (date: string | Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};
