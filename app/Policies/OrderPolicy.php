<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Customer;
use App\Models\Order;

class OrderPolicy
{
    public function viewAny(Customer $customer): bool
    {
        return true;
    }

    public function view(Customer $customer, Order $order): bool
    {
        return $customer->id === $order->customer_id;
    }
}
