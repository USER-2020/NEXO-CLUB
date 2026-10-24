export const APP_TIME_ZONE = 'America/Bogota';

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: APP_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: APP_TIME_ZONE,
});

function parseAppDate(value: string) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T12:00:00-05:00`);
    }

    return new Date(value);
}

export function formatAppDate(value?: string | null) {
    if (!value) return 'Sin fecha';

    const date = parseAppDate(value);
    return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

export function formatAppDateTime(value?: string | null) {
    if (!value) return 'Sin fecha';

    const date = parseAppDate(value);
    return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
}
