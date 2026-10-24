import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({ status, canResetPassword }: { status?: string; canResetPassword: boolean }) {
    const { data, setData, post, processing, errors, reset } = useForm({ email: '', password: '', remember: false as boolean });
    const submit: FormEventHandler = (e) => { e.preventDefault(); post(route('login'), { onFinish: () => reset('password') }); };
    return <GuestLayout><Head title="Iniciar sesión" /><div className="mb-8"><p className="text-sm font-semibold text-nexo-lime">Bienvenido de nuevo</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight">Ingresa a tu club</h2><p className="mt-2 text-sm leading-6 text-slate-400">Administra tu operación deportiva desde un solo lugar.</p></div>{status && <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">{status}</div>}<form onSubmit={submit} className="space-y-5"><div><InputLabel htmlFor="email" value="Correo electrónico" /><TextInput id="email" type="email" name="email" value={data.email} className="mt-2" autoComplete="username" isFocused onChange={(e) => setData('email', e.target.value)} /><InputError message={errors.email} className="mt-2" /></div><div><div className="flex items-center justify-between"><InputLabel htmlFor="password" value="Contraseña" />{canResetPassword && <Link href={route('password.request')} className="text-xs font-semibold text-nexo-lime transition hover:text-white">¿Olvidaste tu contraseña?</Link>}</div><TextInput id="password" type="password" name="password" value={data.password} className="mt-2" autoComplete="current-password" onChange={(e) => setData('password', e.target.value)} /><InputError message={errors.password} className="mt-2" /></div><label className="flex items-center gap-2 text-sm text-slate-400"><Checkbox name="remember" checked={data.remember} onChange={(e) => setData('remember', e.target.checked as false)} />Mantener mi sesión iniciada</label><PrimaryButton className="w-full justify-center" disabled={processing}>{processing ? 'Ingresando…' : 'Iniciar sesión'}</PrimaryButton></form><div className="mt-7 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">¿Aún no tienes una cuenta? <Link href={route('register')} className="font-semibold text-nexo-lime hover:text-white">Crea tu cuenta</Link></div></GuestLayout>;
}
