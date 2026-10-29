<h1>Acceso a NEXO CLUB</h1>
<p>Hola {{ $athlete->first_name }}, tu perfil fue registrado en {{ $athlete->club->name }}.</p>
<p>Estos son tus datos de acceso:</p>
<p><strong>Correo:</strong> {{ $athlete->email }}</p>
<p><strong>Contraseña temporal:</strong> {{ $temporaryPassword }}</p>
@if ($enrollment)
    <h2>Datos de tu inscripción</h2>
    <p><strong>Disciplina:</strong> {{ $enrollment->discipline?->name ?? 'No definida' }}</p>
    <p><strong>Periodicidad:</strong> {{ match ($enrollment->billing_frequency) {
        'biweekly' => 'Quincenal',
        'quarterly' => 'Trimestral',
        'semiannual' => 'Semestral',
        'annual' => 'Anual',
        default => 'Mensual',
    } }}</p>
    <p><strong>Fecha de inicio:</strong> {{ $enrollment->start_date?->format('d/m/Y') }}</p>
    <p><strong>Próximo cobro:</strong> {{ $enrollment->charges->sortBy('due_date')->first()?->due_date?->format('d/m/Y') ?? 'Pendiente de generar' }}</p>
    <p><strong>Estado:</strong> {{ $enrollment->status === 'active' ? 'Activa' : 'Pendiente del primer pago' }}</p>
@endif
<p>Ingresa desde <a href="{{ url('/login') }}">NEXO CLUB</a> y cambia tu contraseña desde tu perfil.</p>
<p>El acceso se habilitará cuando exista una inscripción activa y un pago vigente.</p>
