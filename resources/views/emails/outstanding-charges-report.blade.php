<div lang="es" style="max-width:640px;margin:0 auto;color:#151e2e;font-family:Arial,sans-serif;line-height:1.5">
    <h1 style="margin:0 0 8px;font-size:26px">Pendientes por cobrar</h1>
    <p style="margin:0 0 16px">{{ $club->name }} · {{ count($charges) }} {{ count($charges) === 1 ? 'cobro' : 'cobros' }}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        @foreach ($charges as $charge)
            <tr>
                <td style="padding:12px 10px 12px 0;border-top:1px solid #dbe2ea;vertical-align:middle">
                    <strong>{{ $charge['athlete'] }}</strong><br>
                    <span style="color:#475569;font-size:14px">{{ $charge['discipline'] }} · {{ $charge['status'] }}</span><br>
                    <span style="font-size:14px">Vence el {{ $charge['due_date']->format('d/m/Y') }} · <strong>${{ number_format($charge['amount'], 0, ',', '.') }} COP</strong></span>
                </td>
                <td align="right" style="padding:12px 0;border-top:1px solid #dbe2ea;vertical-align:middle">
                    @if ($charge['whatsapp_url'])
                        <a href="{{ $charge['whatsapp_url'] }}" aria-label="Abrir WhatsApp para {{ $charge['athlete'] }}" style="display:inline-block;padding:11px 12px;border-radius:6px;background:#166534;color:#fff;font-size:14px;font-weight:bold;text-decoration:none;white-space:nowrap">WhatsApp</a>
                    @else
                        <span style="color:#475569;font-size:13px">Sin teléfono disponible</span>
                    @endif
                </td>
            </tr>
        @endforeach
    </table>
    <p style="margin:18px 0 0">El archivo Excel adjunto contiene el detalle por período. <a href="{{ url('/mensualidades') }}">Ver recaudos en NEXO CLUB</a>.</p>
</div>
