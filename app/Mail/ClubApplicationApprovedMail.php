<?php

namespace App\Mail;

use App\Models\ClubApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClubApplicationApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ClubApplication $application) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Tu club fue aprobado · NEXO CLUB');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.club-application-approved');
    }
}
