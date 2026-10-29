<h1>Solicitud recibida</h1>
<p>Hola {{ $application->user->name }}, recibimos la solicitud para registrar <strong>{{ $application->club_name }}</strong> en NEXO CLUB.</p>
<p>Tu cuenta quedó pendiente de revisión por el equipo de NEXO. Te avisaremos por este medio cuando sea aprobada.</p>
<p>Antes de continuar, confirma que este correo te pertenece:</p>
<p><a href="{{ $verificationUrl }}">Confirmar mi correo electrónico</a></p>
<p>El enlace vence en 24 horas. No podrás iniciar sesión ni operar el club hasta que el correo sea confirmado y la solicitud sea aprobada.</p>
