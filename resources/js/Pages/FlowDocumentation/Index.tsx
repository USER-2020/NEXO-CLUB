import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Head, usePage } from '@inertiajs/react';
import { ArrowUpRight, PlayCircle, X } from 'lucide-react';
import { useState } from 'react';
import { PendingVideo, VideoFrame, type VideoAsset } from '@/Components/FlowVideo';
import GuideSteps from '@/Components/GuideSteps';
import { SearchableSelect } from '@/Components/ui/searchable-select';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PlatformLayout from '@/Layouts/PlatformLayout';
export type Guide = { id: string; module: string; title: string; description: string; component: string; roles: string[]; steps: [string, string][] };
const options = (values: string[]) => ['Todos', ...new Set(values)].map((label) => ({ id: label, label }));

export default function Index({ guides, videos }: { guides: Guide[]; videos: Record<string, VideoAsset | null> }) {
    const { platformAccess, auth } = usePage<{ platformAccess?: { isSuperadmin?: boolean }; auth: { user: import('@/types').User & { role?: string } } }>().props;
    const Layout = platformAccess?.isSuperadmin || auth.user?.role === 'superadmin' ? PlatformLayout : AuthenticatedLayout;
    const [role, setRole] = useState('Todos');
    const [module, setModule] = useState('Todos');
    const [selected, setSelected] = useState<Guide | null>(null);
    const roles = options(guides.flatMap((guide) => guide.roles));
    const modules = options(guides.map((guide) => guide.module));
    const visible = guides.filter((guide) => (role === 'Todos' || guide.roles.includes(role)) && (module === 'Todos' || guide.module === module));

    return (
        <Layout header={<div><p className="nexo-eyebrow">Ayuda global</p><h1 className="mt-1 text-xl font-bold sm:text-2xl">Documentación</h1></div>}>
            <Head title="Documentación" />
            <section className="mx-auto max-w-[1400px] space-y-6">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Guías de NEXO CLUB</h2>
                    <p className="mt-2 text-sm text-slate-400">Abre una guía para ver el recorrido y seguir los pasos en tu club.</p>
                </div>
                <details
                    className="nexo-card overflow-hidden"
                    data-tour="documentation-video"
                    onToggle={(event) => {
                        if (!event.currentTarget.open) event.currentTarget.querySelector('video')?.pause();
                    }}
                >
                    <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 p-4 font-bold focus-visible:outline focus-visible:outline-nexo-lime sm:p-5">
                        <PlayCircle size={22} className="text-nexo-lime" /> Recorrido general
                    </summary>
                    <div className="border-t border-slate-800 p-4 sm:p-5">
                        <VideoFrame asset={videos['nexo-flujos'] ?? undefined} title="Recorrido general de NEXO CLUB" />
                    </div>
                </details>
                <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl" data-tour="documentation-filters">
                    <div>
                        <span id="documentation-role" className="mb-2 block text-sm font-semibold text-slate-300">Rol</span>
                        <SearchableSelect ariaLabelledBy="documentation-role" value={role} options={roles} onValueChange={setRole} searchPlaceholder="Buscar rol..." />
                    </div>
                    <div>
                        <span id="documentation-module" className="mb-2 block text-sm font-semibold text-slate-300">Módulo</span>
                        <SearchableSelect ariaLabelledBy="documentation-module" value={module} options={modules} onValueChange={setModule} searchPlaceholder="Buscar módulo..." />
                    </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" data-tour="documentation-guides">
                    {visible.map((guide) => (
                        <button key={guide.id} type="button" onClick={() => setSelected(guide)} className="group nexo-card flex w-full flex-col overflow-hidden text-left hover:border-nexo-lime/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nexo-lime">
                            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-nexo-ink">
                                {videos[guide.id]?.poster && <img src={videos[guide.id]?.poster ?? undefined} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                                {videos[guide.id] ? <PlayCircle size={42} className="relative rounded-full bg-nexo-ink/90 p-1 text-nexo-lime" /> : <PendingVideo />}
                            </div>
                            <div className="flex flex-1 flex-col p-5">
                                <span className="nexo-eyebrow text-nexo-lime">{guide.module}</span>
                                <span className="mt-2 text-lg font-bold">{guide.title}</span>
                                <span className="mt-2 flex-1 text-sm leading-6 text-slate-400">{guide.description}</span>
                                <span className="mt-4 text-xs text-slate-400">{guide.roles.join(' · ')}</span>
                                <span className="mt-4 flex items-center gap-2 text-sm font-semibold text-nexo-lime">Ver guía <ArrowUpRight size={16} /></span>
                            </div>
                        </button>
                    ))}
                </div>
                {visible.length === 0 && <p className="nexo-card p-8 text-center text-sm text-slate-400" role="status">No hay guías que coincidan con estos filtros.</p>}
            </section>
            {selected && <GuideDialog guide={selected} asset={videos[selected.id] ?? undefined} onClose={() => setSelected(null)} />}
        </Layout>
    );
}

function GuideDialog({ guide, asset, onClose }: { guide: Guide; asset?: VideoAsset; onClose: () => void }) {
    return (
        <Dialog open data-native-scroll-dialog onClose={onClose} className="relative z-[110]">
            <DialogBackdrop className="fixed inset-0 bg-nexo-ink/85 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-5">
                <DialogPanel className="max-h-[94dvh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-slate-700 bg-nexo-surface text-slate-100 shadow-2xl sm:rounded-3xl">
                    <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-800 bg-nexo-surface p-4 sm:p-6">
                        <div>
                            <p className="nexo-eyebrow text-nexo-lime">{guide.module}</p>
                            <DialogTitle className="mt-1 text-xl font-extrabold sm:text-2xl">{guide.title}</DialogTitle>
                        </div>
                        <button type="button" data-autofocus onClick={onClose} aria-label="Cerrar guía" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-300 hover:bg-slate-800 focus-visible:outline focus-visible:outline-nexo-lime"><X size={21} /></button>
                    </header>
                    <div className="space-y-5 p-4 sm:p-6">
                        <p className="text-sm text-slate-300">{guide.description}</p>
                        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                            <div><dt className="font-semibold text-slate-200">Roles</dt><dd className="text-slate-400">{guide.roles.join(' · ')}</dd></div>
                            <div><dt className="font-semibold text-slate-200">Componentes</dt><dd className="text-slate-400">{guide.component}</dd></div>
                        </dl>
                        <VideoFrame asset={asset} title={guide.title} />
                        <GuideSteps steps={guide.steps} />
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
