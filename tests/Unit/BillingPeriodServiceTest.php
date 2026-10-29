<?php

namespace Tests\Unit;

use App\Services\BillingPeriodService;
use Carbon\Carbon;
use PHPUnit\Framework\TestCase;

class BillingPeriodServiceTest extends TestCase
{
    public function test_next_start_is_calculated_from_the_payment_date_for_each_frequency(): void
    {
        $service = new BillingPeriodService;
        $anchor = Carbon::parse('2026-10-29');

        $this->assertSame('2026-11-29', $service->nextStart($anchor, 'monthly')->toDateString());
        $this->assertSame('2026-11-13', $service->nextStart($anchor, 'biweekly')->toDateString());
        $this->assertSame('2027-01-29', $service->nextStart($anchor, 'quarterly')->toDateString());
        $this->assertSame('2027-04-29', $service->nextStart($anchor, 'semiannual')->toDateString());
        $this->assertSame('2027-10-29', $service->nextStart($anchor, 'annual')->toDateString());
    }
}
