import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Pagination from '@/Components/Pagination';
import SmartSearch from '@/Components/SmartSearch';

type FlashProps = {
    success?: string;
    error?: string;
    createdAccess?: unknown;
    athleteAccess?: { name: string; email: string; password: string };
};

export default function FlashToasts() {
    const flash = (usePage().props.flash as FlashProps | undefined) ?? {};
    const page = usePage();
    const pagination = Object.values(page.props).find((value) => value && typeof value === 'object' && 'current_page' in value && 'last_page' in value) as { current_page: number; last_page: number; from?: number; to?: number; total?: number } | undefined;
    const [operationActive, setOperationActive] = useState(false);

    useEffect(() => {
        const start = () => setOperationActive(true);
        const complete = () => setOperationActive(false);
        document.addEventListener('nexo:operation-start', start);
        document.addEventListener('nexo:operation-complete', complete);
        return () => {
            document.removeEventListener('nexo:operation-start', start);
            document.removeEventListener('nexo:operation-complete', complete);
        };
    }, []);

    useEffect(() => {
        if (flash.athleteAccess) {
            toast.success(`Acceso creado para ${flash.athleteAccess.name}. Correo: ${flash.athleteAccess.email} · Contraseña temporal: ${flash.athleteAccess.password}`, {
                duration: 12000,
                iconTheme: { primary: '#B8F34B', secondary: '#07111F' },
            });
        } else if (flash.success && !flash.createdAccess && !operationActive) {
            toast.success(flash.success, {
                iconTheme: { primary: '#B8F34B', secondary: '#07111F' },
            });
        }

        if (flash.error) {
            toast.error(flash.error);
        }
    }, [flash.error, flash.success, flash.createdAccess, flash.athleteAccess, operationActive]);

    return <><SmartSearch />{pagination ? <div className="fixed bottom-4 right-4 z-50 w-[min(92vw,520px)] rounded-2xl border border-slate-700 bg-nexo-surface shadow-2xl lg:bottom-6 lg:right-6"><Pagination {...pagination} /></div> : null}</>;
}
