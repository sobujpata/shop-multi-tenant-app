<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Support\Facades\DB;

class ReviewPolicy
{
    public function create(Customer $customer, Product $product): bool
    {
        if (Review::query()
            ->where('customer_id', $customer->id)
            ->where('product_id', $product->id)
            ->exists()) {
            return false;
        }

        return DB::table('order_items')
            ->join('sub_orders', 'sub_orders.id', '=', 'order_items.sub_order_id')
            ->join('orders', 'orders.id', '=', 'sub_orders.order_id')
            ->where('orders.customer_id', $customer->id)
            ->where('sub_orders.status', 'delivered')
            ->where('order_items.product_id', $product->id)
            ->exists();
    }
}
