<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\ShopFilterRequest;
use App\Models\Branch;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Services\QuickAddService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    public function index(ShopFilterRequest $request): Response
    {
        $filters = $request->validated();
        if (
            isset($filters['min_price'], $filters['max_price'])
            && (float) $filters['max_price'] < (float) $filters['min_price']
        ) {
            throw ValidationException::withMessages([
                'max_price' => 'The maximum price must be greater than or equal to the minimum price.',
            ]);
        }

        $query = $this->publicProducts()
            ->withStorefrontCardDetails()
            ->with(['images', 'brand:id,name,slug', 'category:id,name,slug'])
            ->withAvg(['reviews' => fn ($reviews) => $reviews->where('is_approved', true)], 'rating')
            ->withCount(['reviews' => fn ($reviews) => $reviews->where('is_approved', true)]);

        if (! empty($filters['category'])) {
            $query->whereIn(
                'category_id',
                Category::query()->select('id')->where('slug', $filters['category']),
            );
        }
        if (! empty($filters['brand'])) {
            $query->whereIn(
                'brand_id',
                Brand::query()->select('id')->whereIn('slug', $filters['brand']),
            );
        }
        if (! empty($filters['gender'])) {
            $query->where('gender', $filters['gender']);
        }
        $priceCast = $query->getModel()->getConnection()->getDriverName() === 'sqlite'
            ? 'REAL'
            : 'DECIMAL(10,2)';
        if (isset($filters['min_price'])) {
            $query->whereRaw(
                "CAST(COALESCE(sale_price, base_price) AS {$priceCast}) >= CAST(? AS {$priceCast})",
                [$filters['min_price']],
            );
        }
        if (isset($filters['max_price'])) {
            $query->whereRaw(
                "CAST(COALESCE(sale_price, base_price) AS {$priceCast}) <= CAST(? AS {$priceCast})",
                [$filters['max_price']],
            );
        }
        if (! empty($filters['color']) || ! empty($filters['size'])) {
            $query->whereHas('variants', function ($variants) use ($filters): void {
                if (! empty($filters['color'])) {
                    $variants->whereIn('color', $filters['color']);
                }
                if (! empty($filters['size'])) {
                    $variants->whereIn('size', $filters['size']);
                }
            });
        }
        if (! empty($filters['search'])) {
            $search = trim($filters['search']);
            if (in_array($query->getModel()->getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
                $query->whereFullText(['name', 'description'], $search);
            } else {
                $query->where(fn ($match) => $match
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%"));
            }
        }

        match ($filters['sort'] ?? 'newest') {
            'price_asc' => $query->orderByRaw('COALESCE(sale_price, base_price) asc'),
            'price_desc' => $query->orderByRaw('COALESCE(sale_price, base_price) desc'),
            'rating' => $query->orderByDesc('rating_avg')->orderByDesc('rating_count'),
            default => $query->latest(),
        };

        $products = $query->paginate(12)->withQueryString();
        $purchasePairs = QuickAddService::pairs($products->getCollection());
        $products->through(
            fn (Product $product): array => QuickAddService::payloadProduct($product, $purchasePairs),
        );

        return Inertia::render('Shop/Index', [
            'products' => $products,
            'filters' => [
                'category' => $filters['category'] ?? null,
                'brand' => $filters['brand'] ?? [],
                'gender' => $filters['gender'] ?? null,
                'min_price' => $filters['min_price'] ?? null,
                'max_price' => $filters['max_price'] ?? null,
                'color' => $filters['color'] ?? [],
                'size' => $filters['size'] ?? [],
                'search' => $filters['search'] ?? '',
                'sort' => $filters['sort'] ?? 'newest',
            ],
            'options' => [
                'categories' => Category::query()->orderBy('name')->get(['id', 'name', 'slug']),
                'brands' => Brand::query()->whereHas('products', fn ($query) => $query
                    ->withoutGlobalScopes()
                    ->where('is_active', true)
                    ->whereHas('tenant', fn ($tenants) => $tenants->where('status', 'active')))
                    ->orderBy('name')->get(['id', 'name', 'slug']),
                'genders' => [
                    ['value' => 'men', 'label' => 'Men'],
                    ['value' => 'women', 'label' => 'Women'],
                    ['value' => 'kids', 'label' => 'Kids'],
                    ['value' => 'unisex', 'label' => 'Unisex'],
                ],
                'colors' => $this->variantOptions('color'),
                'sizes' => $this->variantOptions('size'),
                'price' => [
                    'min' => (float) ($this->publicProducts()
                        ->selectRaw('MIN(COALESCE(sale_price, base_price)) AS effective_price')
                        ->value('effective_price') ?? 0),
                    'max' => (float) ($this->publicProducts()
                        ->selectRaw('MAX(COALESCE(sale_price, base_price)) AS effective_price')
                        ->value('effective_price') ?? 0),
                ],
            ],
        ]);
    }

    public function show(Request $request, string $product): Response
    {
        $product = $this->publicProducts()
            ->where('slug', $product)
            ->with([
                'category:id,name,slug',
                'brand:id,name,slug,logo',
                'images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('id'),
                'variants' => fn ($query) => $query->orderBy('size')->orderBy('color'),
            ])
            ->withAvg(['reviews' => fn ($reviews) => $reviews->where('is_approved', true)], 'rating')
            ->withCount(['reviews' => fn ($reviews) => $reviews->where('is_approved', true)])
            ->firstOrFail();

        $reviews = Review::query()
            ->where('product_id', $product->id)
            ->where('is_approved', true)
            ->with(['customer:id,name', 'images:id,review_id,path'])
            ->latest()
            ->paginate(8, ['*'], 'reviews_page')
            ->withQueryString();

        $branchAvailability = Branch::withoutGlobalScopes()
            ->where('tenant_id', $product->tenant_id)
            ->where('is_active', true)
            ->whereHas('tenant', fn ($query) => $query->where('status', 'active'))
            ->whereHas('stocks', fn ($stocks) => $stocks
                ->where('quantity', '>', 0)
                ->whereHas('variant', fn ($variants) => $variants->where('product_id', $product->id)))
            ->with(['stocks' => fn ($stocks) => $stocks
                ->where('quantity', '>', 0)
                ->whereHas('variant', fn ($variants) => $variants->where('product_id', $product->id))
                ->with('variant:id,sku,size,color,price')])
            ->get(['id', 'tenant_id', 'name', 'city', 'address']);

        $relatedProducts = $this->publicProducts()
            ->where('category_id', $product->category_id)
            ->whereKeyNot($product->id)
            ->withStorefrontCardDetails()
            ->with(['images', 'brand:id,name,slug'])
            ->limit(4)
            ->get();
        $relatedProducts = QuickAddService::payload(
            $relatedProducts,
            QuickAddService::pairs($relatedProducts),
        );

        $customer = $request->user('customer');
        $reviewableOrderItems = $customer instanceof Customer
            ? OrderItem::query()
                ->where('product_id', $product->id)
                ->whereHas('subOrder', fn ($subOrders) => $subOrders
                    ->withoutGlobalScopes()
                    ->where('status', 'delivered')
                    ->whereHas('order', fn ($orders) => $orders->where('customer_id', $customer->id)))
                ->whereDoesntHave('review')
                ->with([
                    'subOrder' => fn ($subOrders) => $subOrders
                        ->withoutGlobalScopes()
                        ->with('order:id,order_no'),
                ])
                ->orderBy('id')
                ->get(['id', 'sub_order_id'])
                ->map(fn (OrderItem $item): array => [
                    'id' => $item->id,
                    'order_no' => $item->subOrder->order->order_no,
                ])
                ->all()
            : [];

        return Inertia::render('Shop/Show', [
            'product' => $product,
            'branchAvailability' => $branchAvailability,
            'reviews' => $reviews,
            'relatedProducts' => $relatedProducts,
            'reviewableOrderItems' => $reviewableOrderItems,
            'isWishlisted' => $customer instanceof Customer
                && $customer->wishlists()->where('product_id', $product->id)->exists(),
        ]);
    }

    /**
     * @return Builder<Product>
     */
    private function publicProducts(): Builder
    {
        return Product::withoutGlobalScopes()
            ->where('is_active', true)
            ->whereHas('tenant', fn ($query) => $query->where('status', 'active'));
    }

    /**
     * @return list<string>
     */
    private function variantOptions(string $column): array
    {
        $options = ProductVariant::query()
            ->whereNotNull($column)
            ->whereHas('product', fn ($query) => $query
                ->withoutGlobalScopes()
                ->where('is_active', true)
                ->whereHas('tenant', fn ($tenants) => $tenants->where('status', 'active')))
            ->distinct()
            ->orderBy($column)
            ->pluck($column)
            ->map(fn ($value): string => (string) $value)
            ->all();

        return array_values($options);
    }
}
