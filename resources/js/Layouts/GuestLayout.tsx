import { Link } from '@inertiajs/react';
import { ArrowLeft, Check } from 'lucide-react';
import { PropsWithChildren, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const words = ['conectado.', 'administrable.', 'estadístico.'];

export default function Guest({ children }: PropsWithChildren) {
    const [wordIndex, setWordIndex] = useState(0);

    useEffect(() => {
        const interval = window.setInterval(() => setWordIndex((index) => (index + 1) % words.length), 2600);
        return () => window.clearInterval(interval);
    }, []);

    return <div className="relative flex min-h-screen overflow-hidden bg-nexo-ink text-slate-100">
        <div className="pointer-events-none fixed inset-0"><div className="absolute -left-40 top-[-10%] h-[600px] w-[600px] rounded-full bg-nexo-lime/10 blur-[130px]" /><div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-cyan-400/10 blur-[140px]" /><div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" /></div>
        <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-5 py-8 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="hidden lg:block">
                <Link href="/" className="inline-flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-nexo-lime text-lg font-black text-nexo-ink shadow-lime">N</span><span className="text-xl font-extrabold tracking-tight">NEXO<span className="text-nexo-lime">.</span></span></Link>
                <div className="mt-20 max-w-md"><h1 className="text-5xl font-extrabold leading-[1.02] tracking-[-0.05em]">Tu club, más <span className="relative inline-flex min-w-[8ch] text-nexo-lime"><AnimatePresence mode="wait"><motion.span key={words[wordIndex]} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.35 }} className="inline-block">{words[wordIndex]}</motion.span></AnimatePresence></span></h1><p className="mt-6 text-lg leading-8 text-slate-400">Administra deportistas, pagos y progreso desde una experiencia creada para equipos que quieren crecer.</p><div className="mt-9 space-y-3 text-sm text-slate-300"><p className="flex items-center gap-3"><span className="rounded-full bg-nexo-lime/10 p-1 text-nexo-lime"><Check size={14} /></span> Información siempre organizada</p><p className="flex items-center gap-3"><span className="rounded-full bg-nexo-lime/10 p-1 text-nexo-lime"><Check size={14} /></span> Pagos y cartera sin complicaciones</p><p className="flex items-center gap-3"><span className="rounded-full bg-nexo-lime/10 p-1 text-nexo-lime"><Check size={14} /></span> Comunicación que mantiene el vínculo</p></div></div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="w-full"><div className="mb-8 flex items-center justify-between lg:hidden"><Link href="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-nexo-lime text-lg font-black text-nexo-ink">N</span><span className="text-xl font-extrabold">NEXO<span className="text-nexo-lime">.</span></span></Link></div><div className="mx-auto max-w-md rounded-[2rem] border border-slate-700/80 bg-[#111a2a]/95 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-nexo-lime"><ArrowLeft size={14} /> Volver al inicio</Link>{children}</div></motion.div>
        </div>
    </div>;
}
