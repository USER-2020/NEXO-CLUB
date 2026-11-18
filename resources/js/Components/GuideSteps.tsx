import { BookOpen } from 'lucide-react';

export default function GuideSteps({ steps }: { steps: [string, string][] }) {
    return (
        <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-bold">
                <BookOpen aria-hidden="true" className="text-nexo-lime" size={20} />
                Paso a paso
            </h3>
            <ol role="list" className="space-y-3">
                {steps.map(([title, description], index) => (
                    <li key={title} className="flex items-start gap-3 rounded-xl border border-slate-700/70 bg-nexo-ink/40 p-4">
                        <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-nexo-lime/10 text-sm font-bold text-nexo-lime">
                            {index + 1}
                        </span>
                        <div className="min-w-0">
                            <h4 className="font-bold text-slate-100">{title}</h4>
                            <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    );
}
