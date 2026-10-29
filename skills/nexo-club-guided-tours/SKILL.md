---
name: nexo-club-guided-tours
description: Crear o actualizar módulos NEXO CLUB con una guía Driver.js coherente con su contenido, roles, acciones y estados reales. Usar al construir un módulo nuevo, una vista operativa nueva o un flujo que deba documentarse.
---

# Guías Driver.js de NEXO CLUB

Esta skill acompaña cada módulo nuevo para que su visita guiada explique el flujo real de la pantalla y no reutilice pasos de otro módulo.

## Antes de editar

Lee `docs/agent-context.md`, `AGENTS.md` y revisa `resources/js/Components/GuidedTour.tsx`. Identifica:

- componente Inertia exacto;
- rol o roles autorizados;
- módulo, componente y flujo que se está construyendo;
- acciones principales y estados visibles reales;
- video o Hyperframe asociado, si el catálogo de documentación debe crecer.

## Implementación obligatoria

1. Registra el componente en el catálogo `tours` de `GuidedTour.tsx` con una clave única, estable y segura.
2. Declara los objetivos compartidos cuando apliquen: `data-tour="module-nav"`, `data-tour="module-header"` y `data-tour="module-content"`.
3. Añade objetivos específicos al markup del módulo para que la guía explique su flujo real. Usa nombres semánticos y únicos, por ejemplo `data-tour="athlete-create"`, `data-tour="enrollment-billing"` o `data-tour="club-approval"`.
4. Define los pasos en `GuidedTour.tsx` asociados al componente Inertia. Como mínimo, una guía operativa debe cubrir contexto, entrada o acción principal, captura/validación, estado de procesamiento o resultado y siguiente acción cuando existan.
5. Los textos deben describir la interfaz real y el rol real. No inventes botones, datos, estados, permisos o resultados que la pantalla no tenga.
6. Si un objetivo no existe porque la colección está vacía o el rol no tiene esa acción, omite ese paso; nunca apuntes a un selector ficticio.
7. Conserva la persistencia en `guided_tours`; no uses `localStorage`. La finalización se registra mediante `guided-tours.complete` para el usuario autenticado.
8. Si el módulo tiene varias vistas o roles con flujos diferentes, define claves y pasos separados cuando el contenido o los permisos cambien materialmente.
9. Todo componente registrado en `GuidedTour.tsx` debe abrir su guía automáticamente en la primera visita del usuario cuando aún no figure como completada en `guided_tours`; no limitar este comportamiento a dashboards. El botón `Visita guiada` debe permitir repetirla.

## Contenido de la guía

La guía debe explicar el flujo de la pantalla, no solo sus zonas visuales. Prioriza esta secuencia cuando exista:

- propósito del módulo y alcance del club activo;
- acción principal y quién puede ejecutarla;
- campos, filtros o asociaciones requeridas;
- validación, loader de INSERT o confirmación de UPDATE/DELETE;
- estado vacío, lista resultante, error o confirmación final;
- relación con el siguiente módulo del proceso.

Los pasos deben ser cortos, en español, accesibles por teclado y compatibles con móvil. El botón global `Visita guiada` debe seguir disponible para repetirlos.

## Documentación y video

Si el módulo pertenece al catálogo de documentación:

- registra rol, módulo, componente, flujo y video en `resources/js/Pages/FlowDocumentation/Index.tsx`;
- reutiliza `SearchableSelect` para filtros que representen colecciones;
- enlaza solo un MP4 existente en `public/flow-videos/`;
- si aún no existe, muestra `Video en producción`;
- actualiza la composición Hyperframe y ejecuta `npm run videos:render` cuando corresponda.

## Verificación

Antes de entregar:

- navega cada rol autorizado y comprueba que la guía no muestre pasos de otro módulo;
- verifica que todos los objetivos visibles existan en la pantalla;
- comprueba el flujo de primera visita y repetición desde `Visita guiada`;
- comprueba el autoarranque de la primera visita en cada componente registrado, no solo en dashboards;
- comprueba el estado completado del usuario en `guided_tours`;
- ejecuta `npm run build` y las pruebas backend relacionadas;
- revisa que los pasos no oculten controles, no desborden en móvil y no dependan de datos ficticios.
