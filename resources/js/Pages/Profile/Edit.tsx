import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AthletePersonalDataForm from '@/Components/AthletePersonalDataForm';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
    athlete,
}: PageProps<{ mustVerifyEmail: boolean; status?: string; athlete?: Parameters<typeof AthletePersonalDataForm>[0]['athlete'] | null }>) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-100">
                    Mi perfil
                </h2>
            }
        >
            <Head title="Mi perfil" />

            <div className="mx-auto max-w-[1400px]">
                <div className="mb-8"><p className="nexo-eyebrow text-nexo-lime">Cuenta y seguridad</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Configura tu perfil</h1><p className="mt-2 text-sm text-slate-400">Mantén actualizada tu información de acceso y seguridad.</p></div>
                <div className="space-y-6">
                    {athlete && <AthletePersonalDataForm athlete={athlete} />}
                    <div className="nexo-card p-5 sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="nexo-card p-5 sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="nexo-card border-red-400/20 p-5 sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
