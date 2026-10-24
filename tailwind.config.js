import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                nexo: {
                    lime: '#B8F34B',
                    ink: '#0B1220',
                    surface: '#151E2E',
                    muted: '#94A3B8',
                },
            },
            boxShadow: {
                lime: '0 10px 30px rgba(184, 243, 75, 0.16)',
            },
        },
    },

    plugins: [forms],
};
