<h1>Tu cuenta ya está activa</h1>
<p>Hola {{ $enrollment->athlete->first_name }}, tu pago fue aprobado y tu inscripción en <strong>{{ $enrollment->club->name }}</strong> ya está activa.</p>
<p><strong>Disciplina:</strong> {{ $enrollment->discipline?->name ?? 'No definida' }}</p>
<p><strong>Fecha de inicio:</strong> {{ $enrollment->start_date?->format('d/m/Y') }}</p>
<p><strong>Próximo cobro:</strong> {{ app(\App\Services\BillingPeriodService::class)->nextStart($enrollment->charges->sortByDesc('period_end')->first()?->period ?? $enrollment->start_date, $enrollment->billing_frequency ?? 'monthly')->format('d/m/Y') }}</p>
<p><a href="{{ route('dashboard') }}" style="display:inline-block;padding:12px 20px;background:#B8F34B;color:#0B1220;text-decoration:none;border-radius:8px;font-weight:bold">Ingresar a mi dashboard</a></p>
