<h1>{{ $kind === 'due' ? 'Tu mensualidad vence hoy' : 'Recordatorio de mensualidad' }}</h1>
<p>Hola {{ $charge->enrollment->athlete->first_name }}, tienes un pago pendiente en {{ $charge->club->name }}.</p>
<p>Disciplina: {{ $charge->enrollment->discipline->name }}<br>Vencimiento: {{ $charge->due_date->format('d/m/Y') }}<br>Valor: ${{ number_format($charge->amount, 0, ',', '.') }}</p>
<p><a href="{{ url('/login') }}">Abrir NEXO CLUB</a></p>
<p>Después de iniciar sesión, entra a <a href="{{ url('/mensualidades') }}">Mensualidades</a> para consultar las cuentas bancarias, Nequi o llaves habilitadas por el club.</p>
