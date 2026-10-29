# NEXO CLUB — convenciones del repositorio

Para incorporar otro agente, leer primero [docs/agent-context.md](docs/agent-context.md) y la skill compartible [skills/nexo-club-context/SKILL.md](skills/nexo-club-context/SKILL.md).

## Principios

- El backend Laravel es la fuente de verdad para autorización, reglas financieras y aislamiento por club.
- Las operaciones monetarias usan enteros en pesos colombianos o decimales exactos; nunca `float`.
- Toda nueva entidad de negocio debe declarar explícitamente su relación con `club_id` cuando aplique.
- Las acciones financieras se ejecutan dentro de transacciones y se auditan; no se eliminan movimientos confirmados.
- NEXO CLUB es multi-club: toda operación de negocio debe resolverse desde el `activeClub` validado por backend.
- El superadmin administra la plataforma y los administradores de clubes; el admin gestiona la operación de su club.
- Los perfiles de deportistas son permanentes; la vigencia se controla en `enrollments`, no con una fecha final obligatoria del deportista.

## Frontend

- React + TypeScript + Inertia; usar componentes pequeños y reutilizables.
- La interfaz debe ser mobile-first, accesible por teclado y usable con áreas táctiles amplias.
- Mantener la identidad NEXO: lima `#B8F34B`, fondo `#0B1220`, superficie `#151E2E`.
- No colocar datos ficticios en páginas productivas. Los estados vacíos deben representar colecciones reales sin datos.

## Documentación visual y Hyperframes

- El módulo global `/documentacion-flujos` está disponible para todos los roles autenticados, incluidos superadmin y deportista. La navegación debe conservar el acceso a la documentación según el layout del rol.
- Cada guía debe identificar explícitamente el rol, módulo, componente, flujo y video asociado. Los filtros del catálogo deben usar `SearchableSelect` cuando correspondan a una colección.
- La composición general vive en `resources/hyperframes/flows/index.html`; las composiciones individuales viven en `resources/hyperframes/flows/individual/` y se generan desde `scripts/generate-flow-hyperframes.mjs`.
- Para regenerar las fuentes y todos los renders se usa `npm run videos:render`. El comando debe producir el video general y un MP4 por cada flujo individual definido en el catálogo.
- Los renders publicados se versionan en `public/flow-videos/` para que estén disponibles después del despliegue. No enlazar archivos inexistentes ni presentar videos ficticios; un flujo sin MP4 debe mostrar `Video en producción`.
- Los Hyperframes deben representar una secuencia dinámica determinista dentro del HTML: interacción del cursor, captura de datos, validación, estados de carga y confirmación. No usar Playwright para generarlos; el render se realiza directamente con Hyperframes sobre las composiciones HTML.
- El catálogo actual incluye: acceso y roles, clubes global, configuración del club, perfil de deportista, inscripciones, cobros, envío de comprobante, equipo y permisos, portal del deportista y auditoría de operaciones.

## Sistema visual obligatorio para formularios

Antes de crear un formulario nuevo, revisar `docs/agent-context.md` y reutilizar los componentes de `resources/js/Components/ui/`.

- **Inputs:** usar `Input` desde `@/Components/ui/input`. No crear estilos de borde, fondo, focus o padding a mano. Para formularios de autenticación usar `TextInput`, que ya incorpora el estilo y el botón de mostrar contraseña.
- **Selects que listan entidades o colecciones:** usar `SearchableSelect` desde `@/Components/ui/searchable-select`. Debe permitir escribir para filtrar, mostrar estado seleccionado, estado vacío y scroll para listas largas. No usar `<select>` nativo en nuevas pantallas.
- **Selects pequeños de estados o roles:** también usar `SearchableSelect` para mantener consistencia; si el control es estrictamente booleano, preferir un switch/toggle.
- **Fechas:** usar `DatePicker` desde `@/Components/ui/date-picker`, que mantiene el icono de calendario y el estilo del `Input`. No usar un `<input type="date">` directo en nuevos módulos.
- **Fechas visibles:** usar `formatAppDate` o `formatAppDateTime` desde `@/lib/dates`; nunca mostrar timestamps ISO directamente. La zona horaria de la plataforma es `America/Bogota`.
- **Teléfonos:** usar `PhoneInputField` desde `@/Components/ui/phone-input` para todos los números telefónicos. El componente usa `react-phone-input-2`, inicia en Colombia, permite buscar país, formatea el código internacional y aplica los estilos NEXO. No usar `<input type="tel">` ni duplicar su configuración.
- **Errores:** mostrar el error debajo del campo en texto rojo pequeño, sin `alert()` del navegador.
- **Accesibilidad:** conservar `label`, `aria-label`, foco visible, navegación por teclado y áreas táctiles mínimas de 44px.
- **Modales y confirmaciones:** usar el patrón de modal de onboarding existente y `confirmToast`/`react-hot-toast` para confirmaciones CRUD.

