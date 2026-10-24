<?php

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\CustomerProfile;
use App\Models\Order;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Activitylog\Models\Activity;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

test('database seeder creates repeatable marketplace fixtures and role permissions', function () {
    $seeder = app(DatabaseSeeder::class);
    $seeder->run();
    $seeder->run();

    $superAdmin = User::where('email', 'admin@example.com')->firstOrFail();

    expect(Plan::count())->toBe(2)
        ->and(Tenant::count())->toBe(2)
        ->and(Subscription::where('status', 'active')->count())->toBe(2)
        ->and(Branch::count())->toBe(4)
        ->and(Category::count())->toBe(6)
        ->and(Brand::count())->toBe(5)
        ->and(Product::withoutGlobalScopes()->count())->toBe(30)
        ->and(ProductVariant::count())->toBe(60)
        ->and(ProductImage::count())->toBe(30)
        ->and(BranchStock::count())->toBe(120)
        ->and(Customer::count())->toBe(5)
        ->and(CustomerProfile::count())->toBe(5)
        ->and(CustomerAddress::count())->toBe(5)
        ->and($superAdmin->hasRole('super-admin'))->toBeTrue()
        ->and($superAdmin->hasPermissionTo('tenants.manage'))->toBeTrue()
        ->and(Hash::check('password', $superAdmin->password))->toBeTrue()
        ->and(Permission::where('guard_name', 'web')->count())->toBeGreaterThan(0)
        ->and(Role::where('guard_name', 'web')->count())->toBe(3)
        ->and(User::role('tenant-admin')->count())->toBe(2)
        ->and(Tenant::first()->activeSubscription)->not->toBeNull();
});

test('tenant plan subscription and product create update and delete activity is recorded', function () {
    $tenant = Tenant::create([
        'name' => 'Activity Store',
        'slug' => 'activity-store',
        'email' => 'activity@example.com',
    ]);
    $tenant->update(['status' => 'active']);

    $plan = Plan::create([
        'name' => 'Activity Plan',
        'price' => 100,
        'interval' => 'monthly',
        'max_branches' => 1,
        'max_products' => 10,
    ]);
    $subscription = Subscription::create([
        'tenant_id' => $tenant->id,
        'plan_id' => $plan->id,
        'starts_at' => today(),
        'ends_at' => today()->addMonth(),
        'status' => 'active',
    ]);
    $subscription->update(['status' => 'cancelled']);
    $subscription->delete();
    $plan->update(['price' => 120]);
    $plan->delete();

    $customer = Customer::create([
        'name' => 'Activity Shopper',
        'email' => 'activity-shopper@example.com',
        'password' => 'password',
    ]);
    $category = Category::create([
        'name' => 'Activity Category',
        'slug' => 'activity-category',
    ]);
    $product = Product::create([
        'tenant_id' => $tenant->id,
        'category_id' => $category->id,
        'name' => 'Activity Product',
        'slug' => 'activity-product',
        'description' => 'A product used to validate model activity logging.',
        'base_price' => 100,
    ]);
    $product->update(['base_price' => 125]);
    $product->delete();

    $order = Order::create([
        'order_no' => 'ACTIVITY-ORDER-001',
        'customer_id' => $customer->id,
        'shipping_address' => ['city' => 'Dhaka'],
        'subtotal' => 100,
        'total' => 100,
        'payment_method' => 'cod',
    ]);
    $order->update(['payment_status' => 'paid']);
    $order->delete();
    $tenant->delete();

    $loggedEvents = Activity::query()
        ->whereIn('subject_type', [Tenant::class, Plan::class, Subscription::class, Product::class, Order::class])
        ->get()
        ->groupBy('subject_type')
        ->map(fn ($activities) => $activities->pluck('event')->all());

    foreach ([Tenant::class, Plan::class, Subscription::class, Product::class, Order::class] as $model) {
        expect($loggedEvents[$model])->toContain('created')
            ->toContain('updated')
            ->toContain('deleted');
    }

    expect(data_get(
        Activity::where('subject_type', Order::class)
            ->where('event', 'created')
            ->firstOrFail()
            ->properties
            ->toArray(),
        'attributes.shipping_address',
    ))->toBeNull();
});
