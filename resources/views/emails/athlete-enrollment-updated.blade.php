<h1>Inscripción registrada</h1>
<p>Hola {{ $enrollment->athlete->first_name }}, tu inscripción en <strong>{{ $enrollment->club->name }}</strong> fue registrada.</p>
<p><strong>Disciplina:</strong> {{ $enrollment->discipline?->name ?? 'No definida' }}</p>
<p><strong>Periodicidad:</strong> {{ match ($enrollment->billing_frequency) {
    'biweekly' => 'Quincenal', 'quarterly' => 'Trimestral', 'semiannual' => 'Semestral', 'annual' => 'Anual', default => 'Mensual',
} }}</p>
<p><strong>Fecha de inicio:</strong> {{ $enrollment->start_date?->format('d/m/Y') }}</p>
<p><strong>Próximo cobro:</strong> {{ $enrollment->charges->sortBy('due_date')->first()?->due_date?->format('d/m/Y') ?? 'Pendiente de generar' }}</p>
<p><strong>Estado:</strong> {{ $enrollment->status === 'active' ? 'Activa' : 'Pendiente del primer pago' }}</p>
<p>Cuando el primer pago sea aprobado, recibirás la confirmación de activación. <a href="{{ route('login') }}">Ingresar a NEXO CLUB</a></p>
