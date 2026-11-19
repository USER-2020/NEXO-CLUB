<h1>Inscripción suspendida</h1>
@if ($forAdmin)
    <p>La inscripción de <strong>{{ $enrollment->athlete->first_name }} {{ $enrollment->athlete->last_name }}</strong> en {{ $enrollment->club->name }} está suspendida porque no registramos el pago pendiente.</p>
@else
    <p>Hola {{ $enrollment->athlete->first_name }},</p>
    <p>La inscripción de {{ $enrollment->discipline?->name ?? 'tu disciplina' }} en <strong>{{ $enrollment->club->name }}</strong> está suspendida porque no registramos el pago pendiente.</p>
@endif
@if ($charge)
    <p><strong>Vencimiento:</strong> {{ $charge->due_date?->format('d/m/Y') }}<br><strong>Valor:</strong> ${{ number_format($charge->amount, 0, ',', '.') }}</p>
@endif
<p>Comunícate con el club o registra el pago para solicitar la reactivación de la inscripción.</p>
<p><a href="{{ url('/login') }}">Ingresar a NEXO CLUB</a></p>
