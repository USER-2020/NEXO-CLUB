import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-slate-700 bg-slate-900 text-nexo-lime shadow-sm focus:ring-nexo-lime ' +
                className
            }
        />
    );
}
