import { Dialog, DialogBackdrop, DialogDescription, DialogPanel, DialogTitle } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { VideoFrame, type VideoAsset } from '@/Components/FlowVideo';
import GuideSteps from '@/Components/GuideSteps';
import type { Guide } from '@/Pages/FlowDocumentation/Index';

export type OnboardingChapter = {
    id: string;
    label: string;
    summary: string;
    steps: Guide['steps'];
    href: string;
    action: string;
    video: VideoAsset | null;
};

const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-lime';

export default function ClubOnboarding({ chapters, onClose }: { chapters: OnboardingChapter[]; onClose: () => void }) {
    const [index, setIndex] = useState(0);
    const chapter = chapters[index];
    const content = useRef<HTMLDivElement>(null);

    function goTo(step: number) {
        setIndex(step);
        content.current?.scrollTo({ top: 0 });
    }

    return (
        <Dialog open data-native-scroll-dialog onClose={onClose} className="relative z-[110]">
            <DialogBackdrop className="fixed inset-0 bg-nexo-ink/85 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-5">
                <DialogPanel data-club-onboarding className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-slate-700 bg-nexo-surface text-slate-100 shadow-2xl sm:rounded-3xl">
                    <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-800 p-4 sm:px-6">
                        <div>
                            <p className="nexo-eyebrow text-nexo-lime">Primeros pasos del club</p>
                            <DialogTitle className="mt-1 text-xl font-extrabold sm:text-2xl">Prepara el club y registra el primer pago</DialogTitle>
                            <DialogDescription className="sr-only">Recorrido para configurar el club, crear una disciplina e inscribir al primer deportista con su pago.</DialogDescription>
                        </div>
                        <button type="button" data-autofocus onClick={onClose} aria-label="Cerrar primeros pasos" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-300 hover:bg-slate-800 focus-visible:outline focus-visible:outline-nexo-lime"><X size={21} /></button>
                    </header>
                    <div ref={content} className="min-h-0 space-y-4 overflow-y-auto p-4 sm:px-6">
                        <nav aria-label="Capítulos de primeros pasos" className="grid gap-2 sm:grid-cols-3">
                            {chapters.map((item, step) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    aria-current={index === step ? 'step' : undefined}
                                    onClick={() => goTo(step)}
                                    className={`${buttonClass} justify-start border text-left ${index === step ? 'border-nexo-lime bg-nexo-lime/10 text-nexo-lime' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                        <div aria-live="polite">
                            <p className="text-sm font-semibold text-nexo-lime">Paso {index + 1} de {chapters.length}</p>
                            <h3 className="mt-1 text-lg font-bold">{chapter.label}</h3>
                            <p className="mt-1 text-sm leading-6 text-slate-300">{chapter.summary}</p>
                        </div>
                        <VideoFrame key={chapter.id} asset={chapter.video ?? undefined} title={chapter.label} />
                        <GuideSteps steps={chapter.steps} />
                    </div>
                    <footer className="flex shrink-0 flex-wrap justify-between gap-2 border-t border-slate-800 p-4 sm:px-6">
                        {index > 0 && <button type="button" className={`${buttonClass} border border-slate-700 text-slate-300`} onClick={() => goTo(index - 1)}>
                            <ArrowLeft size={16} /> Anterior
                        </button>}
                        <div className="ml-auto flex flex-wrap gap-2">
                            <Link href={chapter.href} className={`${buttonClass} ${index === chapters.length - 1 ? 'bg-nexo-lime text-nexo-ink' : 'text-nexo-lime hover:bg-slate-800'}`}>
                                {chapter.action} <ArrowUpRight size={16} />
                            </Link>
                            {index < chapters.length - 1 && <button type="button" className={`${buttonClass} bg-nexo-lime text-nexo-ink`} onClick={() => goTo(index + 1)}>
                                Siguiente <ArrowRight size={16} />
                            </button>}
                        </div>
                    </footer>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
