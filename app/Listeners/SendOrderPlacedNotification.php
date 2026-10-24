<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\OrderPlaced;
use App\Models\Customer;
use App\Notifications\CustomerOrderPlaced;

class SendOrderPlacedNotification
{
    public function handle(OrderPlaced $event): void
    {
        Customer::query()
            ->findOrFail($event->order->customer_id)
            ->notify(new CustomerOrderPlaced($event->order));
    }
}
