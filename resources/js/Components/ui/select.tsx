import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
    <div className="relative">
        <select ref={ref} className={cn('flex h-11 w-full appearance-none rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 pr-10 text-sm text-slate-100 shadow-sm outline-none transition focus:border-nexo-lime focus:ring-2 focus:ring-nexo-lime/20 disabled:cursor-not-allowed disabled:opacity-50', className)} {...props}>{children}</select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
    </div>
));

Select.displayName = 'Select';
export { Select };
