<?php

use App\Jobs\RecalculateProductRating;
use App\Models\Branch;
use App\Models\BranchDeliveryCost;
use App\Models\BranchStock;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Divisiontounion;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Models\Tenant;
use App\Services\CartService;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * @return array{tenant: Tenant, branch: Branch, product: Product, variant: ProductVariant, deliveryCost: BranchDeliveryCost}
 */
function cartTestCatalog(int $stock = 5, ?string $branchName = null): array
{
    $tenant = Tenant::query()->create([
        'name' => 'Cart Store '.uniqid(),
        'slug' => 'cart-store-'.uniqid(),
        'email' => 'cart-store-'.uniqid().'@example.com',
        'status' => 'active',
    ]);
    $category = Category::query()->create([
        'name' => 'Cart Category '.uniqid(),
        'slug' => 'cart-category-'.uniqid(),
    ]);
    $product = Product::withoutGlobalScopes()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $category->id,
        'name' => 'Test shirt',
        'slug' => 'test-shirt-'.uniqid(),
        'description' => 'A test product',
        'gender' => 'unisex',
        'base_price' => 100,
        'sale_price' => null,
        'rating_avg' => 0,
        'rating_count' => 0,
        'is_active' => true,
    ]);
    $variant = ProductVariant::query()->create([
        'product_id' => $product->id,
        'sku' => 'CART-'.strtoupper(uniqid()),
        'size' => 'M',
        'color' => 'Blue',
        'price' => null,
    ]);
    $branch = Branch::withoutGlobalScopes()->create([
        'tenant_id' => $tenant->id,
        'name' => $branchName ?? 'Cart branch',
        'address' => '1 Test Road',
        'city' => 'Dhaka',
        'phone' => '+8801000000000',
        'is_active' => true,
    ]);
    BranchStock::query()->create([
        'branch_id' => $branch->id,
        'variant_id' => $variant->id,
        'quantity' => $stock,
    ]);
    $deliveryCost = $branch->deliveryCosts()->create([
        'area' => 'Inside Dhaka',
        'cost' => 50,
    ]);

    return compact('tenant', 'branch', 'product', 'variant', 'deliveryCost');
}

test('cart mutations enforce current branch stock', function () {
    $catalog = cartTestCatalog(stock: 3);
    $this->actingAs(Customer::factory()->create(), 'customer');

    $this->postJson('/cart/items', [
        'variant_id' => $catalog['variant']->id,
        'branch_id' => $catalog['branch']->id,
        'quantity' => 2,
    ])->assertOk()
        ->assertJsonPath('cart.count', 2)
        ->assertJsonPath('cart.items.0.product.name', 'Test shirt');

    $cartItem = CartItem::query()->firstOrFail();
    $this->patchJson("/cart/items/{$cartItem->id}", ['quantity' => 4])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('quantity');
    $this->patchJson("/cart/items/{$cartItem->id}", ['quantity' => 3])
        ->assertOk()
        ->assertJsonPath('cart.count', 3);

    $this->deleteJson("/cart/items/{$cartItem->id}")
        ->assertOk()
        ->assertJsonPath('cart.count', 0);
});

test('customer Login event merges guest carts and caps combined quantities at stock', function () {
    $catalog = cartTestCatalog(stock: 3);
    $customer = Customer::factory()->create();
    $sessionId = 'guest-session-'.uniqid();
    $this->get('/cart')->assertOk();
    request()->session()->put(CartService::GUEST_SESSION_KEY, $sessionId);

    $guestCart = Cart::query()->create([
        'session_id' => $sessionId,
    ]);
    $guestCart->items()->create([
        'variant_id' => $catalog['variant']->id,
        'branch_id' => $catalog['branch']->id,
        'quantity' => 2,
    ]);
    $customerCart = Cart::query()->create(['customer_id' => $customer->id]);
    $customerCart->items()->create([
        'variant_id' => $catalog['variant']->id,
        'branch_id' => $catalog['branch']->id,
        'quantity' => 2,
    ]);

    event(new Login('web', $customer, false));
    $this->assertDatabaseHas('carts', ['id' => $guestCart->id]);

    event(new Login('customer', $customer, false));

    expect($customerCart->items()->firstOrFail()->quantity)->toBe(3);
    $this->assertDatabaseMissing('carts', ['id' => $guestCart->id]);
});

