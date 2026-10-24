<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Services\QuickAddService;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        $products = Product::withoutGlobalScopes()
            ->where('is_active', true)
            ->whereHas('tenant', fn ($query) => $query->where('status', 'active'))
            ->withStorefrontCardDetails()
            ->with(['images', 'brand:id,name,slug'])
            ->withAvg(['reviews' => fn ($query) => $query->where('is_approved', true)], 'rating')
            ->withCount(['reviews' => fn ($query) => $query->where('is_approved', true)]);

        $featuredProducts = (clone $products)
            ->orderByDesc('rating_avg')
            ->orderByDesc('rating_count')
            ->limit(8)
            ->get();
        $newArrivals = (clone $products)
            ->latest()
            ->limit(8)
            ->get();
        $flashSaleProducts = (clone $products)
            ->whereNotNull('sale_price')
            ->where('sale_price', '>', 0)
            ->whereColumn('sale_price', '<', 'base_price')
            ->latest()
            ->limit(20)
            ->get();
        $allProductsPage = (clone $products)
            ->latest()
            ->paginate(18)
            ->withQueryString();

        // Quick-add buttons on the storefront cards need one purchasable
        // (variant, branch) pair with live stock for every listed product.
        $purchasePairs = QuickAddService::pairs($allProductsPage->getCollection()
            ->concat($featuredProducts)
            ->concat($newArrivals)
            ->concat($flashSaleProducts));

        return Inertia::render('Home', [
            'categories' => Category::query()
                ->withCount(['products' => fn ($query) => $query
                    ->withoutGlobalScopes()
                    ->where('is_active', true)
                    ->whereHas('tenant', fn ($tenants) => $tenants->where('status', 'active'))])
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'image']),
            'featuredProducts' => QuickAddService::payload($featuredProducts, $purchasePairs),
            'newArrivals' => QuickAddService::payload($newArrivals, $purchasePairs),
            'flashSaleProducts' => QuickAddService::payload($flashSaleProducts, $purchasePairs),
            'allProducts' => $allProductsPage->through(
                fn (Product $product): array => QuickAddService::payloadProduct($product, $purchasePairs),
            ),
            'brands' => Brand::query()
                ->whereHas('products', fn ($query) => $query
                    ->withoutGlobalScopes()
                    ->where('is_active', true)
                    ->whereHas('tenant', fn ($tenants) => $tenants->where('status', 'active')))
                ->orderBy('name')
                ->limit(12)
                ->get(['id', 'name', 'slug', 'logo']),
            'stores' => Tenant::query()
                ->where('status', 'active')
                ->whereHas('products', fn ($query) => $query
                    ->withoutGlobalScopes()
                    ->where('is_active', true))
                ->withCount(['products' => fn ($query) => $query
                    ->withoutGlobalScopes()
                    ->where('is_active', true)])
                ->orderByDesc('products_count')
                ->orderBy('name')
                ->limit(8)
                ->get(['id', 'name', 'slug', 'logo']),
        ]);
    }
}
