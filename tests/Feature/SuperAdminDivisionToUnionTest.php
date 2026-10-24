<?php

use App\Models\Divisiontounion;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

test('super admins can manage division-to-union records', function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    $role = Role::firstOrCreate([
        'name' => 'super-admin',
        'guard_name' => 'web',
    ]);
    $admin = User::factory()->create();
    $admin->assignRole($role);

    $this->actingAs($admin, 'web')
        ->get(route('super-admin.divisiontounions.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('SuperAdmin/DivisionToUnion/Index')
            ->has('records.data', 0)
            ->where('filters.search', '')
        );

    $this->post(route('super-admin.divisiontounions.store'), [
        'divisions' => 'Dhaka',
        'districts' => 'Dhaka',
        'upazilas' => 'Dhanmondi',
        'unions' => '',
        'postoffices' => 'Dhanmondi',
        'postcodes' => '1209',
    ])->assertRedirect();

    $record = Divisiontounion::query()->firstOrFail();
    expect($record->unions)->toBe('');

    $this->put(route('super-admin.divisiontounions.update', $record), [
        'divisions' => 'Dhaka',
        'districts' => 'Dhaka',
        'upazilas' => 'Dhanmondi',
        'unions' => 'Ward 15',
        'postoffices' => 'Dhanmondi',
        'postcodes' => '1209',
    ])->assertRedirect();

    expect($record->fresh()->unions)->toBe('Ward 15');

    $this->delete(route('super-admin.divisiontounions.destroy', $record))
        ->assertRedirect();

    expect(Divisiontounion::query()->count())->toBe(0);
});

test('division-to-union management is restricted to super admins', function () {
    $this->get(route('super-admin.divisiontounions.index'))
        ->assertRedirect('/staff/login');

    $this->actingAs(User::factory()->create(), 'web')
        ->get(route('super-admin.divisiontounions.index'))
        ->assertForbidden();
});

test('super admins can filter division-to-union records by column dropdown values', function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    $role = Role::firstOrCreate([
        'name' => 'super-admin',
        'guard_name' => 'web',
    ]);
    $admin = User::factory()->create();
    $admin->assignRole($role);

    Divisiontounion::create([
        'divisions' => 'Dhaka',
        'districts' => 'Dhaka',
        'upazilas' => 'Dhanmondi',
        'unions' => 'Ward 15',
        'postoffices' => 'Dhanmondi',
        'postcodes' => '1209',
    ]);
    Divisiontounion::create([
        'divisions' => 'Dhaka',
        'districts' => 'Gazipur',
        'upazilas' => 'Tongi',
        'unions' => 'Tongi',
        'postoffices' => 'Tongi',
        'postcodes' => '1710',
    ]);

    $this->actingAs($admin, 'web')
        ->get(route('super-admin.divisiontounions.index', [
            'divisions' => 'Dhaka',
            'districts' => 'Dhaka',
            'upazilas' => 'Dhanmondi',
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('records.data', 1)
            ->where('records.data.0.upazilas', 'Dhanmondi')
            ->where('filters.divisions', 'Dhaka')
            ->where('filters.districts', 'Dhaka')
            ->where('filters.upazilas', 'Dhanmondi')
            ->where('filterOptions.unions', ['Ward 15'])
            ->where('filterOptions.postcodes', ['1209'])
            ->where('summary.divisions', 1)
            ->where('summary.districts', 1)
            ->where('summary.upazilas', 1)
            ->where('summary.unions', 1)
            ->where('summary.postoffices', 1)
            ->where('summary.postcodes', 1)
        );
});
