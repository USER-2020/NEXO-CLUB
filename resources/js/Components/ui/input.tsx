import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, type = 'text', ...props }, ref) => (
    <input ref={ref} type={type} className={cn('box-border flex !h-11 !min-h-11 !max-h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 shadow-sm outline-none transition placeholder:text-slate-600 focus:border-nexo-lime focus:ring-2 focus:ring-nexo-lime/20 disabled:cursor-not-allowed disabled:opacity-50', className)} {...props} />
));

Input.displayName = 'Input';
export { Input };
