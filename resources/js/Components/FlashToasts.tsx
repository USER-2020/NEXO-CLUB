import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { confirmToast } from '@/Components/ConfirmToast';
import Pagination from '@/Components/Pagination';
import SmartSearch from '@/Components/SmartSearch';

type FlashProps = {
    success?: string;
    error?: string;
    createdAccess?: unknown;
    athleteAccess?: { name: string; email: string; password: string };
    verificationRequired?: { applicationId: number; email: string };
};

export default function FlashToasts() {
    const flash = (usePage().props.flash as FlashProps | undefined) ?? {};
    const page = usePage();
    const pagination = Object.values(page.props).find((value) => value && typeof value === 'object' && 'current_page' in value && 'last_page' in value) as { current_page: number; last_page: number; from?: number; to?: number; total?: number; per_page?: number } | undefined;
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

        if (flash.verificationRequired) {
            confirmToast({
                title: 'Correo pendiente de confirmación',
                description: `El solicitante aún no confirmó ${flash.verificationRequired.email}. ¿Quieres reenviar el enlace?`,
                confirmLabel: 'Reenviar correo',
                onConfirm: () => router.post(route('platform.club-applications.resend-verification', flash.verificationRequired!.applicationId), {}, { preserveScroll: true }),
            });
        }
    }, [flash.error, flash.success, flash.createdAccess, flash.athleteAccess, flash.verificationRequired, operationActive]);

    return <><SmartSearch />{pagination ? <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,680px)] -translate-x-1/2 rounded-2xl border border-slate-700 bg-nexo-surface shadow-2xl"><Pagination {...pagination} /></div> : null}</>;
}
