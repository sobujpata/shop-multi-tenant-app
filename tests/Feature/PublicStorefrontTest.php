<?php

declare(strict_types=1);

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Brand;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;

function storefrontTenant(string $status = 'active'): Tenant
{
    return Tenant::create([
        'name' => 'Storefront '.uniqid(),
        'slug' => 'storefront-'.uniqid(),
        'email' => 'store-'.uniqid().'@example.com',
        'status' => $status,
    ]);
}

function storefrontProduct(
    Tenant $tenant,
    Category $category,
    ?Brand $brand = null,
    array $attributes = [],
): Product {
    return Product::withoutGlobalScopes()->create([
        'tenant_id' => $tenant->id,
        'category_id' => $category->id,
        'brand_id' => $brand?->id,
        'name' => 'Marketplace Item '.uniqid(),
        'slug' => 'marketplace-item-'.uniqid(),
        'description' => 'A well made item for everyday use.',
        'gender' => 'unisex',
        'base_price' => 1500,
        'sale_price' => null,
        'rating_avg' => 0,
        'rating_count' => 0,
        'is_active' => true,
        ...$attributes,
    ]);
}

test('home and public product listings render available catalog products', function () {
    $tenant = storefrontTenant();
    $category = Category::create([
        'name' => 'Home Category',
        'slug' => 'home-category',
    ]);
    $product = storefrontProduct($tenant, $category);
    storefrontProduct($tenant, $category, attributes: ['is_active' => false]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Home')
            ->has('categories', 1)
            ->has('stores', 1)
            ->where('stores.0.slug', $tenant->slug)
            ->has('featuredProducts', 1)
            ->has('allProducts.data', 1)
            ->where('allProducts.data.0.id', $product->id)
            ->where('featuredProducts.0.id', $product->id));

    $this->get(route('shop.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Shop/Index')
            ->has('products.data', 1)
            ->where('products.data.0.id', $product->id)
            ->has('options.categories', 1));
});

