<?php

return [
    'notifications' => [
        // Preparado para producción, pero apagado por defecto hasta configurar SMTP.
        'enabled' => (bool) env('NEXO_NOTIFICATIONS_ENABLED', false),
        'from_address' => env('MAIL_FROM_ADDRESS', 'noreply@nexo.club'),
        'from_name' => env('MAIL_FROM_NAME', 'NEXO CLUB'),
    ],
];
