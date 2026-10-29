/// <reference types="vite-plugin-pwa/client" />

import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { Toaster } from 'react-hot-toast';
import { GlobalOperationProgressModal } from '@/Components/OperationProgressModal';
import GuidedTour from '@/Components/GuidedTour';
import ModalSwipeController from '@/Components/ModalSwipeController';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

registerSW({ immediate: true });

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props}>
                    {({ Component, props: pageProps, key }) => (
                        <>
                            <Component {...pageProps} key={key} />
                            <GuidedTour />
                        </>
                    )}
                </App>
                <GlobalOperationProgressModal />
                <ModalSwipeController />
                <Toaster
                    position="top-center"
                    toastOptions={{
                        duration: 6000,
                        className: 'nexo-toast',
                    }}
                />
            </>,
        );
    },
    progress: {
        color: '#B8F34B',
    },
});