test('checkout creates branch shipments snapshots totals decrements stock and clears cart', function () {
    $first = cartTestCatalog(stock: 5, branchName: 'Central branch');
    $secondBranch = Branch::withoutGlobalScopes()->create([
        'tenant_id' => $first['tenant']->id,
        'name' => 'North branch',
        'address' => '2 Test Road',
        'city' => 'Dhaka',
        'phone' => '+8801000000001',
        'is_active' => true,
    ]);
    $secondDeliveryCost = $secondBranch->deliveryCosts()->create([
        'area' => 'Central Dhaka',
        'cost' => 70,
    ]);
    BranchStock::query()->create([
        'branch_id' => $secondBranch->id,
        'variant_id' => $first['variant']->id,
        'quantity' => 4,
    ]);
    $customer = Customer::factory()->create();
    $customer->addresses()->create([
        'label' => 'Home',
        'recipient_name' => 'Test Shopper',
        'phone' => '+8801000000000',
        'address_line' => '10 Main Street',
        'division' => 'Dhaka',
        'district' => 'Dhaka',
        'upazila' => 'Dhanmondi',
        'postal_code' => '1200',
        'is_default' => true,
    ]);
    $cart = Cart::query()->create(['customer_id' => $customer->id]);
    $cart->items()->create([
        'variant_id' => $first['variant']->id,
        'branch_id' => $first['branch']->id,
        'quantity' => 2,
    ]);
    $cart->items()->create([
        'variant_id' => $first['variant']->id,
        'branch_id' => $secondBranch->id,
        'quantity' => 1,
    ]);
    Coupon::query()->create([
        'code' => 'SAVE10',
        'type' => 'percent',
        'value' => 10,
        'min_order' => 0,
        'usage_limit' => 10,
        'used_count' => 0,
    ]);
    Divisiontounion::create([
        'divisions' => 'Dhaka',
        'districts' => 'Dhaka',
        'upazilas' => 'Dhanmondi',
        'unions' => 'Ward 15',
        'postoffices' => 'Dhanmondi',
        'postcodes' => '1209',
    ]);

    $this->actingAs($customer, 'customer');
    $this->get('/customer/checkout')->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Checkout/Index')
            ->where('locations.0', [
                'division' => 'Dhaka',
                'district' => 'Dhaka',
                'upazila' => 'Dhanmondi',
            ])
            ->where("deliveryAreas.{$first['branch']->id}.0.area", 'Inside Dhaka')
            ->where("deliveryAreas.{$secondBranch->id}.0.area", 'Central Dhaka'));

    $this->post('/customer/checkout', [
        'address_id' => $customer->addresses()->first()->id,
        'payment_method' => 'cod',
        'coupon_code' => 'save10',
        'delivery_cost_ids' => [
            $first['branch']->id => $first['deliveryCost']->id,
            $secondBranch->id => $secondDeliveryCost->id,
        ],
    ])
        ->assertRedirect();

    $this->assertDatabaseHas('orders', [
        'customer_id' => $customer->id,
        'subtotal' => '300.00',
        'shipping_fee' => '120.00',
        'discount' => '30.00',
        'total' => '390.00',
        'payment_method' => 'cod',
    ]);
    $this->assertDatabaseCount('sub_orders', 2);
    $this->assertDatabaseCount('order_items', 2);
    $this->assertDatabaseCount('order_trackings', 2);
    $this->assertDatabaseHas('branch_stocks', [
        'branch_id' => $first['branch']->id,
        'variant_id' => $first['variant']->id,
        'quantity' => 3,
    ]);
    $this->assertDatabaseHas('branch_stocks', [
        'branch_id' => $secondBranch->id,
        'variant_id' => $first['variant']->id,
        'quantity' => 3,
    ]);
    $this->assertDatabaseHas('coupons', ['code' => 'SAVE10', 'used_count' => 1]);
    expect(Order::query()->firstOrFail()->shipping_address['delivery_areas'])
        ->toMatchArray([
            $first['branch']->id => ['area' => 'Inside Dhaka', 'cost' => '50.00'],
            $secondBranch->id => ['area' => 'Central Dhaka', 'cost' => '70.00'],
        ]);
    expect($cart->items()->count())->toBe(0);
});

