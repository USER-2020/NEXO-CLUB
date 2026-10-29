<?php

namespace App\Mail;

use App\Models\Athlete;
use App\Models\Enrollment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AthleteAccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Athlete $athlete, public string $temporaryPassword, public ?Enrollment $enrollment = null) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Tu acceso a NEXO CLUB');
    }

    public function content(): Content
    {
        return new Content(view: 'emails/athlete-access');
    }
}