## Loader de progreso para operaciones INSERT

- El `OperationProgressModal` se usa únicamente para operaciones INSERT: creación de registros y asociaciones que creen una relación. No se usa para `UPDATE`, `DELETE` ni cambios de estado.
- Toda operación INSERT que pueda tardar debe mostrar `OperationProgressModal` con mensajes propios del módulo. No reutilizar el mensaje genérico de otro dominio: agregar un `Operation` explícito en `resources/js/Components/OperationProgressModal.tsx`.
- Cada operación debe declarar sus etapas en `messages`, por ejemplo: crear/registrar, asociar o proteger datos, y activar/sincronizar. Los textos deben describir acciones reales del backend y estar en español para el usuario.
- El botón final debe identificarse en `finalLabels`. Si una operación usa un botón que no puede distinguirse solo por la ruta —como `Agregar medio de pago`— detectar explícitamente su texto o emitir el evento de operación correspondiente.
- El modal se monta globalmente desde `resources/js/app.tsx` para sobrevivir a las navegaciones de Inertia. No montarlo únicamente dentro de una página o layout que pueda desmontarse después del submit.
- El flujo global usa los eventos `nexo:operation-start` y `nexo:operation-complete`. El Toast de éxito debe esperar `nexo:operation-complete`; nunca debe aparecer encima del loader ni antes de que finalicen visualmente las etapas.
- Mantener una duración suficiente para leer todo el flujo: actualmente cada etapa dura aproximadamente 5 segundos y el ciclo mínimo es de 16 segundos. Si se agrega una etapa, ajustar la duración mínima para que el último paso permanezca visible.
- Las operaciones `UPDATE`, `DELETE` y cambios de estado, incluidas las iniciadas con `router.patch` o `router.delete`, deben usar `react-hot-toast` y `confirmToast` cuando requieran confirmación; no deben abrir el loader de INSERT.
- Para un INSERT, verificar el orden: clic del usuario → loader específico → respuesta backend → cierre del loader → Toast de éxito/error. Para `UPDATE`, `DELETE` o cambios de estado: clic → confirmación si aplica → respuesta backend → Toast.

## Reglas de recaudos y acceso de deportistas

- Una inscripción empieza en `pending`; el alta guiada puede crear también su primer recaudo.
- Las periodicidades admitidas son `monthly`, `biweekly`, `quarterly`, `semiannual` y `annual`; el importe representa el valor de ese periodo.
- El acceso del deportista requiere usuario activo, deportista activo, inscripción activa y un recaudo pagado cuyo `period_end` cubra la fecha actual.
- `billing:generate-monthly-charges` conserva su nombre por compatibilidad, pero genera el siguiente recaudo según `billing_frequency`, es idempotente, corre diariamente a las 00:10 y no crea cargos antes de `start_date`.
- El día siguiente al vencimiento de un recaudo impago suspende la inscripción; aprobar o registrar el pago reactiva una inscripción pendiente o suspendida.

### Ejemplo de componentes

```tsx
import { DatePicker } from '@/Components/ui/date-picker';
import { Input } from '@/Components/ui/input';
import { SearchableSelect } from '@/Components/ui/searchable-select';
import { PhoneInputField } from '@/Components/ui/phone-input';

<Input value={name} onChange={(event) => setName(event.target.value)} />
<DatePicker value={startDate} onChange={(event) => setStartDate(event.target.value)} />
<PhoneInputField label="Teléfono" value={phone} onChange={setPhone} />
<SearchableSelect
    value={clubId}
    options={clubs.map((club) => ({ id: club.id, label: club.name }))}
    onValueChange={setClubId}
    searchPlaceholder="Buscar club..."
/>
```

Los componentes comparten tokens NEXO: fondo `#0B1220`, superficie `#151E2E`, lima `#B8F34B`, bordes `slate-700` y focus lima. Si un nuevo módulo necesita una variante, extender el componente reutilizable, no duplicar clases en la página.

## Verificación local

```bash
composer test
npm run build
php artisan migrate:fresh --seed
```

## CI y despliegue Hostinger

