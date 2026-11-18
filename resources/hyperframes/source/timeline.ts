import { flushSync } from 'react-dom';
import { scenarios, type Action } from './scenarios';

type Guide = { id: string; module: string; title: string; roles: string[]; steps: string[][] };
type Options = {
    composition: string;
    catalog: Guide[];
    host: HTMLElement;
    reset: (id: string) => void;
    processTime: (time: number) => void;
    perform: (action: Action) => void;
    repaint: () => void;
};
type Point = { x: number; y: number };

export function walk({ composition, catalog, host, reset, processTime, perform, repaint }: Options) {
    const overview = composition === 'nexo-flujos';
    const guides = overview ? catalog.filter(({ roles }) => roles.some((role) => role !== 'Superadmin')) : catalog.filter(({ id }) => id === composition);
    const segments = guides.map((guide) => {
        const beats = overview ? scenarios[guide.id].beats.slice(0, 1).map((beat) => [Math.min(6, beat[0]), ...beat.slice(1).filter((action) => Array.isArray(action) && action[0] < 5)] as typeof beat) : scenarios[guide.id].beats;
        let end = 0;
        const actions: { time: number; work: Action }[] = [];
        const chapters = beats.map(([duration, ...work]) => {
            const start = end;
            actions.push(...work.map((action) => ({ time: start + action[0], work: action })));
            end += duration;
            return start;
        });
        return { guide, end, actions, chapters };
    });
    const duration = segments.reduce((sum, segment) => sum + segment.end, 0);
    const caption = document.getElementById('guide-caption')!;
    const section = document.getElementById('guide-section')!;
    const heading = document.getElementById('guide-title')!;
    const bar = document.getElementById('guide-progress')!;
    const cursor = document.getElementById('guide-cursor')!;
    const ring = document.getElementById('guide-click')!;
    let current = -1;
    let previous = -1;
    let actionIndex = 0;
    let position: Point = { x: 1000, y: 130 };
    let animation: { start: number; finish: number; from: Point; to: Point } | undefined;
    let clickTime = -10;
    let typing: { field: HTMLInputElement | HTMLTextAreaElement; value: string; start: number; end: number; length: number } | undefined;

    const visible = (element: HTMLElement) => Boolean(element.getClientRects().length);
    function find(target: string, kind: Action[1]) {
        if (/^(#|input\[)/.test(target)) return host.querySelector<HTMLElement>(target);
        const label = [...host.querySelectorAll('label')].find((element) =>
            visible(element) && ([...element.childNodes].some((child) => child.nodeType === Node.TEXT_NODE && child.textContent?.trim() === target)
                || [...element.children].some((child) => child.tagName === 'SPAN' && child.textContent?.trim() === target)));
        const field = label?.querySelector<HTMLElement>(kind === 'type' ? 'input:not([type=hidden]), textarea' : 'button');
        if (field) return field;
        const activeDialog = [...host.querySelectorAll<HTMLElement>('[role=dialog], [role=alertdialog]')].filter(visible).at(-1);
        const controls = [...(activeDialog ?? host).querySelectorAll<HTMLElement>('button, a, [role=button], [role=link]')];
        const control = controls.find((element) => visible(element) && (element.textContent?.trim() === target || element.getAttribute('aria-label') === target || (element.getAttribute('role') === 'link' && element.querySelector('h2,h3')?.textContent?.trim() === target)));
        if (control) return control;
        if (kind === 'view') return [...host.querySelectorAll<HTMLElement>('h1,h2,h3,p,span,div,td')].find((element) =>
            visible(element) && element.textContent?.trim() === target);
        return null;
    }

    function write(field: HTMLInputElement | HTMLTextAreaElement, value: string) {
        const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(field, value);
        field.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function typeAt(time: number) {
        if (!typing) return;
        const { field, value, start, end, length } = typing;
        const count = Math.min(value.length, Math.max(1, Math.ceil(value.length * (time - start) / (end - start))));
        if (count !== length) {
            flushSync(() => write(field, value.slice(0, count)));
            typing.length = count;
        }
        if (count === value.length) typing = undefined;
    }

    function settle(work: () => void) {
        const request = window.requestAnimationFrame;
        const queue: FrameRequestCallback[] = [];
        window.requestAnimationFrame = (callback) => queue.push(callback);
        try {
            work();
            if (queue.length) flushSync(() => queue.forEach((callback) => callback(0)));
        } finally {
            window.requestAnimationFrame = request;
        }
    }

    function act(work: Action, time: number) {
        const [, kind, target, value] = work;
        if (kind === 'page' || kind === 'resolve') { perform(work); return; }
        const element = find(target!, kind);
        if (!element) throw new Error(`${composition} · ${time}s · ${kind} · ${target} no disponible`);
        const anchor = kind === 'file' ? element.closest('label') ?? element : element;
        const rect = anchor.getBoundingClientRect();
        if (rect.bottom > 610 || rect.top < 82) anchor.scrollIntoView({ block: 'center', behavior: 'instant' });
        const box = anchor.getBoundingClientRect();
        const next = { x: box.x + box.width / 2, y: Math.max(45, Math.min(650, box.y + box.height / 2)) };
        animation = { start: time, finish: time + 0.55, from: position, to: next };
        position = next;
        if (kind === 'view') return;
        clickTime = time + 0.4;
        flushSync(() => {
            if (kind === 'type') {
                const field = element as HTMLInputElement | HTMLTextAreaElement;
                if (typeof field.value !== 'string') throw new Error('El destino no es un campo: ' + target);
                field.focus({ preventScroll: true });
                typing = { field, value: value!, start: time, end: time + Math.min(1.2, value!.length * 0.09), length: 0 };
            } else if (kind === 'file') {
                const transfer = new DataTransfer();
                transfer.items.add(new File(['%PDF-1.4\n% Comprobante de demostración'], 'comprobante-ejemplo.pdf', { type: 'application/pdf' }));
                (element as HTMLInputElement).files = transfer.files;
                element.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                if (value === 'submit') (element as HTMLInputElement).form!.requestSubmit();
                else element.click();
            }
        });
        repaint();
    }

    function update(seconds: number) {
        const value = Math.max(0, Math.min(duration - 0.001, seconds));
        let start = 0;
        const index = segments.findIndex((segment) => {
            if (value < start + segment.end) return true;
            start += segment.end;
            return false;
        });
        const { guide, actions, chapters } = segments[index];
        const time = value - start;
        if (index !== current || time < previous - 0.01) {
            current = index;
            actionIndex = 0;
            typing = undefined;
            position = { x: 1000, y: 130 };
            animation = undefined;
            clickTime = -10;
            reset(guide.id);
        }
        while (actionIndex < actions.length && actions[actionIndex].time <= time) {
            const action = actions[actionIndex++];
            typeAt(action.time);
            processTime(action.time);
            try {
                settle(() => act(action.work, action.time));
            } catch (error) {
                console.error('[NEXO Hyperframes]', String(error));
                throw error;
            }
        }
        typeAt(time);
        processTime(time);
        previous = time;
        const chapter = chapters.findLastIndex((at) => at <= time);
        section.textContent = overview ? `${index + 1} / ${segments.length} · ${guide.module}` : `Paso ${chapter + 1} / ${guide.steps.length} · ${guide.module}`;
        heading.textContent = overview ? guide.title : guide.steps[chapter][0];
        caption.textContent = overview ? guide.roles.filter((role) => role !== 'Superadmin').join(' · ') : guide.steps[chapter][1];
        bar.style.transform = `scaleX(${value / duration})`;
        const fraction = animation ? Math.min(1, Math.max(0, (time - animation.start) / (animation.finish - animation.start))) : 1;
        const ease = 1 - Math.pow(1 - fraction, 3);
        const x = animation ? animation.from.x + (animation.to.x - animation.from.x) * ease : position.x;
        const y = animation ? animation.from.y + (animation.to.y - animation.from.y) * ease : position.y;
        cursor.style.transform = `translate(${x}px,${y}px)`;
        const pulse = (time - clickTime) / 0.55;
        ring.style.opacity = pulse >= 0 && pulse <= 1 ? String(1 - pulse) : '0';
        ring.style.transform = `translate(${x}px,${y}px) scale(${0.45 + Math.max(0, Math.min(1, pulse))})`;
        const spinner = host.querySelector<SVGElement>('[role=status] .animate-spin');
        if (spinner) spinner.style.transform = `rotate(${time * 360}deg)`;
        return timeline;
    }

    let updating = false;
    function seek(seconds: number) {
        if (updating) return timeline;
        updating = true;
        try { return update(seconds); }
        finally { updating = false; }
    }

    let playhead = 0;
    const move = (seconds?: number) => seconds === undefined ? playhead : seek(playhead = seconds);
    const timeline = { duration: () => duration, totalDuration: () => duration, time: move, seek: move, totalTime: move, pause: move, play: () => timeline, paused: () => true, timeScale: () => 1 };
    const scope = window as typeof window & { __timelines?: Record<string, typeof timeline> };
    (scope.__timelines ??= {})[composition] = timeline;
    seek(0);
}
