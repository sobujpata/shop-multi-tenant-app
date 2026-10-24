<?php

use App\Models\Branch;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;

test('tenant subscription relationships resolve to their related models', function () {
    $tenant = new Tenant;

    expect($tenant->users()->getRelated())->toBeInstanceOf(User::class)
        ->and($tenant->branches()->getRelated())->toBeInstanceOf(Branch::class)
        ->and($tenant->products()->getRelated())->toBeInstanceOf(Product::class)
        ->and($tenant->subscriptions()->getRelated())->toBeInstanceOf(Subscription::class)
        ->and($tenant->activeSubscription()->getRelated())->toBeInstanceOf(Subscription::class);
});

test('tenants can have a plan subscription and their active subscription is unexpired', function () {
    $tenant = Tenant::create([
        'name' => 'Example Store',
        'slug' => 'example-store',
        'email' => 'store@example.com',
    ]);
    $plan = Plan::create([
        'name' => 'Standard',
        'price' => '29.99',
        'interval' => 'monthly',
        'max_branches' => 3,
        'max_products' => 500,
    ]);

    $expired = $tenant->subscriptions()->create([
        'plan_id' => $plan->id,
        'starts_at' => today()->subMonth(),
        'ends_at' => today()->subDay(),
        'status' => 'active',
    ]);
    $active = $tenant->subscriptions()->create([
        'plan_id' => $plan->id,
        'starts_at' => today(),
        'ends_at' => today(),
        'status' => 'active',
    ]);

    expect($tenant->activeSubscription->is($active))->toBeTrue()
        ->and($active->plan->is($plan))->toBeTrue()
        ->and($plan->subscriptions)->toHaveCount(2)
        ->and($expired->tenant->is($tenant))->toBeTrue();
});

test('deleting a tenant nulls staff tenant ids and cascades subscriptions', function () {
    $tenant = Tenant::create([
        'name' => 'Example Store',
        'slug' => 'example-store',
        'email' => 'store@example.com',
    ]);
    $plan = Plan::create([
        'name' => 'Standard',
        'price' => '29.99',
        'interval' => 'monthly',
        'max_branches' => 3,
        'max_products' => 500,
    ]);
    $user = $tenant->users()->create([
        'name' => 'Store Manager',
        'email' => 'manager@example.com',
        'password' => 'Password123!',
        'phone' => '+880 1712-345678',
    ]);
    $subscription = $tenant->subscriptions()->create([
        'plan_id' => $plan->id,
        'starts_at' => today(),
        'ends_at' => today()->addMonth(),
        'status' => 'active',
    ]);

    $tenant->delete();

    expect($user->fresh()->tenant_id)->toBeNull()
        ->and(Subscription::find($subscription->id))->toBeNull();
});
