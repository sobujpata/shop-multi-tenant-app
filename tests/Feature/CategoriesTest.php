<?php

declare(strict_types=1);

use App\Models\Category;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * @return array{Tenant, User}
 */
function createCategoryPanelUser(string $roleName): array
{
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    $categoryPermissions = collect([
        'category.create',
        'category.edit',
        'category.delete',
        'category.products',
    ])
        ->map(fn (string $name) => Permission::findOrCreate($name, 'web'));
    $role->givePermissionTo($categoryPermissions);

    $tenant = Tenant::create([
        'name' => 'Category Tenant '.uniqid(),
        'slug' => 'category-tenant-'.uniqid(),
        'email' => 'category-'.uniqid().'@example.com',
        'status' => 'active',
    ]);

    if ($roleName !== 'super-admin') {
        $plan = Plan::create([
            'name' => 'Category Plan '.uniqid(),
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

test('super admins can manage shared categories', function () {
    [, $admin] = createCategoryPanelUser('super-admin');

    $this->actingAs($admin, 'web')
        ->get(route('super-admin.categories.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Categories/Index')
            ->where('baseUrl', '/super-admin/categories')
            ->where('canCreateCategory', true)
            ->where('canEditCategory', true)
            ->where('canDeleteCategory', true)
            ->where('canViewCategoryProducts', true));

    $this->post(route('super-admin.categories.store'), [
        'name' => 'Accessories',
        'slug' => 'category-accessories',
    ])->assertRedirect();

    $category = Category::query()->where('slug', 'category-accessories')->firstOrFail();

    $this->put(route('super-admin.categories.update', $category), [
        'name' => 'Fashion Accessories',
        'slug' => 'category-fashion-accessories',
        'parent_id' => null,
    ])->assertRedirect();

    expect($category->fresh()->name)->toBe('Fashion Accessories');

    $this->delete(route('super-admin.categories.destroy', $category))
        ->assertRedirect();

    expect(Category::query()->whereKey($category->id)->exists())->toBeFalse();
});

test('tenant admins and branch managers can browse and manage shared categories', function (string $roleName) {
    [, $user] = createCategoryPanelUser($roleName);
    $slug = 'category-'.$roleName.'-'.uniqid();

    $this->actingAs($user, 'web')
        ->get(route('tenant.categories.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Categories/Index')
            ->where('baseUrl', '/tenant/categories')
            ->where('canCreateCategory', true)
            ->where('canEditCategory', true)
            ->where('canDeleteCategory', true)
            ->where('canViewCategoryProducts', true));

    $this->post(route('tenant.categories.store'), [
        'name' => ucfirst($roleName).' Category',
        'slug' => $slug,
    ])->assertRedirect();

    $category = Category::query()->where('slug', $slug)->firstOrFail();

    $this->put(route('tenant.categories.update', $category), [
        'name' => ucfirst($roleName).' Updated Category',
        'slug' => $slug.'-updated',
        'parent_id' => null,
    ])->assertRedirect();

    $this->delete(route('tenant.categories.destroy', $category))
        ->assertRedirect();

    expect(Category::query()->whereKey($category->id)->exists())->toBeFalse();
})->with(['tenant-admin', 'branch-manager']);

test('users without category create permission cannot see the new category button or create categories', function () {
    [, $user] = createCategoryPanelUser('branch-manager');
    Role::findByName('branch-manager', 'web')
        ->revokePermissionTo('category.create');

    $this->actingAs($user, 'web')
        ->get(route('tenant.categories.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canCreateCategory', false));

    $this->post(route('tenant.categories.store'), [
        'name' => 'Restricted Category',
        'slug' => 'restricted-category',
    ])->assertForbidden();
});

test('category edit and delete controls require their matching permissions', function () {
    [, $user] = createCategoryPanelUser('branch-manager');
    $role = Role::findByName('branch-manager', 'web');
    $role->revokePermissionTo(['category.edit', 'category.delete']);
    $category = Category::create([
        'name' => 'Read Only Category',
        'slug' => 'read-only-category',
    ]);

    $this->actingAs($user, 'web')
        ->get(route('tenant.categories.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canEditCategory', false)
            ->where('canDeleteCategory', false)
            ->where('canViewCategoryProducts', true));

    $this->put(route('tenant.categories.update', $category), [
        'name' => 'Updated Category',
        'slug' => 'updated-category',
        'parent_id' => null,
    ])->assertForbidden();

    $this->delete(route('tenant.categories.destroy', $category))
        ->assertForbidden();

    expect($category->fresh()->name)->toBe('Read Only Category');
});

test('users without category products permission do not see or receive product counts', function () {
    [, $user] = createCategoryPanelUser('branch-manager');
    Role::findByName('branch-manager', 'web')
        ->revokePermissionTo('category.products');
    $category = Category::create([
        'name' => 'Hidden Counts Category',
        'slug' => 'hidden-counts-category',
    ]);

    $this->actingAs($user, 'web')
        ->get(route('tenant.categories.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canViewCategoryProducts', false)
            ->missing('categories.data.0.products_count'));
});

test('category updates cannot create a parent cycle', function () {
    [, $admin] = createCategoryPanelUser('super-admin');
    $parent = Category::create(['name' => 'Parent', 'slug' => 'cycle-parent']);
    $child = Category::create([
        'name' => 'Child',
        'slug' => 'cycle-child',
        'parent_id' => $parent->id,
    ]);

    $this->actingAs($admin, 'web')
        ->put(route('super-admin.categories.update', $parent), [
            'name' => 'Parent',
            'slug' => 'cycle-parent',
            'parent_id' => $child->id,
        ])
        ->assertSessionHasErrors('parent_id');
});
