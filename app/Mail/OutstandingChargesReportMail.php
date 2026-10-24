<?php

namespace App\Mail;

use App\Models\Club;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OutstandingChargesReportMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Club $club, public string $csv) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Pendientes por cobrar · {$this->club->name}");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.outstanding-charges-report');
    }

    public function attachments(): array
    {
        return [Attachment::fromData(fn () => $this->csv, 'pendientes-por-cobrar.csv')->withMime('text/csv')];
    }
}
