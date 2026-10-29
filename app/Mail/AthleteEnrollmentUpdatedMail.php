<?php

namespace App\Mail;

use App\Models\Enrollment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AthleteEnrollmentUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Enrollment $enrollment) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Tu inscripción fue registrada · NEXO CLUB');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.athlete-enrollment-updated');
    }
}