test('checkout can save a new delivery address', function () {
    $catalog = cartTestCatalog();
    $customer = Customer::factory()->create();
    $cart = Cart::query()->create(['customer_id' => $customer->id]);
    $cart->items()->create([
        'variant_id' => $catalog['variant']->id,
        'branch_id' => $catalog['branch']->id,
        'quantity' => 1,
    ]);

    $this->actingAs($customer, 'customer')
        ->post('/customer/checkout', [
            'label' => 'Work',
            'recipient_name' => 'Test Shopper',
            'phone' => '+8801000000000',
            'address_line' => '20 Office Road',
            'division' => 'Dhaka',
            'district' => 'Dhaka',
            'upazila' => 'Dhanmondi',
            'postal_code' => '1200',
            'payment_method' => 'cod',
            'delivery_cost_ids' => [
                $catalog['branch']->id => $catalog['deliveryCost']->id,
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('customer_addresses', [
        'customer_id' => $customer->id,
        'label' => 'Work',
        'address_line' => '20 Office Road',
    ]);
    $order = Order::query()->where('customer_id', $customer->id)->firstOrFail();
    expect($order->shipping_address)
        ->toMatchArray([
            'recipient_name' => 'Test Shopper',
            'division' => 'Dhaka',
            'district' => 'Dhaka',
            'upazila' => 'Dhanmondi',
            'postal_code' => '1200',
        ]);
});

test('checkout splits a multi-tenant cart and decrements each tenant branch stock', function () {
    $first = cartTestCatalog(stock: 4);
    $second = cartTestCatalog(stock: 3);
    $customer = Customer::factory()->create();
    $address = $customer->addresses()->create([
        'label' => 'Home',
        'recipient_name' => 'Multi Store Shopper',
        'phone' => '+8801000000000',
        'address_line' => '10 Main Street',
        'division' => 'Dhaka',
        'district' => 'Dhaka',
        'upazila' => 'Dhanmondi',
        'is_default' => true,
    ]);
    $cart = Cart::query()->create(['customer_id' => $customer->id]);
    $cart->items()->create([
        'variant_id' => $first['variant']->id,
        'branch_id' => $first['branch']->id,
        'quantity' => 2,
    ]);
    $cart->items()->create([
        'variant_id' => $second['variant']->id,
        'branch_id' => $second['branch']->id,
        'quantity' => 1,
    ]);

    $this->actingAs($customer, 'customer')
        ->post('/customer/checkout', [
            'address_id' => $address->id,
            'payment_method' => 'cod',
            'delivery_cost_ids' => [
                $first['branch']->id => $first['deliveryCost']->id,
                $second['branch']->id => $second['deliveryCost']->id,
            ],
        ])
        ->assertRedirect();

    $order = Order::query()->where('customer_id', $customer->id)->firstOrFail();
    $subOrders = $order->subOrders()->with('items')->get();

    expect($subOrders)->toHaveCount(2)
        ->and($subOrders->pluck('tenant_id')->sort()->values()->all())
        ->toBe(collect([$first['tenant']->id, $second['tenant']->id])->sort()->values()->all())
        ->and($subOrders->pluck('items')->flatten())->toHaveCount(2);

    $this->assertDatabaseHas('branch_stocks', [
        'branch_id' => $first['branch']->id,
        'variant_id' => $first['variant']->id,
        'quantity' => 2,
    ]);
    $this->assertDatabaseHas('branch_stocks', [
        'branch_id' => $second['branch']->id,
        'variant_id' => $second['variant']->id,
        'quantity' => 2,
    ]);
});

test('checkout rejects a delivery area belonging to another branch', function () {
    $catalog = cartTestCatalog();
    $otherBranch = cartTestCatalog()['branch'];
    $customer = Customer::factory()->create();
    $cart = Cart::query()->create(['customer_id' => $customer->id]);
    $cart->items()->create([
        'variant_id' => $catalog['variant']->id,
        'branch_id' => $catalog['branch']->id,
        'quantity' => 1,
    ]);

    $this->actingAs($customer, 'customer')
        ->from('/customer/checkout')
        ->post('/customer/checkout', [
            'label' => 'Home',
            'recipient_name' => 'Test Shopper',
            'phone' => '+8801000000000',
            'address_line' => '10 Main Street',
            'division' => 'Dhaka',
            'district' => 'Dhaka',
            'upazila' => 'Dhanmondi',
            'payment_method' => 'cod',
            'delivery_cost_ids' => [
                $catalog['branch']->id => $otherBranch->deliveryCosts()->firstOrFail()->id,
            ],
        ])
        ->assertSessionHasErrors("delivery_cost_ids.{$catalog['branch']->id}");

    $this->assertDatabaseCount('orders', 0);
});

test('checkout blocks overselling without creating orders or decrementing stock', function () {
    $catalog = cartTestCatalog(stock: 2);
    $customer = Customer::factory()->create();
    $cart = Cart::query()->create(['customer_id' => $customer->id]);
    $cart->items()->create([
        'variant_id' => $catalog['variant']->id,
        'branch_id' => $catalog['branch']->id,
        'quantity' => 3,
    ]);

    $this->actingAs($customer, 'customer')
        ->from('/customer/checkout')
        ->post('/customer/checkout', [
            'label' => 'Home',
            'recipient_name' => 'Test Shopper',
            'phone' => '+8801000000000',
            'address_line' => '10 Main Street',
            'division' => 'Dhaka',
            'district' => 'Dhaka',
            'upazila' => 'Dhanmondi',
            'payment_method' => 'cod',
            'delivery_cost_ids' => [
                $catalog['branch']->id => $catalog['deliveryCost']->id,
            ],
        ])
        ->assertSessionHasErrors('cart');

    $this->assertDatabaseCount('orders', 0);
    $this->assertDatabaseCount('sub_orders', 0);
    $this->assertDatabaseHas('branch_stocks', [
        'branch_id' => $catalog['branch']->id,
        'variant_id' => $catalog['variant']->id,
        'quantity' => 2,
    ]);
    $this->assertDatabaseHas('cart_items', [
        'cart_id' => $cart->id,
        'quantity' => 3,
    ]);
});

test('wishlist is customer-only and can be toggled from the account', function () {
    $catalog = cartTestCatalog();

    $this->get('/customer/wishlist')->assertRedirect('/customer/login');

    $customer = Customer::factory()->create();
    $this->actingAs($customer, 'customer')
        ->post('/customer/wishlist/toggle', ['product_id' => $catalog['product']->id])
        ->assertRedirect();
    $this->assertDatabaseHas('wishlists', [
        'customer_id' => $customer->id,
        'product_id' => $catalog['product']->id,
    ]);

    $this->get('/customer/wishlist')->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Customer/Account/Wishlist')
            ->where('products.0.id', $catalog['product']->id));

    $this->actingAs($customer, 'customer')
        ->post('/customer/wishlist/toggle', ['product_id' => $catalog['product']->id])
        ->assertRedirect();
    $this->assertDatabaseMissing('wishlists', [
        'customer_id' => $customer->id,
        'product_id' => $catalog['product']->id,
    ]);
});

test('customers can view their orders and track each branch shipment', function () {
    $catalog = cartTestCatalog();
    $customer = Customer::factory()->create();
    $order = Order::query()->create([
        'order_no' => 'ORD-'.strtoupper(uniqid()),
        'customer_id' => $customer->id,
        'shipping_address' => ['recipient_name' => 'Shopper'],
        'subtotal' => 100,
        'shipping_fee' => 0,
        'discount' => 0,
        'total' => 100,
        'payment_method' => 'cod',
        'payment_status' => 'pending',
    ]);
    $subOrder = $order->subOrders()->create([
        'tenant_id' => $catalog['tenant']->id,
        'branch_id' => $catalog['branch']->id,
        'total' => 100,
        'status' => 'shipped',
    ]);
    $subOrder->trackings()->create(['status' => 'pending', 'note' => 'Order received']);
    $subOrder->trackings()->create(['status' => 'shipped', 'note' => 'On the way']);

    $this->actingAs($customer, 'customer')
        ->get('/customer/account/orders')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Customer/Account/Orders/Index')
            ->where('orders.data.0.order_no', $order->order_no)
            ->where('orders.data.0.sub_orders.0.branch', $catalog['branch']->name));

    $this->get("/customer/account/orders/{$order->id}/tracking")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Customer/Account/Orders/Tracking')
            ->where('order.sub_orders.0.trackings.1.status', 'shipped'));

    $otherCustomer = Customer::factory()->create();
    $this->actingAs($otherCustomer, 'customer')
        ->get("/customer/account/orders/{$order->id}")
        ->assertNotFound();
});

