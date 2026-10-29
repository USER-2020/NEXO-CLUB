<h1>Inscripción activada</h1>
<p>Hola {{ $enrollment->athlete->first_name }}, tu inscripción en {{ $enrollment->club->name }} fue activada correctamente.</p>
<p>Disciplina: {{ $enrollment->discipline->name }}<br>Inicio: {{ $enrollment->start_date->format('d/m/Y') }}<br>Valor del periodo: ${{ number_format($enrollment->monthly_amount, 0, ',', '.') }}</p>
<p>Próximo cobro: {{ $enrollment->charges->where('status', '!=', 'paid')->sortBy('due_date')->first()?->due_date?->format('d/m/Y') ?? app(\App\Services\BillingPeriodService::class)->nextStart($enrollment->charges->sortByDesc('period_end')->first()?->period ?? $enrollment->start_date, $enrollment->billing_frequency ?? 'monthly')->format('d/m/Y') }}</p>
<p><a href="{{ route('dashboard') }}" style="display:inline-block;padding:12px 20px;background:#B8F34B;color:#0B1220;text-decoration:none;border-radius:8px;font-weight:bold">Ingresar a mi dashboard</a></p>
<p>Cuando ingreses, podrás consultar la vigencia de tu inscripción, tus recaudos y los medios de pago autorizados por el club.</p>
