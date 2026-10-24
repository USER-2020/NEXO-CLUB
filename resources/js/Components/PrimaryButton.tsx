import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-xl border border-transparent bg-nexo-lime px-5 py-3 text-sm font-bold text-nexo-ink shadow-lime transition duration-150 ease-in-out hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-nexo-lime/40 active:brightness-95 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
