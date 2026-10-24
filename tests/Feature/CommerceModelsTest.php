<?php

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Product;
use App\Models\SubOrder;
use App\Models\Tenant;
use App\Models\User;

test('commerce migrations and model relationships support a full customer order', function () {
    $customer = Customer::create([
        'name' => 'Shopper',
        'email' => 'shopper-commerce@example.com',
        'password' => 'password',
    ]);
    $tenant = Tenant::create([
        'name' => 'Commerce Store',
        'slug' => 'commerce-store',
        'email' => 'commerce@example.com',
    ]);
    $branch = $tenant->branches()->create([
        'name' => 'Main Branch',
        'address' => '10 Market Road',
        'city' => 'Dhaka',
        'phone' => '+880 1712-345678',
    ]);
    $category = Category::create([
        'name' => 'Clothing',
        'slug' => 'commerce-clothing',
    ]);
    $product = Product::create([
        'tenant_id' => $tenant->id,
        'category_id' => $category->id,
        'name' => 'Cotton Shirt',
        'slug' => 'commerce-cotton-shirt',
        'description' => 'A comfortable cotton shirt.',
        'base_price' => 1200,
    ]);
    $variant = $product->variants()->create([
        'sku' => 'COMMERCE-SHIRT-M',
        'size' => 'M',
    ]);

    $cart = $customer->carts()->create(['session_id' => 'guest-session']);
    $cartItem = $cart->items()->create([
        'variant_id' => $variant->id,
        'branch_id' => $branch->id,
        'quantity' => 2,
    ]);
    $wishlist = $customer->wishlists()->create(['product_id' => $product->id]);
    $order = $customer->orders()->create([
        'order_no' => 'ORD-COMMERCE-001',
        'shipping_address' => ['city' => 'Dhaka', 'address_line' => '1 Main Street'],
        'subtotal' => 2400,
        'shipping_fee' => 60,
        'discount' => 0,
        'total' => 2460,
        'payment_method' => 'bkash',
    ]);
    $subOrder = $order->subOrders()->create([
        'tenant_id' => $tenant->id,
        'branch_id' => $branch->id,
        'total' => 2460,
        'status' => 'pending',
    ]);
    $orderItem = $subOrder->items()->create([
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'name' => $product->name,
        'price' => 1200,
        'quantity' => 2,
    ]);
    $tracking = $subOrder->trackings()->create([
        'status' => 'confirmed',
        'note' => 'Order received.',
    ]);
    $payment = $order->payments()->create([
        'method' => 'bkash',
        'amount' => 2460,
        'transaction_id' => 'TX-COMMERCE-001',
        'payload' => ['source' => 'test'],
    ]);
    $review = $customer->reviews()->create([
        'product_id' => $product->id,
        'order_item_id' => $orderItem->id,
        'rating' => 5,
        'comment' => 'Great fit.',
    ]);
    $coupon = Coupon::create([
        'code' => 'COMMERCE10',
        'type' => 'percent',
        'value' => 10,
        'tenant_id' => $tenant->id,
    ]);

    expect($cart->customer->is($customer))->toBeTrue()
        ->and($cart->items->first()->is($cartItem))->toBeTrue()
        ->and($cartItem->variant->is($variant))->toBeTrue()
        ->and($cartItem->branch->is($branch))->toBeTrue()
        ->and($wishlist->customer->is($customer))->toBeTrue()
        ->and($wishlist->product->is($product))->toBeTrue()
        ->and($order->customer->is($customer))->toBeTrue()
        ->and($order->shipping_address)->toBe(['city' => 'Dhaka', 'address_line' => '1 Main Street'])
        ->and($order->subOrders->first()->is($subOrder))->toBeTrue()
        ->and($subOrder->tenant->is($tenant))->toBeTrue()
        ->and($subOrder->branch->is($branch))->toBeTrue()
        ->and($subOrder->items->first()->is($orderItem))->toBeTrue()
        ->and($orderItem->product->is($product))->toBeTrue()
        ->and($orderItem->variant->is($variant))->toBeTrue()
        ->and($subOrder->trackings->first()->is($tracking))->toBeTrue()
        ->and($order->payments->first()->is($payment))->toBeTrue()
        ->and($payment->payload)->toBe(['source' => 'test'])
        ->and($review->orderItem->is($orderItem))->toBeTrue()
        ->and($coupon->tenant->is($tenant))->toBeTrue()
        ->and($tenant->subOrders->first()->is($subOrder))->toBeTrue()
        ->and($tenant->coupons->first()->is($coupon))->toBeTrue();
});

test('sub-orders are scoped to staff tenant and inherit its tenant id when created', function () {
    $tenant = Tenant::create([
        'name' => 'Scoped Store',
        'slug' => 'scoped-store',
        'email' => 'scoped@example.com',
    ]);
    $otherTenant = Tenant::create([
        'name' => 'Other Scoped Store',
        'slug' => 'other-scoped-store',
        'email' => 'other-scoped@example.com',
    ]);
    $category = Category::create([
        'name' => 'Scoped Category',
        'slug' => 'scoped-category',
    ]);
    $product = Product::create([
        'tenant_id' => $tenant->id,
        'category_id' => $category->id,
        'name' => 'Scoped Product',
        'slug' => 'scoped-product',
        'description' => 'A product for tenant scope verification.',
        'base_price' => 100,
    ]);
    $customer = Customer::create([
        'name' => 'Scoped Shopper',
        'email' => 'scoped-shopper@example.com',
        'password' => 'password',
    ]);
    $order = $customer->orders()->create([
        'order_no' => 'ORD-SCOPED-001',
        'shipping_address' => ['city' => 'Dhaka'],
        'subtotal' => 100,
        'total' => 100,
        'payment_method' => 'cod',
    ]);
    $otherBranch = $otherTenant->branches()->create([
        'name' => 'Other Branch',
        'address' => '2 Market Road',
        'city' => 'Dhaka',
        'phone' => '123456',
    ]);
    SubOrder::withoutGlobalScopes()->create([
        'order_id' => $order->id,
        'tenant_id' => $otherTenant->id,
        'branch_id' => $otherBranch->id,
        'total' => 100,
    ]);

    $user = User::factory()->create(['tenant_id' => $tenant->id]);
    $this->actingAs($user, 'web');
    $branch = $tenant->branches()->create([
        'name' => 'My Branch',
        'address' => '1 Market Road',
        'city' => 'Dhaka',
        'phone' => '654321',
    ]);
    $subOrder = SubOrder::create([
        'order_id' => $order->id,
        'tenant_id' => $otherTenant->id,
        'branch_id' => $branch->id,
        'total' => 100,
    ]);

    expect(SubOrder::query()->count())->toBe(1)
        ->and($subOrder->tenant_id)->toBe($tenant->id)
        ->and(SubOrder::query()->first()->is($subOrder))->toBeTrue();
});
