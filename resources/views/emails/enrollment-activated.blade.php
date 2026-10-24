<h1>Inscripción activada</h1>
<p>Hola {{ $enrollment->athlete->first_name }}, tu inscripción en {{ $enrollment->club->name }} fue activada correctamente.</p>
<p>Disciplina: {{ $enrollment->discipline->name }}<br>Inicio: {{ $enrollment->start_date->format('d/m/Y') }}<br>Mensualidad: ${{ number_format($enrollment->monthly_amount, 0, ',', '.') }}</p>
<p><a href="{{ url('/login') }}">Abrir NEXO CLUB</a></p>
<p>Cuando ingreses, podrás consultar la información de tu mensualidad y los medios de pago autorizados por el club.</p>
