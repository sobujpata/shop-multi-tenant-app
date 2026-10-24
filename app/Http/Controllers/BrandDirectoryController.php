<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\BrandDirectoryRequest;
use App\Models\Brand;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BrandDirectoryController extends Controller
{
    public function __invoke(BrandDirectoryRequest $request): Response
    {
        $search = trim($request->validated('search', ''));
        $brands = Brand::query()
            ->withCount(['products' => fn (Builder $products) => $products
                ->withoutGlobalScopes()
                ->where('is_active', true)
                ->whereHas('tenant', fn (Builder $tenants) => $tenants
                    ->where('status', 'active'))])
            ->whereHas('products', fn (Builder $products) => $products
                ->withoutGlobalScopes()
                ->where('is_active', true)
                ->whereHas('tenant', fn (Builder $tenants) => $tenants
                    ->where('status', 'active')))
            ->when($search !== '', fn (Builder $query) => $query
                ->where(function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                }))
            ->orderBy('name')
            ->paginate(24)
            ->withQueryString()
            ->through(fn (Brand $brand): array => [
                'id' => $brand->id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'products_count' => $brand->products_count,
                'logo' => $brand->logo === null
                    ? null
                    : (str_starts_with($brand->logo, 'http')
                        ? $brand->logo
                        : Storage::disk('public')->url($brand->logo)),
            ]);

        return Inertia::render('Brands/Browse', [
            'brands' => $brands,
            'filters' => ['search' => $search],
        ]);
    }
}
