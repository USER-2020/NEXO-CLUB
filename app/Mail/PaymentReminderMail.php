<?php

namespace App\Mail;

use App\Models\MonthlyCharge;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public MonthlyCharge $charge, public string $kind) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->kind === 'due' ? 'Tu mensualidad vence hoy · NEXO CLUB' : 'Recordatorio de mensualidad · NEXO CLUB');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.payment-reminder');
    }
}
