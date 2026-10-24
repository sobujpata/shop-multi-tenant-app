<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreIndexRequest;
use App\Http\Requests\StoreProductsRequest;
use App\Models\Product;
use App\Models\Review;
use App\Models\Tenant;
use App\Services\QuickAddService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function index(StoreIndexRequest $request): Response
    {
        $search = trim($request->validated('search', ''));

        $stores = Tenant::query()
            ->where('status', 'active')
            ->when($search !== '', fn (Builder $query) => $query
                ->where('name', 'like', "%{$search}%"))
            ->withCount(['products' => fn ($query) => $query
                ->withoutGlobalScopes()
                ->where('is_active', true)])
            ->orderByDesc('products_count')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Stores/Index', [
            'stores' => $stores,
            'filters' => ['search' => $search],
        ]);
    }

    public function show(StoreProductsRequest $request, Tenant $store): Response
    {
        abort_unless($store->status === 'active', 404);

        $filters = $request->validated();
        $products = Product::withoutGlobalScopes()
            ->where('tenant_id', $store->id)
            ->where('is_active', true)
            ->withStorefrontCardDetails()
            ->when(isset($filters['price_range']), function (Builder $query) use ($filters): void {
                match ($filters['price_range']) {
                    'under_1000' => $query->whereRaw('COALESCE(sale_price, base_price) < 1000'),
                    '1000_5000' => $query->whereRaw('COALESCE(sale_price, base_price) >= 1000 AND COALESCE(sale_price, base_price) < 5000'),
                    '5000_20000' => $query->whereRaw('COALESCE(sale_price, base_price) >= 5000 AND COALESCE(sale_price, base_price) < 20000'),
                    '20000_50000' => $query->whereRaw('COALESCE(sale_price, base_price) >= 20000 AND COALESCE(sale_price, base_price) <= 50000'),
                    'over_50000' => $query->whereRaw('COALESCE(sale_price, base_price) > 50000'),
                };
            })
            ->when(isset($filters['rating']), fn (Builder $query) => $query->whereRaw(
                '(SELECT AVG(reviews.rating) FROM reviews WHERE reviews.product_id = products.id AND reviews.is_approved = ?) >= ?',
                [true, (float) $filters['rating']],
            ))
            ->when(
                filter_var($filters['discounted'] ?? false, FILTER_VALIDATE_BOOLEAN),
                fn (Builder $query) => $query
                    ->whereNotNull('sale_price')
                    ->whereRaw('sale_price <= base_price * 0.8'),
            )
            ->with(['images', 'brand:id,name,slug', 'category:id,name,slug'])
            ->withAvg(['reviews' => fn ($reviews) => $reviews->where('is_approved', true)], 'rating')
            ->withCount(['reviews' => fn ($reviews) => $reviews->where('is_approved', true)])
            ->when(($filters['sort'] ?? 'relevance') === 'price_asc', fn (Builder $query) => $query->orderByRaw('COALESCE(sale_price, base_price) asc'))
            ->when(($filters['sort'] ?? 'relevance') === 'price_desc', fn (Builder $query) => $query->orderByRaw('COALESCE(sale_price, base_price) desc'))
            ->when(($filters['sort'] ?? 'relevance') === 'rating', fn (Builder $query) => $query->orderByDesc('rating_avg')->orderByDesc('rating_count'))
            ->when(in_array($filters['sort'] ?? 'relevance', ['relevance', 'newest'], true), fn (Builder $query) => $query->latest())
            ->paginate(20)
            ->withQueryString();

        $totalProducts = Product::withoutGlobalScopes()
            ->where('tenant_id', $store->id)
            ->where('is_active', true)
            ->count();

        $purchasePairs = QuickAddService::pairs($products->getCollection());
        $products->through(
            fn (Product $product): array => QuickAddService::payloadProduct($product, $purchasePairs),
        );

        $reviewStats = DB::table('reviews')
            ->join('products', 'products.id', '=', 'reviews.product_id')
            ->where('products.tenant_id', $store->id)
            ->where('products.is_active', true)
            ->where('reviews.is_approved', true)
            ->selectRaw('AVG(reviews.rating) as average_rating, COUNT(reviews.id) as reviews_count')
            ->first();

        $reviews = Review::query()
            ->where('is_approved', true)
            ->whereHas('product', fn (Builder $query) => $query
                ->withoutGlobalScopes()
                ->where('tenant_id', $store->id)
                ->where('is_active', true))
            ->with(['customer:id,name', 'images:id,review_id,path'])
            ->latest()
            ->paginate(10, ['*'], 'reviews_page')
            ->withQueryString();

        return Inertia::render('Stores/Show', [
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
                'logo' => $store->logo,
                'member_since' => $store->created_at?->year,
                'products_count' => $totalProducts,
                'average_rating' => (float) ($reviewStats->average_rating ?? 0),
                'reviews_count' => (int) ($reviewStats->reviews_count ?? 0),
            ],
            'products' => $products,
            'reviews' => $reviews,
            'filters' => [
                'price_range' => $filters['price_range'] ?? null,
                'rating' => $filters['rating'] ?? null,
                'discounted' => filter_var($filters['discounted'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'sort' => $filters['sort'] ?? 'relevance',
            ],
        ]);
    }
}
