import { createContext, useContext, useRef, useState } from 'react';
import type { AnchorHTMLAttributes, PropsWithChildren } from 'react';

type Data = Record<string, unknown>;
type Options = { onSuccess?: () => void; onError?: (errors: Record<string, string>) => void; onFinish?: () => void };
type Visit = (method: string, url: string, data: Data, finish: (errors?: Record<string, string>) => void) => void;

export const PreviewContext = createContext({ component: '', url: '', props: {} });
export const usePage = () => useContext(PreviewContext);
export function Head() { return null; }

let visit: Visit;
export function setPreviewVisit(handler: Visit) { visit = handler; }
export const router = {
    on: () => () => {},
    get: (url: string, data: Data = {}) => visit('get', url, data, () => {}),
    post: (url: string, data: Data = {}) => visit('post', url, data, () => {}),
    patch: (url: string, data: Data = {}) => visit('patch', url, data, () => {}),
    delete: (url: string) => visit('delete', url, {}, () => {}),
};

export function Link({ href = '', onClick, method = 'get', as: Tag = 'a', ...props }: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement> & { method?: string; as?: 'a' | 'button' }>) {
    return <Tag {...props} href={Tag === 'a' ? href : undefined} onClick={(event) => {
        event.preventDefault();
        onClick?.(event as React.MouseEvent<HTMLAnchorElement>);
        visit(method, href, {}, () => {});
    }} />;
}

export function useForm<T extends Data>(initial: T) {
    const defaults = useRef(initial);
    const transform = useRef((data: T): Data => data);
    const [data, change] = useState(initial);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setSuccessful] = useState(false);

    function send(method: string, url: string, options: Options = {}) {
        setProcessing(true);
        setErrors({});
        setSuccessful(false);
        visit(method, url, transform.current(data), (validation) => {
            setProcessing(false);
            if (validation) {
                setErrors(validation);
                options.onError?.(validation);
            } else {
                setSuccessful(true);
                options.onSuccess?.();
            }
            options.onFinish?.();
        });
    }

    return {
        data, errors, processing, recentlySuccessful,
        setData: (field: keyof T | T, value?: unknown) => change((previous) => typeof field === 'object' ? field : { ...previous, [field]: value }),
        clearErrors: () => setErrors({}),
        reset: (...fields: Array<keyof T>) => change((previous) => fields.length ? { ...previous, ...Object.fromEntries(fields.map((key) => [key, defaults.current[key]])) } : defaults.current),
        transform: (callback: (data: T) => Data) => { transform.current = callback; },
        post: (url: string, options?: Options) => send('post', url, options),
        patch: (url: string, options?: Options) => send('patch', url, options),
        put: (url: string, options?: Options) => send('put', url, options),
        delete: (url: string, options?: Options) => send('delete', url, options),
    };
}
