# Documentación visual de flujos

La aplicación incluye un módulo global en `/documentacion-flujos` para consultar los recorridos visuales de la plataforma desde todos los roles autenticados. Permite filtrar por rol y módulo, y relaciona cada guía con su módulo, componente, permisos y video renderizado.

## Fuentes y catálogo

Las fuentes de Hyperframes están organizadas así:

```text
resources/hyperframes/flows/index.html              # recorrido general
resources/hyperframes/flows/individual/*.html       # un render por flujo
scripts/generate-flow-hyperframes.mjs                # manifiesto y generador
```

El catálogo actual tiene un video general y estos 10 recorridos individuales:

| Slug | Módulo / componente | Roles principales | Archivo |
| --- | --- | --- | --- |
| `acceso-roles` | Acceso / Login y redirección | Todos los roles | `acceso-roles.mp4` |
| `clubes-global` | Clubes / Platform Dashboard | Superadmin | `clubes-global.mp4` |
| `club-configuracion` | Clubes / Club Configuration | Admin, Contador | `club-configuracion.mp4` |
| `deportistas-perfil` | Deportistas / Athlete Onboarding | Admin | `deportistas-perfil.mp4` |
| `inscripciones` | Inscripciones / Enrollment Onboarding | Admin, Contador | `inscripciones.mp4` |
| `mensualidades-cobros` | Mensualidades / Billing Console | Admin, Contador | `mensualidades-cobros.mp4` |
| `mensualidades-comprobante` | Mensualidades / Athlete Payment Upload | Deportista | `mensualidades-comprobante.mp4` |
| `equipo-permisos` | Equipo / Club Members | Admin | `equipo-permisos.mp4` |
| `portal-deportista` | Portal / Athlete Portal | Deportista | `portal-deportista.mp4` |
| `auditoria-operaciones` | Auditoría / Audit Logs | Superadmin, Admin | `auditoria-operaciones.mp4` |

Los archivos publicados se encuentran en `public/flow-videos/`. El video general es `nexo-flujos.mp4`; cada Hyperframe individual dura 12 segundos y el recorrido general dura 24 segundos.

Los Hyperframes individuales usan una línea de tiempo determinista controlada dentro del HTML, sin Playwright ni navegación contra la aplicación. Cada recorrido simula cuatro escenas: preparación del módulo, captura progresiva de datos, validación con estado de carga y confirmación con actualización de estado. También incorpora cursor, foco de campo, escritura progresiva, indicador de progreso y toast de resultado. Los datos son demostrativos y no contienen información consultada desde producción.

## Render local

Requisitos:

- Node.js.
- Hyperframes vía `npx`.
- Chrome administrado por Hyperframes.
- FFmpeg y FFprobe.

El comando completo regenera las fuentes individuales y renderiza el video general junto con los 10 videos individuales:

```bash
npm run videos:render
```

Para regenerar únicamente los HTML de origen se puede ejecutar:

```bash
node scripts/generate-flow-hyperframes.mjs
```

Los MP4 se conservan y se versionan en `public/flow-videos` para que el módulo funcione después del despliegue. No se debe enlazar un video que no exista: cualquier flujo futuro sin render debe aparecer explícitamente como `Video en producción` hasta generar y validar su MP4. Playwright no forma parte de este proceso.
