import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'prompt',
            includeAssets: ['brand-mark.svg', 'og-image.svg'],
            manifest: {
                name: 'NEXO CLUB',
                short_name: 'NEXO CLUB',
                description: 'Conectamos deportistas, clubes y progreso.',
                theme_color: '#0B1220',
                background_color: '#0B1220',
                display: 'standalone',
                start_url: '/dashboard',
                icons: [
                    { src: '/brand-mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
                ],
            },
            workbox: {
                navigateFallbackDenylist: [/^\/(?!login|register|dashboard)/],
                globPatterns: ['**/*.{js,css,html,svg,woff2}'],
            },
        }),
    ],
});
