import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const compositions = resolve(root, 'resources/hyperframes/flows');
const source = resolve(root, 'resources/hyperframes/source');
const catalog = JSON.parse(await readFile(resolve(root, 'resources/hyperframes/flows/catalog.json'), 'utf8'));

const [manifestBuild] = await build({
    root,
    configFile: false,
    publicDir: false,
    resolve: { alias: { '@inertiajs/react': resolve(source, 'inertia-preview.tsx'), '@': resolve(root, 'resources/js') } },
    esbuild: { jsx: 'automatic' },
    define: { 'process.env.NODE_ENV': '"production"' },
    build: { write: false, lib: { entry: resolve(source, 'scenarios.ts'), name: 'NexoScenarios', formats: ['iife'] } },
});
const { scenarios } = new Function(manifestBuild.output[0].code + '\nreturn NexoScenarios;')();
for (const guide of catalog) {
    const scenario = scenarios[guide.id];
    if (scenario?.beats.length !== guide.steps.length) throw new Error('Pasos desalineados: ' + guide.id);
}

const previewDir = resolve(compositions, '.preview');
await build({
    root,
    configFile: false,
    publicDir: false,
    resolve: { alias: { '@inertiajs/react': resolve(source, 'inertia-preview.tsx'), '@': resolve(root, 'resources/js') } },
    esbuild: { jsx: 'automatic' },
    define: { 'process.env.NODE_ENV': '"production"' },
    build: {
        outDir: previewDir, emptyOutDir: true,
        lib: { entry: resolve(source, 'preview.tsx'), name: 'NexoPreview', formats: ['iife'], fileName: () => 'preview.js', cssFileName: 'preview' },
    },
});

const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const template = (id, title, duration, assets) => `<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>NEXO CLUB · ${escape(title)}</title>
    <link rel="stylesheet" href="${assets}/preview.css">
    <style>
        html, body { width: 1280px; height: 720px; margin: 0; overflow: hidden; }
        *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
        #app main { padding-bottom: 130px; }${id === 'notificaciones-plataforma' ? '\n        [role="dialog"]:has([aria-label="Cerrar notificaciones"]) { padding-bottom: 116px; }' : ''}
        #guide-footer { position: fixed; z-index: 400; display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: center; inset: auto 18px 14px; min-height: 88px; padding: 12px 22px 14px; border-radius: 16px; border: 1px solid #425565; background: #0b1220; box-shadow: 0 8px 24px #03071099; }
        #guide-section { color: #b8f34b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; }
        #guide-title { color: #f8fafc; font-size: 19px; font-weight: 800; line-height: 1.2; margin-top: 4px; }
        #guide-caption { color: #cbd5e1; font-size: 16px; line-height: 1.35; }
        #guide-progress { position: absolute; bottom: 0; left: 15px; width: calc(100% - 30px); height: 3px; border-radius: 8px; background: #b8f34b; transform-origin: left; }
        #guide-cursor, #guide-click { position: fixed; z-index: 500; left: -11px; top: -11px; width: 22px; height: 22px; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 0 4px #b8f34b80, 0 3px 8px #000; pointer-events: none; }
        #guide-click { left: -21px; top: -21px; width: 42px; height: 42px; border-color: #b8f34b; opacity: 0; }
    </style>
</head>
<body>
    <div data-composition-id="${id}" data-width="1280" data-height="720" data-duration="${duration}">
        <div id="app"></div>
        <aside id="guide-footer">
            <div><p id="guide-section"></p><h1 id="guide-title"></h1></div>
            <p id="guide-caption"></p>
            <div id="guide-progress"></div>
        </aside>
        <div id="guide-click"></div>
        <div id="guide-cursor"></div>
    </div>
    <script>
        { const NativeDate = Date, fixed = '2026-11-18T15:00:00Z';
          window.Date = class extends NativeDate {
              constructor(...args) { super(...(args.length ? args : [fixed])); }
          }; }
    </script>
    <script src="${assets}/preview.js"></script>
</body>
</html>
`;

await mkdir(resolve(compositions, 'individual'), { recursive: true });
await writeFile(resolve(compositions, 'index.html'), template('nexo-flujos', 'Recorrido general', catalog.filter(({ roles }) => roles.some((role) => role !== 'Superadmin')).reduce((sum, { id }) => sum + Math.min(6, scenarios[id].beats[0][0]), 0), './.preview'));
await Promise.all(catalog.map(({ id, title }) => writeFile(
    resolve(compositions, 'individual', id + '.html'),
    template(id, title, scenarios[id].beats.reduce((sum, beat) => sum + beat[0], 0), '../.preview'),
)));
console.log(`Generadas ${catalog.length + 1} composiciones de Hyperframes.`);