test('customers can cancel only pending branch orders and stock is restored once', function () {
    $catalog = cartTestCatalog(stock: 3);
    $customer = Customer::factory()->create();
    $order = Order::query()->create([
        'order_no' => 'ORD-'.strtoupper(uniqid()),
        'customer_id' => $customer->id,
        'shipping_address' => ['recipient_name' => 'Shopper'],
        'subtotal' => 200,
        'shipping_fee' => 0,
        'discount' => 0,
        'total' => 200,
        'payment_method' => 'cod',
        'payment_status' => 'pending',
    ]);
    $subOrder = $order->subOrders()->create([
        'tenant_id' => $catalog['tenant']->id,
        'branch_id' => $catalog['branch']->id,
        'total' => 200,
        'status' => 'pending',
    ]);
    $subOrder->items()->create([
        'product_id' => $catalog['product']->id,
        'variant_id' => $catalog['variant']->id,
        'name' => $catalog['product']->name,
        'price' => 100,
        'quantity' => 2,
    ]);

    $this->actingAs($customer, 'customer')
        ->post("/customer/account/orders/{$order->id}/sub-orders/{$subOrder->id}/cancel")
        ->assertRedirect("/customer/account/orders/{$order->id}");

    $this->assertDatabaseHas('branch_stocks', [
        'branch_id' => $catalog['branch']->id,
        'variant_id' => $catalog['variant']->id,
        'quantity' => 5,
    ]);
    $this->assertDatabaseHas('sub_orders', ['id' => $subOrder->id, 'status' => 'cancelled']);
    $this->assertDatabaseHas('order_trackings', [
        'sub_order_id' => $subOrder->id,
        'status' => 'cancelled',
    ]);

    $this->post("/customer/account/orders/{$order->id}/sub-orders/{$subOrder->id}/cancel")
        ->assertForbidden();
    $this->assertDatabaseHas('branch_stocks', [
        'branch_id' => $catalog['branch']->id,
        'variant_id' => $catalog['variant']->id,
        'quantity' => 5,
    ]);
});

