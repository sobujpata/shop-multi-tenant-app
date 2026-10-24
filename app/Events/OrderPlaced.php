<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Order;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

class OrderPlaced implements ShouldDispatchAfterCommit
{
    public function __construct(public readonly Order $order) {}
}
