<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\LegalPage;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Response;

class StorefrontSeoController extends Controller
{
    public function robots(): Response
    {
        return response()->view('seo.robots', [
            'sitemapUrl' => 'https://sheradam.shop/sitemap.xml',
        ])->header('Content-Type', 'text/plain; charset=UTF-8');
    }

    public function sitemap(): Response
    {
        $baseUrl = rtrim((string) config('app.url'), '/');
        $urls = collect([
            ['path' => route('home', [], false), 'lastmod' => now()],
            ['path' => route('about', [], false), 'lastmod' => now()],
            ['path' => route('contact', [], false), 'lastmod' => now()],
            ['path' => route('faq', [], false), 'lastmod' => now()],
            ['path' => route('shop.index', [], false), 'lastmod' => now()],
            ['path' => route('categories.browse', [], false), 'lastmod' => now()],
            ['path' => route('brands.browse', [], false), 'lastmod' => now()],
            ['path' => route('stores.index', [], false), 'lastmod' => now()],
        ]);

        foreach (LegalPage::query()->get(['slug', 'updated_at']) as $legalPage) {
            $routeName = match ($legalPage->slug) {
                'terms-of-use' => 'legal.terms',
                'privacy-policy' => 'legal.privacy',
                'refund-policy' => 'legal.refund',
                default => null,
            };

            if ($routeName !== null) {
                $urls->push([
                    'path' => route($routeName, [], false),
                    'lastmod' => $legalPage->updated_at,
                ]);
            }
        }

        foreach (Tenant::query()
            ->where('status', 'active')
            ->get(['slug', 'updated_at']) as $store) {
            $urls->push([
                'path' => route('stores.show', ['store' => $store->slug], false),
                'lastmod' => $store->updated_at,
            ]);
        }

        foreach (Product::withoutGlobalScopes()
            ->where('is_active', true)
            ->whereHas('tenant', fn (Builder $query) => $query->where('status', 'active'))
            ->get(['slug', 'updated_at']) as $product) {
            $urls->push([
                'path' => route('shop.show', ['product' => $product->slug], false),
                'lastmod' => $product->updated_at,
            ]);
        }

        foreach (Category::query()
            ->whereHas('products', fn (Builder $query) => $query
                ->withoutGlobalScopes()
                ->where('is_active', true)
                ->whereHas('tenant', fn (Builder $tenantQuery) => $tenantQuery
                    ->where('status', 'active')))
            ->get(['slug', 'updated_at']) as $category) {
            $urls->push([
                'path' => route('shop.index', ['category' => $category->slug], false),
                'lastmod' => $category->updated_at,
            ]);
        }

        return response()->view('seo.sitemap', [
            'urls' => $urls->map(fn (array $url): array => [
                'loc' => $baseUrl.$url['path'],
                'lastmod' => $url['lastmod']?->toAtomString(),
            ]),
        ])->header('Content-Type', 'application/xml; charset=UTF-8');
    }
}