test('customers can review only a delivered product and review images are saved', function () {
    Storage::fake('public');
    Queue::fake();
    $catalog = cartTestCatalog();
    $customer = Customer::factory()->create();
    $order = Order::query()->create([
        'order_no' => 'ORD-'.strtoupper(uniqid()),
        'customer_id' => $customer->id,
        'shipping_address' => ['recipient_name' => 'Shopper'],
        'subtotal' => 100,
        'shipping_fee' => 0,
        'discount' => 0,
        'total' => 100,
        'payment_method' => 'cod',
        'payment_status' => 'paid',
    ]);
    $subOrder = $order->subOrders()->create([
        'tenant_id' => $catalog['tenant']->id,
        'branch_id' => $catalog['branch']->id,
        'total' => 100,
        'status' => 'delivered',
    ]);
    $orderItem = $subOrder->items()->create([
        'product_id' => $catalog['product']->id,
        'variant_id' => $catalog['variant']->id,
        'name' => $catalog['product']->name,
        'price' => 100,
        'quantity' => 1,
    ]);

    $this->actingAs($customer, 'customer')
        ->post("/customer/products/{$catalog['product']->id}/reviews", [
            'order_item_id' => $orderItem->id,
            'rating' => 5,
            'comment' => 'Great quality.',
            'images' => [UploadedFile::fake()->image('review.jpg')],
        ])
        ->assertRedirect();

    $review = Review::query()->where('customer_id', $customer->id)->firstOrFail();
    expect($review->order_item_id)->toBe($orderItem->id);
    expect($review->images)->toHaveCount(1);
    Storage::disk('public')->assertExists($review->images->first()->path);
    Queue::assertPushed(RecalculateProductRating::class);

    $review->update(['is_approved' => true]);
    (new RecalculateProductRating($catalog['product']->id))->handle();
    expect((float) $catalog['product']->fresh()->rating_avg)->toBe(5.0);
    expect($catalog['product']->fresh()->rating_count)->toBe(1);

    $this->post("/customer/products/{$catalog['product']->id}/reviews", [
        'order_item_id' => $orderItem->id,
        'rating' => 4,
    ])->assertForbidden();
});
