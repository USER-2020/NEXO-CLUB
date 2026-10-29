import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { confirmToast } from '@/Components/ConfirmToast';
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

    return <SmartSearch />;
}
