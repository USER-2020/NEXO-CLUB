export const billingFrequencies = [
    { id: 'monthly', label: 'Mensual' },
    { id: 'biweekly', label: 'Quincenal' },
    { id: 'quarterly', label: 'Trimestral' },
    { id: 'semiannual', label: 'Semestral' },
    { id: 'annual', label: 'Anual' },
];

export function formatBillingFrequency(frequency: string | null | undefined) {
    return billingFrequencies.find(({ id }) => id === frequency)?.label ?? 'Mensual';
}
