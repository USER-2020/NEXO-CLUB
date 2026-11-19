# Documentación visual de flujos

La aplicación incluye un módulo global en `/documentacion-flujos` para consultar los recorridos visuales de la plataforma desde todos los roles autenticados. Permite filtrar por rol y módulo, y relaciona cada guía con su módulo, componente, permisos y video renderizado.

## Fuentes y catálogo

Las fuentes de Hyperframes están organizadas así:

```text
resources/hyperframes/flows/index.html              # recorrido general
resources/hyperframes/flows/individual/*.html       # un render por flujo
scripts/generate-flow-hyperframes.mjs                # manifiesto y generador
```

El catálogo contiene un video general y 17 recorridos individuales.

| Slug | Módulo / componente | Roles principales | Archivo |
| --- | --- | --- | --- |
| `acceso-roles` | Acceso / Login y redirección | Admin, Contador, Usuario, Deportista | `acceso-roles.mp4` |
| `acceso-superadmin` | Acceso / Login de Plataforma | Superadmin | `acceso-superadmin.mp4` |
| `resumen-club` | Resumen / Dashboard | Admin, Contador, Usuario | `resumen-club.mp4` |
| `clubes-global` | Clubes / Platform Dashboard | Superadmin | `clubes-global.mp4` |
| `club-configuracion` | Configuración / Club | Admin, Contador, Usuario | `club-configuracion.mp4` |
| `disciplinas` | Disciplinas / Catálogo | Admin, Contador, Usuario | `disciplinas.mp4` |
| `primeros-pasos-club` | Resumen / Configuración, disciplinas, deportistas, inscripciones y recaudos | Admin | `primeros-pasos-club.mp4` |
| `deportistas-perfil` | Deportistas / Alta, pago y activación | Admin | `deportistas-perfil.mp4` |
| `inscripciones` | Inscripciones / Alta y configuración | Admin | `inscripciones.mp4` |
| `mensualidades-cobros` | Mensualidades / Billing Console | Admin, Contador | `mensualidades-cobros.mp4` |
| `mensualidades-comprobante` | Mensualidades / Athlete Payment Upload | Deportista | `mensualidades-comprobante.mp4` |
| `equipo-permisos` | Equipo / Club Members | Admin | `equipo-permisos.mp4` |
| `portal-deportista` | Portal / Athlete Portal | Deportista | `portal-deportista.mp4` |
| `auditoria-operaciones` | Auditoría / Audit Logs | Superadmin | `auditoria-operaciones.mp4` |
| `perfil-cuenta` | Mi perfil / Perfil y contraseña | Todos los roles | `perfil-cuenta.mp4` |
| `notificaciones-plataforma` | Notificaciones / Campana y Recaudos | Admin, Contador | `notificaciones-plataforma.mp4` |
| `notificaciones-correo` | Notificaciones / Correos de facturación | Admin, Deportista | `notificaciones-correo.mp4` |

El video general es `public/flow-videos/nexo-flujos.mp4` y dura 84 segundos. Las dos guías de notificaciones duran 38 segundos (plataforma) y 44 segundos (correo). Los videos exclusivos de Superadmin se sirven desde `resources/hyperframes/platform-videos/` mediante la ruta autenticada de Plataforma.

Los Hyperframes individuales usan una línea de tiempo determinista controlada dentro del HTML, sin Playwright ni navegación contra la aplicación. Cada recorrido simula cuatro escenas: preparación del módulo, captura progresiva de datos, validación con estado de carga y confirmación con actualización de estado. También incorpora cursor, foco de campo, escritura progresiva, indicador de progreso y toast de resultado. Los datos son demostrativos y no contienen información consultada desde producción.

## Primeros pasos y recaudo inicial

El modal del Resumen consulta `resources/hyperframes/flows/onboarding.json`. Sus capítulos enlazan a **Configuración**, **Disciplinas** y **Deportistas** y usan los MP4 y las instrucciones del catálogo compartido. Se puede repetir el recorrido desde el botón **Primeros pasos**.

`primeros-pasos-club` reúne la preparación del club, la creación de una disciplina, el alta con pago inmediato y la revisión de ese mismo registro. `deportistas-perfil` comienza en el formulario de alta. La grabación muestra las opciones **Solo perfil** y **Crear con cargo pendiente** antes de registrar el pago recibido. Después muestra la misma inscripción **Activa** y el cargo en estado **Pagada**. La fecha de registro del primer pago determina el inicio de la inscripción y del periodo.

La guía de **Resumen** muestra el gráfico de **Actividad financiera** y la lista de **Últimos pagos** con datos demostrativos dentro del render. En la aplicación, ambos paneles consultan los movimientos reales del club activo.

En la guía de plataforma, el administrador abre la campana, consulta un cobro vencido y registra el pago. La guía de correo muestra el recordatorio, el aviso de vencimiento, el reporte del club, la suspensión diferida y la reactivación.

## Render local

Requisitos:

- Node.js.
- Hyperframes vía `npx`.
- Chrome administrado por Hyperframes.
- FFmpeg y FFprobe.

El comando completo regenera las fuentes y renderiza el video general junto con los 17 videos individuales.

```bash
npm run videos:render
```

Para regenerar únicamente los HTML de origen se puede ejecutar:

```bash
node scripts/generate-flow-hyperframes.mjs
```

Los MP4 se conservan y se versionan en `public/flow-videos` para que el módulo funcione después del despliegue. No se debe enlazar un video que no exista: cualquier flujo futuro sin render debe aparecer explícitamente como `Video en producción` hasta generar y validar su MP4. Playwright no forma parte de este proceso.
