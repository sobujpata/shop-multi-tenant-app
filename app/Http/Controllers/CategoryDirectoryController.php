<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\CategoryDirectoryRequest;
use App\Models\Category;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CategoryDirectoryController extends Controller
{
    public function __invoke(CategoryDirectoryRequest $request): Response
    {
        $search = trim($request->validated('search', ''));
        $categories = Category::query()
            ->with('parent:id,name')
            ->withCount(['products' => fn (Builder $products) => $products
                ->withoutGlobalScopes()
                ->where('is_active', true)
                ->whereHas('tenant', fn (Builder $tenants) => $tenants
                    ->where('status', 'active'))])
            ->when($search !== '', fn (Builder $query) => $query
                ->where(function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                }))
            ->orderBy('name')
            ->paginate(24)
            ->withQueryString()
            ->through(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'parent' => $category->parent?->name,
                'products_count' => $category->products_count,
                'image' => $category->image === null
                    ? null
                    : (str_starts_with($category->image, 'http')
                        ? $category->image
                        : Storage::disk('public')->url($category->image)),
            ]);

        return Inertia::render('Categories/Browse', [
            'categories' => $categories,
            'filters' => ['search' => $search],
        ]);
    }
}