- `.github/workflows/ci.yml` valida PHP, migraciones, tests y build frontend en cada push o pull request.
- `.github/workflows/deploy-hostinger.yml` espera a que el workflow `CI` termine correctamente para los pushes a `main`, crea un tag/release `deploy-<commit>` y no se conecta a Hostinger. La publicación en Hostinger queda para una integración futura separada.
- La integración futura con Hostinger requerirá `HOSTINGER_HOST`, `HOSTINGER_USER`, `HOSTINGER_SSH_KEY` y `HOSTINGER_APP_PATH`; `HOSTINGER_PORT` será opcional y usará `65002` por defecto. Los workflows actuales no usan estos secrets.
- El `.env`, `storage` y la base de datos viven únicamente en el servidor. El dominio debe apuntar a `HOSTINGER_APP_PATH/public`.
- No agregar secretos de producción al repositorio ni ejecutar migraciones destructivas desde el workflow.

## Flujo de trabajo

- Crear migraciones nuevas para cambios de esquema; no editar migraciones ya ejecutadas en producción.
- Documentar decisiones importantes en `docs/architecture.md` y avances en `docs/progress.md`.

## Vista guiada por módulo

- La vista guiada usa `driver.js` y se monta globalmente desde `resources/js/app.tsx` mediante `GuidedTour`.
- Todo módulo nuevo o flujo operativo nuevo debe aplicar [skills/nexo-club-guided-tours/SKILL.md](skills/nexo-club-guided-tours/SKILL.md), además de leer `docs/agent-context.md` y esta sección antes de implementarlo.
- El botón flotante de ayuda debe permanecer disponible en los layouts autenticados y de plataforma. Su etiqueta accesible y visible al hover es `Visita guiada`.
- Las guías se resuelven por el nombre del componente Inertia activo y no deben mostrar pasos de otro módulo. Los objetivos compartidos usan `data-tour="module-nav"`, `data-tour="module-header"` y `data-tour="module-content"`.
- Cada módulo debe registrar una clave estable en `GuidedTour.tsx` y definir pasos basados en su flujo real: contexto, acción principal, captura/validación, carga o confirmación y resultado cuando existan. Los objetivos específicos deben usar `data-tour` semánticos y no selectores ficticios.
- Si una vista cambia materialmente por rol, debe definir pasos separados o filtrar los pasos según el rol; no reutilizar una guía de administrador para superadmin o deportista.
- El estado de finalización se guarda en `guided_tours`, asociado a `user_id` y `tour_key`; no usar `localStorage` como fuente de verdad.
- La guía del dashboard por rol se abre automáticamente la primera vez que el usuario entra si aún no está completada. Después puede repetirse desde el botón flotante `Visita guiada` en cualquier módulo disponible.
- El backend comparte las claves completadas mediante Inertia y el endpoint `guided-tours.complete` valida que solo el usuario autenticado pueda marcar su propia guía.

## Seeders de producción

- Consultar el procedimiento completo en `docs/production-setup.md`.
- Consultar la matriz de roles y permisos en `docs/roles-and-permissions.md`.
- `PermissionSeeder` crea los permisos granulares y los sincroniza con `superadmin`, `admin`, `contador` y `usuario`.
- `PermissionSeeder` prepara el rol `deportista`, con permisos limitados a su propio perfil, inscripciones, cargos y pagos. Al crear un perfil con correo, se crea y vincula automáticamente una cuenta de acceso al club; sin correo se conserva como perfil interno. No debe mostrarse como rol operativo en Equipo.
- `AthleteAccessSeeder` regulariza perfiles antiguos sin `user_id`: reutiliza cuentas genéricas `usuario` creadas por un administrador cuando coinciden por correo, crea el acceso si no existe, asigna `deportista`, vincula al club y muestra una contraseña temporal nueva. Omite correos vacíos, cuentas administrativas y perfiles ya vinculados.
- `/mi-dashboard` es el portal privado del deportista: solo muestra sus datos, inscripciones, mensualidades, pagos e indicadores de entrenamiento demo. El formulario permite actualizar únicamente sus datos personales; las gráficas son fake hasta conectar entrenamientos y asistencias reales.
- `SuperadminUserSeeder` crea únicamente el superadmin inicial en producción; usa `SUPERADMIN_EMAIL`, `SUPERADMIN_NAME` y `SUPERADMIN_PASSWORD` desde `.env`.
- No ejecutar en producción `DemoClubSeeder`, `AdminUserSeeder`, `UsuarioUserSeeder`, `ContadorUserSeeder` ni `ClubMembersSeeder`, porque crean datos de prueba.
