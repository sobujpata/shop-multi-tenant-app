<?php

declare(strict_types=1);

use App\Models\Brand;
use App\Models\Category;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * @return array{Tenant, User}
 */
function createBrandPanelUser(string $roleName): array
{
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    $permissions = collect([
        'brand.create',
        'brand.edit',
        'brand.delete',
        'brand.products',
    ])->map(fn (string $name) => Permission::findOrCreate($name, 'web'));
    $role->givePermissionTo($permissions);

    $tenant = Tenant::create([
        'name' => 'Brand Tenant '.uniqid(),
        'slug' => 'brand-tenant-'.uniqid(),
        'email' => 'brand-'.uniqid().'@example.com',
        'status' => 'active',
    ]);

    if ($roleName !== 'super-admin') {
        $plan = Plan::create([
            'name' => 'Brand Plan '.uniqid(),
            'price' => 1000,
            'interval' => 'monthly',
            'max_branches' => 2,
            'max_products' => 20,
            'is_active' => true,
        ]);
        $tenant->subscriptions()->create([
            'plan_id' => $plan->id,
            'starts_at' => today()->subDay(),
            'ends_at' => today()->addMonth(),
            'status' => 'active',
        ]);
    }

    $user = User::factory()->create([
        'tenant_id' => $roleName === 'super-admin' ? null : $tenant->id,
    ]);
    $user->assignRole($roleName);

    return [$tenant, $user];
}

test('super admins can manage shared brands', function () {
    [, $admin] = createBrandPanelUser('super-admin');

    $this->actingAs($admin, 'web')
        ->get(route('super-admin.brands.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Brands/Index')
            ->where('baseUrl', '/super-admin/brands')
            ->where('canCreateBrand', true)
            ->where('canEditBrand', true)
            ->where('canDeleteBrand', true)
            ->where('canViewBrandProducts', true));

    $this->post(route('super-admin.brands.store'), [
        'name' => 'Test Brand',
        'slug' => 'test-brand',
    ])->assertRedirect();

    $brand = Brand::query()->where('slug', 'test-brand')->firstOrFail();

    $this->put(route('super-admin.brands.update', $brand), [
        'name' => 'Updated Brand',
        'slug' => 'updated-brand',
    ])->assertRedirect();

    expect($brand->fresh()->name)->toBe('Updated Brand');

    $this->delete(route('super-admin.brands.destroy', $brand))
        ->assertRedirect();

    expect(Brand::query()->whereKey($brand->id)->exists())->toBeFalse();
});

test('tenant admins and branch managers can manage shared brands', function (string $roleName) {
    [, $user] = createBrandPanelUser($roleName);
    $slug = 'brand-'.$roleName.'-'.uniqid();

    $this->actingAs($user, 'web')
        ->get(route('tenant.brands.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Brands/Index')
            ->where('baseUrl', '/tenant/brands')
            ->where('canCreateBrand', true)
            ->where('canEditBrand', true)
            ->where('canDeleteBrand', true)
            ->where('canViewBrandProducts', true));

    $this->post(route('tenant.brands.store'), [
        'name' => ucfirst($roleName).' Brand',
        'slug' => $slug,
    ])->assertRedirect();

    $brand = Brand::query()->where('slug', $slug)->firstOrFail();

    $this->put(route('tenant.brands.update', $brand), [
        'name' => ucfirst($roleName).' Updated Brand',
        'slug' => $slug.'-updated',
    ])->assertRedirect();

    $this->delete(route('tenant.brands.destroy', $brand))
        ->assertRedirect();

    expect(Brand::query()->whereKey($brand->id)->exists())->toBeFalse();
})->with(['tenant-admin', 'branch-manager']);

test('brand controls and product counts require their matching permissions', function () {
    [, $user] = createBrandPanelUser('branch-manager');
    $role = Role::findByName('branch-manager', 'web');
    $role->revokePermissionTo([
        'brand.create',
        'brand.edit',
        'brand.delete',
        'brand.products',
    ]);
    $brand = Brand::create([
        'name' => 'Read Only Brand',
        'slug' => 'read-only-brand',
    ]);

    $this->actingAs($user, 'web')
        ->get(route('tenant.brands.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canCreateBrand', false)
            ->where('canEditBrand', false)
            ->where('canDeleteBrand', false)
            ->where('canViewBrandProducts', false)
            ->missing('brands.data.0.products_count'));

    $this->post(route('tenant.brands.store'), [
        'name' => 'Forbidden Brand',
        'slug' => 'forbidden-brand',
    ])->assertForbidden();

    $this->put(route('tenant.brands.update', $brand), [
        'name' => 'Updated Brand',
        'slug' => 'updated-brand',
    ])->assertForbidden();

    $this->delete(route('tenant.brands.destroy', $brand))
        ->assertForbidden();

    expect($brand->fresh()->name)->toBe('Read Only Brand');
});

test('brands used by products cannot be deleted', function () {
    [$tenant, $admin] = createBrandPanelUser('tenant-admin');
    $category = Category::create([
        'name' => 'Brand Test Category',
        'slug' => 'brand-test-category',
    ]);
    $brand = Brand::create([
        'name' => 'In Use Brand',
        'slug' => 'in-use-brand',
    ]);
    Product::create([
        'tenant_id' => $tenant->id,
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'name' => 'Brand Test Product',
        'slug' => 'brand-test-product',
        'description' => 'Product references this brand.',
        'base_price' => 100,
        'is_active' => true,
    ]);

    $this->actingAs($admin, 'web')
        ->delete(route('tenant.brands.destroy', $brand))
        ->assertSessionHasErrors('brand');

    expect(Brand::query()->whereKey($brand->id)->exists())->toBeTrue();
});
