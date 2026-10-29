<h1>Tu club fue aprobado</h1>
<p>Hola {{ $application->user->name }}, la solicitud para <strong>{{ $application->approvedClub->name }}</strong> fue aprobada.</p>
<p>Tu cuenta ya está activa y quedó asociada como administradora principal del club.</p>
<p><a href="{{ url('/login') }}">Ingresar a NEXO CLUB</a></p>
