<?php

namespace App\Mail;

use App\Models\Enrollment;
use App\Models\MonthlyCharge;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EnrollmentSuspendedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Enrollment $enrollment, public ?MonthlyCharge $charge = null, public bool $forAdmin = false) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Inscripción suspendida por falta de pago · NEXO CLUB');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.enrollment-suspended');
    }
}
