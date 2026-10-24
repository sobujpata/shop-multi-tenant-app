<?php

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

function createSettingsRole(string $roleName): void
{
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
}

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->name)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect($user->email_verified_at)->toBeNull();
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('only super administrators can delete their account', function () {
    createSettingsRole('tenant-admin');
    createSettingsRole('branch-manager');

    $plainUser = User::factory()->create();

    $this
        ->actingAs($plainUser)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertForbidden();

    expect($plainUser->fresh())->not->toBeNull();

    $tenant = Tenant::create([
        'name' => 'Delete Guard Store',
        'slug' => 'delete-guard-store-'.uniqid(),
        'email' => 'delete-guard-store@example.com',
        'status' => 'active',
    ]);
    $tenantUser = User::factory()->create(['tenant_id' => $tenant->id]);
    $tenantUser->assignRole('tenant-admin');

    $this
        ->actingAs($tenantUser)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertForbidden();

    expect($tenantUser->fresh())->not->toBeNull();
});

test('super administrator can delete own account', function () {
    createSettingsRole('super-admin');
    $admin = User::factory()->create();
    $admin->assignRole('super-admin');

    $response = $this
        ->actingAs($admin)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('home'));

    $this->assertGuest();
    expect($admin->fresh())->toBeNull();
});

test('security and appearance pages open without email verification', function () {
    $user = User::factory()->create(['email_verified_at' => null]);

    $this->actingAs($user)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->get(route('security.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/security'));

    $this->actingAs($user)
        ->get(route('appearance.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/appearance'));
});

test('phone can be updated together with the profile information', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => $user->email,
            'phone' => '+8801900000000',
        ]);

    $response->assertSessionHasNoErrors();

    expect($user->refresh()->phone)->toBe('+8801900000000');

    $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => $user->email,
            'phone' => '',
        ]);

    expect($user->refresh()->phone)->toBeNull();
});

test('tenant owner sees the store information section and can update it', function () {
    createSettingsRole('tenant-admin');
    $tenant = Tenant::create([
        'name' => 'Owner Store',
        'slug' => 'owner-store-'.uniqid(),
        'email' => 'owner-store@example.com',
        'status' => 'active',
    ]);
    $owner = User::factory()->create(['tenant_id' => $tenant->id]);
    $owner->assignRole('tenant-admin');

    $this->actingAs($owner)
        ->get(route('profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/profile')
            ->has('tenant')
            ->where('tenant.name', 'Owner Store'));

    $response = $this
        ->actingAs($owner)
        ->patch(route('profile.tenant'), [
            'name' => 'Renamed Store',
            'email' => 'renamed-store@example.com',
            'phone' => '+8801700000000',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $tenant->refresh();

    expect($tenant->name)->toBe('Renamed Store')
        ->and($tenant->email)->toBe('renamed-store@example.com')
        ->and($tenant->phone)->toBe('+8801700000000');
});

test('tenant owner can upload a store logo', function () {
    createSettingsRole('tenant-admin');
    Storage::fake('public');
    $tenant = Tenant::create([
        'name' => 'Logo Store',
        'slug' => 'logo-store-'.uniqid(),
        'email' => 'logo-store@example.com',
        'status' => 'active',
    ]);
    $owner = User::factory()->create(['tenant_id' => $tenant->id]);
    $owner->assignRole('tenant-admin');

    $this
        ->actingAs($owner)
        ->from(route('profile.edit'))
        ->patch(route('profile.tenant'), [
            'name' => 'Logo Store',
            'email' => 'logo-store@example.com',
            'phone' => '+8801700000009',
            'logo' => UploadedFile::fake()->image('logo.png', 200, 200),
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $tenant->refresh();

    expect($tenant->logo)->not->toBeNull()
        ->and(Storage::disk('public')->exists(strval($tenant->logo)))->toBeTrue()
        ->and(str_starts_with(strval($tenant->logo), 'tenants/'.$tenant->id.'/'))->toBeTrue();

    $firstLogo = strval($tenant->logo);

    $this
        ->actingAs($owner)
        ->patch(route('profile.tenant'), [
            'name' => 'Logo Store',
            'email' => 'logo-store@example.com',
            'phone' => '+8801700000009',
            'logo' => UploadedFile::fake()->image('logo-webp.webp', 200, 200),
        ])
        ->assertSessionHasNoErrors();

    expect($tenant->refresh()->logo)->not->toBe($firstLogo)
        ->and(Storage::disk('public')->exists($firstLogo))->toBeFalse();
});

test('store logo must be a valid image', function () {
    createSettingsRole('tenant-admin');
    Storage::fake('public');
    $tenant = Tenant::create([
        'name' => 'Invalid Logo Store',
        'slug' => 'invalid-logo-store-'.uniqid(),
        'email' => 'invalid-logo-store@example.com',
        'status' => 'active',
    ]);
    $owner = User::factory()->create(['tenant_id' => $tenant->id]);
    $owner->assignRole('tenant-admin');

    $this
        ->actingAs($owner)
        ->patch(route('profile.tenant'), [
            'name' => 'Invalid Logo Store',
            'email' => 'invalid-logo-store@example.com',
            'logo' => UploadedFile::fake()->create('invoice.pdf', 80, 'application/pdf'),
        ])
        ->assertSessionHasErrors('logo');

    expect($tenant->refresh()->logo)->toBeNull();
});

test('email must be unique across tenants when owner updates the store', function () {
    createSettingsRole('tenant-admin');
    Tenant::create([
        'name' => 'Taken Store',
        'slug' => 'taken-store-'.uniqid(),
        'email' => 'taken@example.com',
        'status' => 'active',
    ]);
    $tenant = Tenant::create([
        'name' => 'Other Store',
        'slug' => 'other-store-'.uniqid(),
        'email' => 'other@example.com',
        'status' => 'active',
    ]);
    $owner = User::factory()->create(['tenant_id' => $tenant->id]);
    $owner->assignRole('tenant-admin');

    $this
        ->actingAs($owner)
        ->patch(route('profile.tenant'), [
            'name' => 'Other Store',
            'email' => 'taken@example.com',
            'phone' => '+8801700000001',
        ])
        ->assertSessionHasErrors('email');

    expect($tenant->refresh()->email)->toBe('other@example.com');
});

test('only tenant owners can update the store information', function () {
    createSettingsRole('tenant-admin');
    createSettingsRole('branch-manager');
    $tenant = Tenant::create([
        'name' => 'Member Store',
        'slug' => 'member-store-'.uniqid(),
        'email' => 'member-store@example.com',
        'status' => 'active',
    ]);

    $manager = User::factory()->create(['tenant_id' => $tenant->id]);
    $manager->assignRole('branch-manager');

    $this
        ->actingAs($manager)
        ->patch(route('profile.tenant'), [
            'name' => 'Hacked Store',
            'email' => 'hacked@example.com',
        ])
        ->assertForbidden();

    expect($tenant->refresh()->name)->toBe('Member Store');

    $plainUser = User::factory()->create();

    $this
        ->actingAs($plainUser)
        ->patch(route('profile.tenant'), [
            'name' => 'Hacked Store',
            'email' => 'hacked@example.com',
        ])
        ->assertForbidden();
});
