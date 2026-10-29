<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="application-name" content="NEXO CLUB">
        <meta name="description" content="NEXO CLUB conecta deportistas, familias y administradores en una plataforma simple para gestionar el día a día de tu club.">
        <meta name="theme-color" content="#0B1220">
        <meta name="color-scheme" content="dark">
        <link rel="canonical" href="{{ url()->current() }}">

        <link rel="icon" href="{{ asset('favicon.svg') }}" type="image/svg+xml">
        <link rel="shortcut icon" href="{{ asset('favicon.svg') }}" type="image/svg+xml">
        <link rel="apple-touch-icon" href="{{ asset('favicon.svg') }}">
        <link rel="manifest" href="{{ asset('build/manifest.webmanifest') }}">

        <meta property="og:site_name" content="NEXO CLUB">
        <meta property="og:locale" content="es_CO">
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:title" content="NEXO CLUB | Gestión deportiva">
        <meta property="og:description" content="Conecta deportistas, familias y administradores en una plataforma simple para gestionar tu club.">
        <meta property="og:image" content="{{ asset('og-image.svg') }}">
        <meta property="og:image:secure_url" content="{{ asset('og-image.svg') }}">
        <meta property="og:image:type" content="image/svg+xml">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="NEXO CLUB | Gestión deportiva">
        <meta name="twitter:description" content="Conecta deportistas, familias y administradores en una plataforma simple para gestionar tu club.">
        <meta name="twitter:image" content="{{ asset('og-image.svg') }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-nexo-ink">
        @inertia
    </body>
</html>