test('store directory lists active sellers including stores without products and supports search', function () {
    $activeTenant = storefrontTenant();
    $matchingTenant = storefrontTenant();
    $pendingTenant = storefrontTenant('pending');
    $category = Category::create([
        'name' => 'Store Directory Category',
        'slug' => 'store-directory-category',
    ]);
    storefrontProduct($matchingTenant, $category, attributes: [
        'name' => 'Matching Store Product',
        'slug' => 'matching-store-product',
    ]);

    $this->get(route('stores.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Stores/Index')
            ->where('stores.total', 2)
            ->where(
                'stores.data',
                fn ($stores) => collect($stores)->pluck('products_count')->sort()->values()->all() === [0, 1],
            ));

    $this->get(route('stores.index', ['search' => $matchingTenant->name]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stores.total', 1)
            ->where('stores.data.0.slug', $matchingTenant->slug)
            ->where('filters.search', $matchingTenant->name));

    expect($pendingTenant->status)->toBe('pending');
});

test('category directory lists all categories with public product counts and supports search', function () {
    $tenant = storefrontTenant();
    $category = Category::create([
        'name' => 'Directory Electronics',
        'slug' => 'directory-electronics',
    ]);
    $childCategory = Category::create([
        'parent_id' => $category->id,
        'name' => 'Mobile Devices',
        'slug' => 'mobile-devices',
    ]);
    $emptyCategory = Category::create([
        'name' => 'Empty Directory Category',
        'slug' => 'empty-directory-category',
    ]);
    storefrontProduct($tenant, $category);
    storefrontProduct($tenant, $category, attributes: [
        'name' => 'Inactive category product',
        'slug' => 'inactive-category-product',
        'is_active' => false,
    ]);
    storefrontProduct($tenant, $childCategory);

    $this->get(route('categories.browse'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Categories/Browse')
            ->where('categories.total', 3)
            ->where(
                'categories.data',
                fn ($categories) => collect($categories)
                    ->keyBy('slug')
                    ->map(fn ($item) => $item['products_count'])
                    ->all() === [
                        'directory-electronics' => 1,
                        'empty-directory-category' => 0,
                        'mobile-devices' => 1,
                    ],
            )
            ->where(
                'categories.data',
                fn ($categories) => collect($categories)
                    ->firstWhere('slug', 'mobile-devices')['parent'] === 'Directory Electronics',
            ));

    $this->get(route('categories.browse', ['search' => 'mobile']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('categories.total', 1)
            ->where('categories.data.0.slug', 'mobile-devices')
            ->where('filters.search', 'mobile'));
});

test('brand directory lists brands with active products and supports search', function () {
    $tenant = storefrontTenant();
    $pendingTenant = storefrontTenant('pending');
    $category = Category::create([
        'name' => 'Brand Directory Category',
        'slug' => 'brand-directory-category',
    ]);
    $matchingBrand = Brand::create([
        'name' => 'Directory Good Brand',
        'slug' => 'directory-good-brand',
        'logo' => 'brands/good-brand.png',
    ]);
    $otherBrand = Brand::create([
        'name' => 'Directory Other Brand',
        'slug' => 'directory-other-brand',
    ]);
    $inactiveBrand = Brand::create([
        'name' => 'Directory Inactive Brand',
        'slug' => 'directory-inactive-brand',
    ]);
    Brand::create([
        'name' => 'Empty Directory Brand',
        'slug' => 'empty-directory-brand',
    ]);
    storefrontProduct($tenant, $category, $matchingBrand);
    storefrontProduct($tenant, $category, $matchingBrand, [
        'name' => 'Inactive brand product',
        'slug' => 'inactive-brand-product',
        'is_active' => false,
    ]);
    storefrontProduct($tenant, $category, $otherBrand);
    storefrontProduct($pendingTenant, $category, $inactiveBrand);

    $this->get(route('brands.browse'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Brands/Browse')
            ->where('brands.total', 2)
            ->where(
                'brands.data',
                fn ($brands) => collect($brands)
                    ->keyBy('slug')
                    ->map(fn ($brand) => $brand['products_count'])
                    ->all() === [
                        'directory-good-brand' => 1,
                        'directory-other-brand' => 1,
                    ],
            )
            ->where(
                'brands.data.0.logo',
                fn ($logo) => str_ends_with($logo, '/storage/brands/good-brand.png'),
            ));

    $this->get(route('brands.browse', ['search' => 'good']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('brands.total', 1)
            ->where('brands.data.0.slug', 'directory-good-brand')
            ->where('filters.search', 'good'));
});

test('store details show only active products for the selected active seller', function () {
    $store = storefrontTenant();
    $otherStore = storefrontTenant();
    $category = Category::create([
        'name' => 'Store Details Category',
        'slug' => 'store-details-category',
    ]);
    $product = storefrontProduct($store, $category);
    $lowPriceProduct = storefrontProduct($store, $category, attributes: [
        'name' => 'Low Price Store Product',
        'slug' => 'low-price-store-product',
        'base_price' => 700,
    ]);
    $discountedProduct = storefrontProduct($store, $category, attributes: [
        'name' => 'Discounted Store Product',
        'slug' => 'discounted-store-product',
        'base_price' => 10000,
        'sale_price' => 7000,
    ]);
    storefrontProduct($store, $category, attributes: [
        'name' => 'Inactive Store Product',
        'slug' => 'inactive-store-product',
        'is_active' => false,
    ]);
    storefrontProduct($otherStore, $category, attributes: [
        'name' => 'Other Seller Product',
        'slug' => 'other-seller-product',
    ]);

    $this->get(route('stores.show', $store->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Stores/Show')
            ->where('store.slug', $store->slug)
            ->where('store.products_count', 3)
            ->where('products.total', 3)
            ->has('reviews.data', 0)
            ->where('store.member_since', $store->created_at->year)
            ->where(
                'products.data',
                fn ($data) => collect($data)->pluck('id')->contains($product->id),
            ));

    $this->get(route('stores.show', [
        'store' => $store->slug,
        'price_range' => 'under_1000',
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('products.total', 1)
            ->where('products.data.0.id', $lowPriceProduct->id)
            ->where('filters.price_range', 'under_1000'));

    $this->get(route('stores.show', [
        'store' => $store->slug,
        'discounted' => '1',
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('products.total', 1)
            ->where('products.data.0.id', $discountedProduct->id)
            ->where('filters.discounted', true));

    $suspendedStore = storefrontTenant('suspended');
    $this->get(route('stores.show', $suspendedStore->slug))
        ->assertNotFound();
});

test('home all products section is limited to eighteen active catalog products', function () {
    $tenant = storefrontTenant();
    $category = Category::create([
        'name' => 'All Products Category',
        'slug' => 'all-products-category',
    ]);

    for ($index = 0; $index < 20; $index++) {
        storefrontProduct($tenant, $category, attributes: [
            'name' => "Home Product {$index}",
            'slug' => "home-product-{$index}",
        ]);
    }

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('allProducts.data', 18)
            ->where('allProducts.last_page', 2));

    $this->get(route('home', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('allProducts.data', 2)
            ->where('allProducts.current_page', 2));
});

test('home sections expose one purchasable variant and branch for quick add', function () {
    $tenant = storefrontTenant();
    $category = Category::create([
        'name' => 'Quick Add Category',
        'slug' => 'quick-add-category',
    ]);

    $branch = Branch::create([
        'tenant_id' => $tenant->id,
        'name' => 'Quick Add Branch',
        'address' => 'Street 1',
        'city' => 'Chattogram',
        'phone' => '01700000000',
        'is_active' => true,
    ]);

    $stocked = storefrontProduct($tenant, $category, attributes: [
        'name' => 'Stocked Product',
        'slug' => 'stocked-product',
        'rating_avg' => 4.5,
        'rating_count' => 10,
    ]);
    $variant = ProductVariant::withoutGlobalScopes()->create([
        'product_id' => $stocked->id,
        'sku' => 'QA-'.uniqid(),
        'size' => null,
        'color' => null,
        'price' => 1500,
    ]);
    BranchStock::create([
        'branch_id' => $branch->id,
        'variant_id' => $variant->id,
        'quantity' => 5,
    ]);

    $outOfStock = storefrontProduct($tenant, $category, attributes: [
        'name' => 'Out Of Stock Product',
        'slug' => 'out-of-stock-product',
    ]);
    $dryVariant = ProductVariant::withoutGlobalScopes()->create([
        'product_id' => $outOfStock->id,
        'sku' => 'QA-'.uniqid(),
        'size' => null,
        'color' => null,
        'price' => 1500,
    ]);
    BranchStock::create([
        'branch_id' => $branch->id,
        'variant_id' => $dryVariant->id,
        'quantity' => 0,
    ]);

    $bare = storefrontProduct($tenant, $category, attributes: [
        'name' => 'Bare Product',
        'slug' => 'bare-product',
    ]);

    $sibling = storefrontProduct($tenant, $category, attributes: [
        'name' => 'Sibling Product',
        'slug' => 'sibling-product',
    ]);
    $siblingVariant = ProductVariant::withoutGlobalScopes()->create([
        'product_id' => $sibling->id,
        'sku' => 'QA-'.uniqid(),
        'size' => null,
        'color' => null,
        'price' => 1800,
    ]);
    BranchStock::create([
        'branch_id' => $branch->id,
        'variant_id' => $siblingVariant->id,
        'quantity' => 3,
    ]);

    $stocked->forceFill(['created_at' => now()->subSeconds(1)])->save();
    $outOfStock->forceFill(['created_at' => now()->subSeconds(2)])->save();
    $bare->forceFill(['created_at' => now()->subSeconds(3)])->save();
    $sibling->forceFill(['created_at' => now()->subSeconds(4)])->save();

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('allProducts.data.0.default_variant_id', $variant->id)
            ->where('allProducts.data.0.default_branch_id', $branch->id)
            ->where('allProducts.data.1.default_variant_id', null)
            ->where('allProducts.data.1.default_branch_id', null)
            ->where('allProducts.data.2.default_variant_id', null)
            ->where('allProducts.data.2.default_branch_id', null)
            ->where('newArrivals.0.default_variant_id', $variant->id)
            ->where('newArrivals.0.default_branch_id', $branch->id)
            ->where('featuredProducts.0.default_variant_id', $variant->id));

    $this->get(route('shop.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('products.data.0.default_variant_id', $variant->id)
            ->where('products.data.0.default_branch_id', $branch->id)
            ->where('products.data.1.default_variant_id', null)
            ->where('products.data.1.default_branch_id', null));

    $this->get('/shop/stocked-product')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where(
                'relatedProducts',
                function ($related) use ($branch, $siblingVariant): bool {
                    $purchasable = collect($related)
                        ->values()
                        ->filter(
                            fn ($item): bool => ($item['default_variant_id'] ?? null) !== null
                                || ($item['default_branch_id'] ?? null) !== null,
                        );

                    return $purchasable->count() === 1
                        && $purchasable->first()['default_variant_id'] === $siblingVariant->id
                        && $purchasable->first()['default_branch_id'] === $branch->id;
                },
            ));
});

test('home displays all categories including nested categories beyond the old limit', function () {
    $parent = Category::create([
        'name' => 'Category Parent',
        'slug' => 'category-parent',
    ]);
    $child = Category::create([
        'parent_id' => $parent->id,
        'name' => 'Category Child',
        'slug' => 'category-child',
    ]);

    for ($index = 0; $index < 9; $index++) {
        Category::create([
            'name' => "Extra Category {$index}",
            'slug' => "extra-category-{$index}",
        ]);
    }

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('categories', 11)
            ->where('categories', fn ($categories) => collect($categories)
                ->contains('slug', $child->slug)));
});

test('home flash sale lists active discounted products only', function () {
    $tenant = storefrontTenant();
    $category = Category::create([
        'name' => 'Flash Sale Category',
        'slug' => 'flash-sale-category',
    ]);
    $saleProduct = storefrontProduct($tenant, $category, attributes: [
        'base_price' => 2000,
        'sale_price' => 1500,
    ]);
    storefrontProduct($tenant, $category, attributes: [
        'base_price' => 2000,
        'sale_price' => 2000,
    ]);
    storefrontProduct($tenant, $category, attributes: [
        'base_price' => 2000,
        'sale_price' => 1500,
        'is_active' => false,
    ]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('flashSaleProducts', 1)
            ->where('flashSaleProducts.0.id', $saleProduct->id));
});

test('help and faq page uses the storefront layout page', function () {
    $this->get(route('faq'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Faq'));
});

test('shop filters products by category brand gender price color and size and paginates query strings', function () {
    $tenant = storefrontTenant();
    $category = Category::create(['name' => 'Shoes', 'slug' => 'shoes']);
    $otherCategory = Category::create(['name' => 'Bags', 'slug' => 'bags']);
    $brand = Brand::create(['name' => 'Good Brand', 'slug' => 'good-brand']);
    $otherBrand = Brand::create(['name' => 'Other Brand', 'slug' => 'other-brand']);
    $matching = storefrontProduct($tenant, $category, $brand, [
        'name' => 'Blue Trail Shoe',
        'description' => 'Lightweight shoes for travel.',
        'gender' => 'men',
        'base_price' => 2200,
        'sale_price' => 1800,
    ]);
    $matching->variants()->create([
        'sku' => 'PUBLIC-SHOP-SHOE',
        'size' => '42',
        'color' => 'Blue',
    ]);
    $wrongBrand = storefrontProduct($tenant, $category, $otherBrand, [
        'name' => 'Blue trail alternative',
        'gender' => 'men',
        'base_price' => 1700,
    ]);
    $wrongBrand->variants()->create([
        'sku' => 'PUBLIC-SHOP-SHOE-2',
        'size' => '42',
        'color' => 'Blue',
    ]);
    storefrontProduct($tenant, $otherCategory, $brand, [
        'name' => 'Red bag',
        'gender' => 'women',
        'base_price' => 500,
    ]);
    for ($index = 0; $index < 13; $index++) {
        storefrontProduct($tenant, $category, attributes: [
            'name' => "Listing item {$index}",
            'slug' => "listing-item-{$index}",
        ]);
    }

    foreach ([
        ['category' => 'shoes', 'brand' => ['good-brand']],
        ['category' => 'shoes', 'gender' => 'men'],
        ['category' => 'shoes', 'min_price' => 1700, 'max_price' => 1900],
        ['category' => 'shoes', 'color' => ['Blue'], 'size' => ['42']],
    ] as $singleFilterSet) {
        $this->get(route('shop.index', $singleFilterSet))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data')
                ->where('products.data', fn ($products) => collect($products)
                    ->contains('id', $matching->id)));
    }
    foreach ([
        ['category' => 'shoes', 'brand' => ['good-brand'], 'gender' => 'men'],
        ['category' => 'shoes', 'brand' => ['good-brand'], 'gender' => 'men', 'min_price' => 1700, 'max_price' => 1900],
        ['category' => 'shoes', 'color' => ['Blue'], 'size' => ['42']],
        ['category' => 'shoes', 'brand' => ['good-brand'], 'color' => ['Blue'], 'size' => ['42']],
    ] as $combinedFilters) {
        $this->get(route('shop.index', $combinedFilters))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data')
                ->where('products.data', fn ($products) => collect($products)
                    ->contains('id', $matching->id)));
    }

    $this->get(route('shop.index', [
        'category' => 'shoes',
        'brand' => ['good-brand'],
        'gender' => 'men',
        'min_price' => 1700,
        'max_price' => 1900,
        'color' => ['Blue'],
        'size' => ['42'],
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Shop/Index')
            ->has('products.data', 1)
            ->where('products.data.0.id', $matching->id)
            ->where('filters.category', 'shoes')
            ->where('filters.brand.0', 'good-brand'));

    $this->get(route('shop.index', ['search' => 'Blue']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 2)
            ->where('filters.search', 'Blue'));

    $this->get(route('shop.index', ['page' => 2, 'search' => 'Listing']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('products.current_page', 2)
            ->where('products.per_page', 12)
            ->where('products.links.1.url', fn ($url) => str_contains((string) $url, 'search=Listing')));
});

test('customers can review a product only after its sub-order is delivered', function () {
    Queue::fake();
    $tenant = storefrontTenant();
    $category = Category::create(['name' => 'Review Category', 'slug' => 'review-category']);
    $product = storefrontProduct($tenant, $category);
    $variant = $product->variants()->create(['sku' => 'REVIEW-ELIGIBILITY-SKU']);
    $branch = Branch::withoutGlobalScopes()->create([
        'tenant_id' => $tenant->id,
        'name' => 'Review branch',
        'address' => '1 Review Street',
        'city' => 'Dhaka',
        'phone' => '+8801700000000',
        'is_active' => true,
    ]);
    $customer = Customer::factory()->create();
    $order = $customer->orders()->create([
        'order_no' => 'REVIEW-'.strtoupper(uniqid()),
        'shipping_address' => ['city' => 'Dhaka'],
        'subtotal' => 1500,
        'shipping_fee' => 0,
        'discount' => 0,
        'total' => 1500,
        'payment_method' => 'cod',
        'payment_status' => 'pending',
    ]);
    $subOrder = $order->subOrders()->create([
        'tenant_id' => $tenant->id,
        'branch_id' => $branch->id,
        'total' => 1500,
        'status' => 'pending',
    ]);
    $orderItem = $subOrder->items()->create([
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'name' => $product->name,
        'price' => 1500,
        'quantity' => 1,
    ]);

    $this->actingAs($customer, 'customer')
        ->post(route('customer.reviews.store', $product->id), [
            'order_item_id' => $orderItem->id,
            'rating' => 5,
            'comment' => 'Excellent.',
        ])
        ->assertForbidden();
    $this->assertDatabaseCount('reviews', 0);

    $subOrder->update(['status' => 'delivered']);
    $this->post(route('customer.reviews.store', $product->id), [
        'order_item_id' => $orderItem->id,
        'rating' => 5,
        'comment' => 'Excellent.',
    ])->assertRedirect();

    $this->assertDatabaseHas('reviews', [
        'customer_id' => $customer->id,
        'product_id' => $product->id,
        'order_item_id' => $orderItem->id,
        'rating' => 5,
    ]);
});

test('public catalog ignores staff tenant scopes while excluding inactive tenant products', function () {
    $staffTenant = storefrontTenant();
    $storeTenant = storefrontTenant();
    $inactiveTenant = storefrontTenant('suspended');
    $category = Category::create(['name' => 'Shared Category', 'slug' => 'shared-category']);
    $storeProduct = storefrontProduct($storeTenant, $category);
    storefrontProduct($inactiveTenant, $category);

    $staff = User::factory()->create(['tenant_id' => $staffTenant->id]);
    $this->actingAs($staff, 'web')
        ->get(route('shop.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.id', $storeProduct->id));
});

test('storefront shares customer cart and favorites counts', function () {
    $tenant = storefrontTenant();
    $category = Category::create(['name' => 'Count category', 'slug' => 'count-category']);
    $product = storefrontProduct($tenant, $category);
    $variant = $product->variants()->create(['sku' => 'STOREFRONT-COUNT-SKU']);
    $branch = Branch::withoutGlobalScopes()->create([
        'tenant_id' => $tenant->id,
        'name' => 'Count branch',
        'address' => '1 Count Street',
        'city' => 'Dhaka',
        'phone' => '+8801700000000',
        'is_active' => true,
    ]);
    $customer = Customer::create([
        'name' => 'Count Customer',
        'email' => 'count-customer@example.test',
        'password' => 'password',
    ]);
    $cart = Cart::create(['customer_id' => $customer->id]);
    CartItem::create([
        'cart_id' => $cart->id,
        'variant_id' => $variant->id,
        'branch_id' => $branch->id,
        'quantity' => 3,
    ]);
    Wishlist::create([
        'customer_id' => $customer->id,
        'product_id' => $product->id,
    ]);

    $this->actingAs($customer, 'customer')
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('storefront.cartCount', 3)
            ->where('storefront.favoritesCount', 1));
});

test('product detail includes variants branch availability approved reviews and related products', function () {
    $tenant = storefrontTenant();
    $category = Category::create(['name' => 'Accessories', 'slug' => 'accessories']);
    $product = storefrontProduct($tenant, $category, attributes: [
        'name' => 'Leather Wallet',
        'slug' => 'leather-wallet',
        'rating_avg' => 5,
        'rating_count' => 1,
    ]);
    ProductImage::create([
        'product_id' => $product->id,
        'path' => 'https://images.example.test/wallet.jpg',
        'is_primary' => true,
    ]);
    $variant = $product->variants()->create([
        'sku' => 'PUBLIC-WALLET-1',
        'size' => 'One size',
        'color' => 'Brown',
        'price' => 1200,
    ]);
    $branch = Branch::withoutGlobalScopes()->create([
        'tenant_id' => $tenant->id,
        'name' => 'Central Store',
        'address' => '10 Market Road',
        'city' => 'Dhaka',
        'phone' => '+8801700000000',
        'is_active' => true,
    ]);
    BranchStock::create([
        'branch_id' => $branch->id,
        'variant_id' => $variant->id,
        'quantity' => 3,
    ]);
    $customer = Customer::create([
        'name' => 'Storefront Reviewer',
        'email' => 'reviewer@example.test',
        'password' => 'password',
    ]);
    Review::create([
        'customer_id' => $customer->id,
        'product_id' => $product->id,
        'rating' => 5,
        'comment' => 'Excellent finish.',
        'is_approved' => true,
    ]);
    Review::create([
        'customer_id' => Customer::create([
            'name' => 'Waiting Reviewer',
            'email' => 'waiting-reviewer@example.test',
            'password' => 'password',
        ])->id,
        'product_id' => $product->id,
        'rating' => 1,
        'comment' => 'Not public yet.',
        'is_approved' => false,
    ]);
    $related = storefrontProduct($tenant, $category);

    $this->get(route('shop.show', $product->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Shop/Show')
            ->where('product.id', $product->id)
            ->has('product.variants', 1)
            ->has('product.images', 1)
            ->has('branchAvailability', 1)
            ->where('branchAvailability.0.stocks.0.quantity', 3)
            ->has('reviews.data', 1)
            ->where('reviews.data.0.comment', 'Excellent finish.')
            ->has('relatedProducts', 1)
            ->where('relatedProducts.0.id', $related->id));
});
