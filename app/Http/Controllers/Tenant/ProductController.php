<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreProductRequest;
use App\Http\Requests\Tenant\UpdateProductRequest;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductAttribute;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        $user = request()->user();
        $this->authorize('viewAny', Product::class);
        $search = request()->string('search')->trim()->toString();
        $products = Product::query()
            ->where('tenant_id', $user->tenant_id)
            ->when($user->hasRole('branch-manager'), fn ($query) => $query->whereHas(
                'branchStocks',
                fn ($stocks) => $stocks->where('branch_id', $user->branch_id),
            ))
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->with([
                'category:id,name',
                'brand:id,name',
                'variants:id,product_id,sku,size,color,price',
                'images',
                'attributeValues.attribute:id,name',
            ])
            ->withCount('variants')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Tenant/Products/Index', [
            'products' => $products,
            'filters' => ['search' => $search],
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'brands' => Brand::query()->orderBy('name')->get(['id', 'name']),
            'attributes' => ProductAttribute::query()->orderBy('name')->get(['id', 'name']),
            'canManage' => $user->hasRole('tenant-admin'),
            'productLimit' => $user->tenant->activeSubscription?->plan?->max_products ?? 0,
            'productCount' => $user->tenant->products()->count(),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $tenant = $request->user()->tenant;
        $data = $request->validated();

        $product = DB::transaction(function () use ($request, $tenant, $data): Product {
            $tenant = Tenant::query()->lockForUpdate()->findOrFail($tenant->id);
            $limit = $tenant->activeSubscription?->plan?->max_products ?? 0;
            $count = Product::query()->where('tenant_id', $tenant->id)->lockForUpdate()->count();

            if ($count >= $limit) {
                throw ValidationException::withMessages([
                    'name' => "Your active plan allows up to {$limit} products.",
                ]);
            }

            $product = $tenant->products()->create(collect($data)->except([
                'variants',
                'images',
                'attributes',
            ])->all());

            foreach ($data['variants'] as $variant) {
                $product->variants()->create($variant);
            }

            $this->syncAttributes($product, $data['attributes'] ?? []);
            $this->storeImages($product, $request->file('images', []));

            return $product;
        });

        activity('tenant')->causedBy($request->user())->performedOn($product)->log('Created product');

        return back()->with('success', 'Product created.');
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $this->authorize('update', $product);
        $data = $request->validated();

        DB::transaction(function () use ($request, $product, $data): void {
            $product->update(collect($data)->except(['variants', 'images', 'attributes'])->all());

            $existingIds = $product->variants()->pluck('id')->all();
            $submittedIds = [];

            foreach ($data['variants'] as $variantData) {
                $variantId = $variantData['id'] ?? null;
                $attributes = collect($variantData)->except('id')->all();

                if ($variantId !== null) {
                    abort_unless(in_array((int) $variantId, $existingIds, true), 404);
                    $product->variants()->whereKey($variantId)->update($attributes);
                    $submittedIds[] = $variantId;
                } else {
                    $product->variants()->create($attributes);
                }
            }

            $this->syncAttributes($product, $data['attributes'] ?? []);
            $this->storeImages($product, $request->file('images', []));
        });

        activity('tenant')->causedBy($request->user())->performedOn($product)->log('Updated product');

        return back()->with('success', 'Product updated.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->authorize('delete', $product);

        if ($product->orderItems()->exists()) {
            throw ValidationException::withMessages([
                'product' => 'A product with order history cannot be deleted.',
            ]);
        }

        DB::transaction(function () use ($product): void {
            activity('tenant')->causedBy(request()->user())->performedOn($product)->log('Deleted product');
            foreach ($product->images as $image) {
                if (! str_starts_with($image->path, 'http')) {
                    Storage::disk('public')->delete($image->path);
                }
            }
            $product->delete();
        });

        return back()->with('success', 'Product deleted.');
    }

    /**
     * @param  array<int, array{attribute_id: int|string, value: string}>  $attributes
     */
    private function syncAttributes(Product $product, array $attributes): void
    {
        $keptIds = [];
        foreach ($attributes as $attribute) {
            $value = $product->attributeValues()->updateOrCreate(
                ['attribute_id' => $attribute['attribute_id']],
                ['value' => $attribute['value']],
            );
            $keptIds[] = $value->id;
        }

        $product->attributeValues()->when(
            $keptIds !== [],
            fn ($query) => $query->whereNotIn('id', $keptIds),
            fn ($query) => $query,
        )->delete();
    }

    /**
     * @param  array<int, UploadedFile>  $images
     */
    private function storeImages(Product $product, array $images): void
    {
        foreach ($images as $image) {
            $path = $image->store('products/'.$product->id, 'public');
            $product->images()->create([
                'path' => $path,
                'is_primary' => ! $product->images()->exists(),
            ]);
        }
    }
}
