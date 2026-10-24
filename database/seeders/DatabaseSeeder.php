<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\CustomerProfile;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(DivisionToUnionSeeder::class);

        $this->seedRolesAndPermissions();
        $plans = $this->seedPlans();
        $tenants = $this->seedTenants($plans);
        $this->seedCatalog($tenants);
        $this->seedCustomers();

        $admin = User::updateOrCreate(
            ['email' => 'kbilkis4@gmail.com'],
            [
                'name' => 'Super Admin',
                'password' => 'password',
            ],
        );
        $admin->syncRoles('super-admin');
    }

    private function seedRolesAndPermissions(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissionNames = [
            'dashboard.view',
            'tenants.manage',
            'plans.manage',
            'subscriptions.manage',
            'subscriptions.view',
            'branches.manage',
            'products.manage',
            'products.view',
            'inventory.manage',
            'orders.manage',
            'customers.manage',
            'users.manage',
            'roles.manage',
            'category.create',
            'category.edit',
            'category.delete',
            'category.view',
            'category.products',
            'brand.create',
            'brand.edit',
            'brand.delete',
            'brand.view',
            'brand.products',
            'pos.view',
            'pos-order.view',
            'report.view',
        ];

        $permissions = [];

        foreach ($permissionNames as $name) {
            $permissions[$name] = Permission::firstOrCreate([
                'name' => $name,
                'guard_name' => 'web',
            ]);
        }

        $rolePermissions = [
            'super-admin' => $permissionNames,
            'tenant-admin' => [
                'dashboard.view',
                'subscriptions.view',
                'branches.manage',
                'products.manage',
                'inventory.manage',
                'orders.manage',
                'customers.manage',
                'category.products',
                'brand.create',
                'brand.edit',
                'brand.delete',
                'brand.products',
            ],
            'branch-manager' => [
                'dashboard.view',
                'products.view',
                'inventory.manage',
                'orders.manage',
            ],
            'sales-man' => [
                'pos.view',
                'pos-order.view',
            ],
        ];

        foreach ($rolePermissions as $roleName => $assignedPermissions) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);
            $role->givePermissionTo(array_map(
                fn (string $name): Permission => $permissions[$name],
                $assignedPermissions,
            ));
        }

    }

    /**
     * @return array<string, Plan>
     */
    private function seedPlans(): array
    {
        return [
            'starter' => Plan::updateOrCreate(
                ['name' => 'Starter'],
                [
                    'price' => 1990,
                    'interval' => 'monthly',
                    'max_branches' => 2,
                    'max_products' => 100,
                    'is_active' => true,
                ],
            ),
            'free' => Plan::updateOrCreate(
                ['name' => 'Free'],
                [
                    'price' => 0,
                    'interval' => 'monthly',
                    'max_branches' => 1,
                    'max_products' => 10,
                    'is_active' => true,
                ],
            ),
            'growth' => Plan::updateOrCreate(
                ['name' => 'Growth'],
                [
                    'price' => 19900,
                    'interval' => 'yearly',
                    'max_branches' => 10,
                    'max_products' => 10000,
                    'is_active' => true,
                ],
            ),
        ];
    }

    /**
     * @param  array<string, Plan>  $plans
     * @return array<string, Tenant>
     */
    private function seedTenants(array $plans): array
    {
        $tenantData = [
            [
                'name' => 'Dhaka Fashion House',
                'slug' => 'dhaka-fashion-house',
                'email' => 'contact@dhakafashion.example',
                'phone' => '+8801700000001',
                'plan' => 'starter',
                'admin_email' => 'tenant-admin-dhaka@example.com',
            ],
            [
                'name' => 'Chattogram Electronics',
                'slug' => 'chattogram-electronics',
                'email' => 'contact@ctgelectronics.example',
                'phone' => '+8801700000002',
                'plan' => 'growth',
                'admin_email' => 'tenant-admin-chattogram@example.com',
            ],
        ];
        $tenants = [];

        foreach ($tenantData as $index => $data) {
            $tenant = Tenant::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'status' => 'active',
                ],
            );
            $tenants[$data['slug']] = $tenant;

            $tenant->subscriptions()->updateOrCreate(
                ['status' => 'active'],
                [
                    'plan_id' => $plans[$data['plan']]->id,
                    'starts_at' => today(),
                    'ends_at' => today()->addYear(),
                ],
            );

            $branchNames = $index === 0
                ? ['Dhanmondi Branch', 'Uttara Branch']
                : ['GEC Circle Branch', 'Agrabad Branch'];

            foreach ($branchNames as $branchName) {
                $tenant->branches()->updateOrCreate(
                    ['name' => $branchName],
                    [
                        'address' => $branchName.' Main Road',
                        'city' => $index === 0 ? 'Dhaka' : 'Chattogram',
                        'phone' => $data['phone'],
                        'is_active' => true,
                    ],
                );
            }

            $staff = User::firstOrCreate(
                ['email' => $data['admin_email']],
                [
                    'name' => $data['name'].' Admin',
                    'password' => 'password',
                    'tenant_id' => $tenant->id,
                    'branch_id' => null,
                ],
            );
            $staff->forceFill([
                'tenant_id' => $tenant->id,
                'branch_id' => null,
            ])->save();
            $staff->syncRoles('tenant-admin');
        }

        return $tenants;
    }

    /**
     * @param  array<string, Tenant>  $tenants
     */
    private function seedCatalog(array $tenants): void
    {
        $categories = [];

        foreach (['Men', 'Women', 'Kids', 'Electronics'] as $name) {
            $categories[$name] = Category::updateOrCreate(
                ['slug' => strtolower($name)],
                ['name' => $name, 'parent_id' => null],
            );
        }

        foreach (['Phones', 'Laptops'] as $name) {
            $categories[$name] = Category::updateOrCreate(
                ['slug' => strtolower($name)],
                [
                    'name' => $name,
                    'parent_id' => $categories['Electronics']->id,
                ],
            );
        }

        $brandNames = ['Northstar', 'Urban Thread', 'Little Sprout', 'NovaTech', 'Everyday'];
        $brands = [];

        foreach ($brandNames as $name) {
            $slug = str($name)->slug()->toString();
            $brands[] = Brand::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name],
            );
        }

        $productCategories = [
            $categories['Men'],
            $categories['Women'],
            $categories['Kids'],
            $categories['Phones'],
            $categories['Laptops'],
        ];

        foreach (array_values($tenants) as $tenantIndex => $tenant) {
            $branches = $tenant->branches()->withoutGlobalScopes()->orderBy('id')->get();

            for ($productIndex = 1; $productIndex <= 15; $productIndex++) {
                $category = $productCategories[($productIndex - 1) % count($productCategories)];
                $brand = $brands[($productIndex + $tenantIndex - 1) % count($brands)];
                $name = $category->name.' Item '.str_pad((string) $productIndex, 2, '0', STR_PAD_LEFT);
                $slug = $tenant->slug.'-product-'.str_pad((string) $productIndex, 2, '0', STR_PAD_LEFT);
                $productAttributes = Product::factory()->make([
                    'tenant_id' => $tenant->id,
                    'category_id' => $category->id,
                    'brand_id' => $brand->id,
                    'name' => $name,
                    'slug' => $slug,
                    'description' => 'A quality '.$category->name.' product from '.$tenant->name.'.',
                    'gender' => in_array($category->name, ['Men', 'Women', 'Kids'], true)
                        ? strtolower($category->name)
                        : 'unisex',
                    'base_price' => 500 + ($productIndex * 125),
                    'sale_price' => null,
                ]);
                $product = Product::withoutGlobalScopes()->firstOrCreate(
                    ['slug' => $slug],
                    $productAttributes->getAttributes(),
                );

                $product->images()->updateOrCreate(
                    ['is_primary' => true],
                    ['path' => 'https://placehold.co/800x1000?text='.rawurlencode($name)],
                );

                $variants = in_array($category->name, ['Phones', 'Laptops'], true)
                    ? [
                        ['suffix' => '128GB', 'size' => '128GB', 'color' => 'Black'],
                        ['suffix' => '256GB', 'size' => '256GB', 'color' => 'Silver'],
                    ]
                    : [
                        ['suffix' => 'M-Blue', 'size' => 'M', 'color' => 'Blue'],
                        ['suffix' => 'L-Black', 'size' => 'L', 'color' => 'Black'],
                    ];

                foreach ($variants as $variantData) {
                    $sku = strtoupper($slug.'-'.$variantData['suffix']);
                    $variantAttributes = ProductVariant::factory()->make([
                        'product_id' => $product->id,
                        'sku' => $sku,
                        'size' => $variantData['size'],
                        'color' => $variantData['color'],
                        'price' => $product->base_price,
                    ]);
                    $variant = ProductVariant::firstOrCreate(
                        ['sku' => $sku],
                        $variantAttributes->getAttributes(),
                    );

                    foreach ($branches as $branch) {
                        $branch->stocks()->updateOrCreate(
                            ['variant_id' => $variant->id],
                            ['quantity' => 20 + $productIndex],
                        );
                    }
                }
            }
        }
    }

    private function seedCustomers(): void
    {
        for ($index = 1; $index <= 5; $index++) {
            $email = "customer{$index}@example.com";
            $customerAttributes = Customer::factory()->make([
                'name' => "Shopper {$index}",
                'email' => $email,
                'phone' => '+880180000000'.(string) $index,
            ]);
            $customer = Customer::firstOrCreate(
                ['email' => $email],
                $customerAttributes->getAttributes(),
            );

            $profile = CustomerProfile::factory()->make();
            $customer->profile()->updateOrCreate([], $profile->getAttributes());

            $customer->addresses()->updateOrCreate(
                ['label' => 'Home'],
                [
                    'recipient_name' => $customer->name,
                    'phone' => $customer->phone,
                    'address_line' => "{$index} Example Road",
                    'division' => 'Dhaka',
                    'district' => 'Dhaka',
                    'upazila' => 'Dhanmondi',
                    'postal_code' => '1200',
                    'is_default' => true,
                ],
            );
        }
    }
}
