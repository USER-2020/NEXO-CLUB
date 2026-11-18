import { Dialog, DialogBackdrop, DialogDescription, DialogPanel, DialogTitle } from '@headlessui/react';
import { ArrowLeft, ArrowRight, Pause, Play, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { PendingVideo } from '@/Components/FlowVideo';
import GuideSteps from '@/Components/GuideSteps';
import type { Guide } from '@/Pages/FlowDocumentation/Index';

export type OnboardingChapter = {
    id: string;
    label: string;
    summary: string;
    steps: Guide['steps'];
    animation: string | null;
    poster: string | null;
};

const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexo-lime';

export default function ClubOnboarding({ chapters }: { chapters: OnboardingChapter[] }) {
    const [open, setOpen] = useState(true);
    const [index, setIndex] = useState(0);
    const chapter = chapters[index];
    const content = useRef<HTMLDivElement>(null);

    function goTo(step: number) {
        setIndex(step);
        content.current?.scrollTo({ top: 0 });
    }

    function close() {
        setOpen(false);
        document.dispatchEvent(new Event('nexo:club-onboarding-closed'));
    }

    return (
        <Dialog open={open} data-native-scroll-dialog onClose={close} className="relative z-[110]">
            <DialogBackdrop className="fixed inset-0 bg-nexo-ink/85 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-5">
                <DialogPanel data-club-onboarding className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-slate-700 bg-nexo-surface text-slate-100 shadow-2xl sm:rounded-3xl">
                    <header className="flex items-start justify-between gap-3 border-b border-slate-800 p-4 sm:px-6">
                        <div>
                            <p className="nexo-eyebrow text-nexo-lime">Primeros pasos del club</p>
                            <DialogTitle className="mt-1 text-xl font-extrabold sm:text-2xl">Del registro al primer recaudo</DialogTitle>
                            <DialogDescription className="sr-only">Recorrido de cinco pasos para configurar el club y registrar el primer pago.</DialogDescription>
                        </div>
                        <button type="button" data-autofocus onClick={close} aria-label="Cerrar primeros pasos" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-300 hover:bg-slate-800 focus-visible:outline focus-visible:outline-nexo-lime"><X size={21} /></button>
                    </header>
                    <div ref={content} className="space-y-4 overflow-y-auto p-4 sm:px-6">
                        <div aria-live="polite">
                            <p className="text-sm font-semibold text-nexo-lime">Paso {index + 1} de {chapters.length}</p>
                            <h3 className="mt-1 text-lg font-bold">{chapter.label}</h3>
                            <p className="mt-1 text-sm leading-6 text-slate-300">{chapter.summary}</p>
                        </div>
                        <ChapterAnimation key={chapter.id} chapter={chapter} />
                        <GuideSteps steps={chapter.steps} />
                    </div>
                    <footer className="flex shrink-0 flex-wrap justify-between gap-2 border-t border-slate-800 p-4 sm:px-6">
                        <button type="button" className={`${buttonClass} border border-slate-700 text-slate-300`} onClick={index === 0 ? close : () => goTo(index - 1)}>
                            {index === 0 ? 'Cerrar' : <><ArrowLeft size={16} /> Anterior</>}
                        </button>
                        <button type="button" className={`${buttonClass} bg-nexo-lime text-nexo-ink`} onClick={index === chapters.length - 1 ? close : () => goTo(index + 1)}>
                            {index === chapters.length - 1 ? 'Finalizar' : <>Siguiente <ArrowRight size={16} /></>}
                        </button>
                    </footer>
                </DialogPanel>
            </div>
        </Dialog>
    );
}

function ChapterAnimation({ chapter }: { chapter: OnboardingChapter }) {
    const [playing, setPlaying] = useState(() => typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const [failed, setFailed] = useState(false);
    const canAnimate = Boolean(chapter.animation && !failed);
    const animated = canAnimate && playing;
    const source = animated ? chapter.animation : chapter.poster;

    return (
        <div>
            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-nexo-ink">
                {source ? (
                    <img key={source} src={source} alt={`Demostración de NEXO CLUB: ${chapter.label}`} className="h-full w-full object-contain" onError={animated ? () => setFailed(true) : undefined} />
                ) : canAnimate ? (
                    <p className="text-sm text-slate-300">La animación está detenida.</p>
                ) : <PendingVideo />}
            </div>
            {canAnimate && (
                <button type="button" className={`${buttonClass} mt-2 border border-slate-700 text-slate-300`} onClick={() => setPlaying(!playing)}>
                    {animated ? <><Pause size={16} /> Detener animación</> : <><Play size={16} /> Reproducir animación</>}
                </button>
            )}
        </div>
    );
}
