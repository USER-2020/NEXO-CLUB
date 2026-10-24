import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

type PhoneInputFieldProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
};

export function PhoneInputField({ label, value, onChange, error, required = false }: PhoneInputFieldProps) {
    return <label className="block text-sm font-semibold text-slate-300">
        {label}
        <PhoneInput
            country="co"
            preferredCountries={['co', 'us', 'mx', 'es']}
            value={value}
            onChange={onChange}
            enableSearch
            searchPlaceholder="Buscar país..."
            inputProps={{ required, 'aria-label': label }}
            containerClass="nexo-phone-container mt-2"
            inputClass="nexo-phone-input"
            buttonClass="nexo-phone-button"
            dropdownClass="nexo-phone-dropdown"
        />
        {error && <span className="mt-1 block text-xs font-normal text-red-300">{error}</span>}
    </label>;
}
