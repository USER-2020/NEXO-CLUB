import { Video } from 'lucide-react';
import { useState } from 'react';

export type VideoAsset = { src: string; poster: string | null };

export function VideoFrame({ asset, title }: { asset?: VideoAsset; title: string }) {
    const [failed, setFailed] = useState(false);
    return <div className="flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-nexo-ink">
        {asset && !failed ? <video aria-label={title} controls playsInline preload="metadata" className="h-full w-full" poster={asset.poster ?? undefined} src={asset.src} onError={() => setFailed(true)} /> : <PendingVideo />}
    </div>;
}

export function PendingVideo() {
    return <span className="flex items-center gap-2 text-sm text-slate-300"><Video aria-hidden="true" size={19} className="text-nexo-lime" /> Video en producción</span>;
}
