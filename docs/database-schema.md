# Esquema de base de datos — Entrega 1

## Tablas creadas

| Tabla | Propósito | Aislamiento |
|---|---|---|
| `clubs` | Espacio deportivo y configuración regional | Identidad del tenant |
| `club_settings` | Tarifas y reglas iniciales del club | `club_id` único |
| `club_user` | Membresía y club por defecto del usuario | Única por club/usuario |
| `disciplines` | Disciplinas disponibles | `club_id` + nombre único |
| `club_locations` | Sedes o lugares del club | `club_id` + nombre único |
| `athletes` | Perfil permanente, contacto y datos físicos básicos | `club_id` + documento |
| `enrollments` | Asociación de deportista, disciplina y mensualidad | `club_id` |
| `monthly_charges` | Cargo mensual por inscripción y período | inscripción + período único |
| `payments` | Pago aplicado a un cargo mensual | `club_id` + cargo |
| `audit_logs` | Auditoría de accesos y operaciones CRUD | usuario/club opcionales |

## Relaciones

- `users` ↔ `clubs`: muchos a muchos mediante `club_user`.
- `clubs` → `club_settings`: uno a uno.
- `clubs` → `disciplines`: uno a muchos.
- `clubs` → `club_locations`: uno a muchos.
- `clubs` → `athletes`: uno a muchos.
- `athletes` → `enrollments`: uno a muchos.
- `disciplines` → `enrollments`: uno a muchos.
- `enrollments` → `monthly_charges`: uno a muchos.
- `monthly_charges` → `payments`: uno a uno en el flujo actual.
- Las claves foráneas usan borrado en cascada para datos de configuración y membresías.

## Contexto de permisos

Spatie Permission Teams usa `team_id` como identificador de club. La migración base ya crea las columnas cuando se ejecuta con Teams activado; `2026_10_23_210001_add_teams_to_permission_tables.php` agrega las columnas faltantes en instalaciones que tenían la migración anterior sin Teams.

## Deportistas y estados

`athletes` contiene identidad, tipo de documento (`tarjeta_identidad`, `cedula_ciudadania`, `pasaporte`, `otro`), número de documento, contacto, acudiente y datos físicos opcionales: `height_cm`, `weight_kg`, `shirt_size`, `shoe_size`. `photo_path` apunta a un archivo privado y se consulta por una ruta autenticada del club activo.

Estados actuales: deportista `active/inactive`; inscripción `pending/active/suspended/cancelled`; cargo mensual `pending/paid/overdue`. `end_date` permanece `NULL` hasta cancelar la inscripción.

## Futuras tablas

Las tablas de acudientes normalizados, medidas históricas, tests, mesociclos, macrociclos, entrenadores, entrenamientos, auditoría y notificaciones se añadirán mediante migraciones separadas.
