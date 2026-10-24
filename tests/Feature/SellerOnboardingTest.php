<?php

declare(strict_types=1);

use App\Models\Branch;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

test('unassigned staff are routed from the dashboard to seller onboarding', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'web')
        ->get(route('dashboard'))
        ->assertRedirect(route('seller.onboarding.create'));

    $this->get(route('seller.onboarding.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Seller/Onboarding')
            ->where('account.email', $user->email));
});

test('seller onboarding creates a tenant branch and one month free subscription', function () {
    Role::findOrCreate('tenant-admin', 'web');
    $user = User::factory()->create();
    $this->actingAs($user, 'web');

    $this->post(route('seller.onboarding.store'), [
        'tenant_name' => 'My New Store',
        'email' => 'store-owner@example.com',
        'phone' => '+8801700000000',
        'branch_name' => 'Main Branch',
        'address' => '1 Market Street',
        'city' => 'Dhaka',
        'delivery_area' => 'Inside Dhaka',
        'delivery_cost' => '60',
    ])->assertRedirect(route('tenant.dashboard'));

    $tenant = Tenant::query()->where('slug', 'my-new-store')->firstOrFail();
    $branch = Branch::query()->where('tenant_id', $tenant->id)->firstOrFail();
    $subscription = Subscription::query()->where('tenant_id', $tenant->id)->firstOrFail();
    $user->refresh();

    expect($tenant->status)->toBe('active')
        ->and($branch->name)->toBe('Main Branch')
        ->and($branch->deliveryCosts()->firstOrFail()->cost)->toBe('60.00')
        ->and($user->tenant_id)->toBe($tenant->id)
        ->and($user->hasRole('tenant-admin'))->toBeTrue()
        ->and($subscription->starts_at->toDateString())->toBe(today()->toDateString())
        ->and($subscription->ends_at->toDateString())->toBe(today()->addMonthNoOverflow()->toDateString())
        ->and($subscription->status)->toBe('active')
        ->and($subscription->plan->name)->toBe('Free')
        ->and($subscription->plan->price)->toBe('0.00')
        ->and($subscription->plan->max_branches)->toBe(1)
        ->and($subscription->plan->max_products)->toBe(10);
});

test('a staff account cannot onboard twice and store contact email must be unique', function () {
    Role::findOrCreate('tenant-admin', 'web');
    $user = User::factory()->create();
    $tenant = Tenant::create([
        'name' => 'Existing Store',
        'slug' => 'existing-store',
        'email' => 'existing-store@example.com',
        'status' => 'active',
    ]);
    $user->update(['tenant_id' => $tenant->id]);

    $this->actingAs($user, 'web')
        ->get(route('seller.onboarding.create'))
        ->assertRedirect(route('dashboard'));

    $otherUser = User::factory()->create();
    $this->actingAs($otherUser, 'web')
        ->post(route('seller.onboarding.store'), [
            'tenant_name' => 'Another Store',
            'email' => 'existing-store@example.com',
            'phone' => '+8801700000001',
            'branch_name' => 'Main Branch',
            'address' => '2 Market Street',
            'city' => 'Dhaka',
            'delivery_area' => 'Dhaka',
            'delivery_cost' => 50,
        ])
        ->assertSessionHasErrors('email');
});
