<?php

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductAttribute;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

test('catalog migrations create branches products and supporting catalog data', function () {
    $tenant = Tenant::create([
        'name' => 'Catalog Store',
        'slug' => 'catalog-store',
        'email' => 'catalog@example.com',
    ]);
    $branch = Branch::create([
        'tenant_id' => $tenant->id,
        'name' => 'Central',
        'address' => '10 Market Road',
        'city' => 'Dhaka',
        'phone' => '+880 1712-345678',
    ]);
    $category = Category::create([
        'name' => 'Clothing',
        'slug' => 'clothing',
    ]);
    $childCategory = Category::create([
        'parent_id' => $category->id,
        'name' => 'Shirts',
        'slug' => 'shirts',
    ]);
    $brand = Brand::create([
        'name' => 'Example Brand',
        'slug' => 'example-brand',
    ]);
    $product = Product::create([
        'tenant_id' => $tenant->id,
        'category_id' => $childCategory->id,
        'brand_id' => $brand->id,
        'name' => 'Cotton Shirt',
        'slug' => 'cotton-shirt',
        'description' => 'A soft cotton shirt.',
        'gender' => 'unisex',
        'base_price' => 1200,
        'sale_price' => 999,
    ]);
    $variant = $product->variants()->create([
        'sku' => 'SHIRT-COTTON-M',
        'size' => 'M',
        'color' => 'Blue',
        'price' => 999,
    ]);
    $image = $product->images()->create([
        'path' => 'products/cotton-shirt.jpg',
        'is_primary' => true,
    ]);
    $attribute = ProductAttribute::create(['name' => 'Material']);
    $value = $product->attributeValues()->create([
        'attribute_id' => $attribute->id,
        'value' => 'Cotton',
    ]);
    $stock = BranchStock::create([
        'branch_id' => $branch->id,
        'variant_id' => $variant->id,
        'quantity' => 12,
    ]);

    expect($childCategory->parent->is($category))->toBeTrue()
        ->and($category->children->first()->is($childCategory))->toBeTrue()
        ->and($product->category->is($childCategory))->toBeTrue()
        ->and($product->brand->is($brand))->toBeTrue()
        ->and($product->variants->first()->is($variant))->toBeTrue()
        ->and($product->images->first()->is($image))->toBeTrue()
        ->and($product->attributeValues->first()->is($value))->toBeTrue()
        ->and($value->attribute->is($attribute))->toBeTrue()
        ->and($product->branchStocks)->toHaveCount(1)
        ->and($product->branchStocks->first()->is($stock))->toBeTrue()
        ->and($product->current_price)->toBe('999.00')
        ->and($branch->tenant->is($tenant))->toBeTrue()
        ->and($branch->fresh()->is_active)->toBeTrue();
});

test('product current price falls back to its base price', function () {
    $tenant = Tenant::create([
        'name' => 'Catalog Store',
        'slug' => 'catalog-store',
        'email' => 'catalog@example.com',
    ]);
    $category = Category::create([
        'name' => 'Clothing',
        'slug' => 'clothing',
    ]);
    $product = Product::create([
        'tenant_id' => $tenant->id,
        'category_id' => $category->id,
        'name' => 'Everyday Shirt',
        'slug' => 'everyday-shirt',
        'description' => 'Everyday wear.',
        'base_price' => '1499.50',
    ]);

    expect($product->current_price)->toBe('1499.50');
});

test('tenant scope filters branches and products and fills tenant id on creation', function () {
    $tenant = Tenant::create([
        'name' => 'Tenant One',
        'slug' => 'tenant-one',
        'email' => 'one@example.com',
    ]);
    $otherTenant = Tenant::create([
        'name' => 'Tenant Two',
        'slug' => 'tenant-two',
        'email' => 'two@example.com',
    ]);
    $category = Category::create([
        'name' => 'Clothing',
        'slug' => 'clothing',
    ]);
    $user = User::factory()->create(['tenant_id' => $tenant->id]);

    Branch::withoutGlobalScopes()->create([
        'tenant_id' => $otherTenant->id,
        'name' => 'Other Branch',
        'address' => '1 Other Street',
        'city' => 'Dhaka',
        'phone' => '123456',
    ]);
    Product::withoutGlobalScopes()->create([
        'tenant_id' => $otherTenant->id,
        'category_id' => $category->id,
        'name' => 'Other Product',
        'slug' => 'other-product',
        'description' => 'Other tenant product.',
        'base_price' => 100,
    ]);

    $this->actingAs($user, 'web');

    expect(Branch::query()->count())->toBe(0)
        ->and(Product::query()->count())->toBe(0);

    $branch = Branch::create([
        'tenant_id' => $otherTenant->id,
        'name' => 'My Branch',
        'address' => '2 Main Street',
        'city' => 'Dhaka',
        'phone' => '654321',
    ]);
    $product = Product::create([
        'tenant_id' => $otherTenant->id,
        'category_id' => $category->id,
        'name' => 'My Product',
        'slug' => 'my-product',
        'description' => 'Current tenant product.',
        'base_price' => 200,
    ]);

    expect($branch->tenant_id)->toBe($tenant->id)
        ->and($product->tenant_id)->toBe($tenant->id)
        ->and(Branch::query()->pluck('id')->all())->toBe([$branch->id])
        ->and(Product::query()->pluck('id')->all())->toBe([$product->id])
        ->and(Product::withoutGlobalScopes()->count())->toBe(2);
});

test('product branch stocks relation is has many through variants', function () {
    expect((new Product)->branchStocks())->toBeInstanceOf(HasManyThrough::class);
});
