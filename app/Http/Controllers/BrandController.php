<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreBrandRequest;
use App\Http\Requests\UpdateBrandRequest;
use App\Models\Brand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class BrandController extends Controller
{
    public function index(): Response
    {
        $this->authorizeBrandAccess();
        $canViewProducts = request()->user()->can('brand.products');
        $search = request()->string('search')->trim()->toString();
        $brandQuery = Brand::query();

        if ($canViewProducts) {
            $brandQuery->withCount([
                'products' => fn ($query) => $query->withoutGlobalScopes(),
            ]);
        }

        $brands = $brandQuery
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Brand $brand): array => [
                'id' => $brand->id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                ...($canViewProducts ? ['products_count' => $brand->products_count] : []),
                'logo_url' => $brand->logo === null
                    ? null
                    : (str_starts_with($brand->logo, 'http')
                        ? $brand->logo
                        : Storage::disk('public')->url($brand->logo)),
            ]);

        return Inertia::render('Brands/Index', [
            'brands' => $brands,
            'filters' => ['search' => $search],
            'baseUrl' => request()->routeIs('super-admin.brands.*')
                ? '/super-admin/brands'
                : '/tenant/brands',
            'canCreateBrand' => request()->user()->can('brand.create'),
            'canEditBrand' => request()->user()->can('brand.edit'),
            'canDeleteBrand' => request()->user()->can('brand.delete'),
            'canViewBrandProducts' => $canViewProducts,
        ]);
    }

    public function store(StoreBrandRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('logo')) {
            $data['logo'] = $this->storeLogo($request->file('logo'));
        }

        $brand = Brand::query()->create($data);

        activity($request->user()->hasRole('super-admin') ? 'admin' : 'tenant')
            ->causedBy($request->user())
            ->performedOn($brand)
            ->log('Created brand');

        return back()->with('success', 'Brand created.');
    }

    public function update(UpdateBrandRequest $request, Brand $brand): RedirectResponse
    {
        $data = $request->validated();
        $previousLogo = $brand->logo;

        if ($request->hasFile('logo')) {
            $data['logo'] = $this->storeLogo($request->file('logo'));
        } else {
            unset($data['logo']);
        }

        $brand->update($data);

        if (isset($data['logo']) && $previousLogo !== null) {
            $this->deleteLogo($previousLogo);
        }

        activity($request->user()->hasRole('super-admin') ? 'admin' : 'tenant')
            ->causedBy($request->user())
            ->performedOn($brand)
            ->log('Updated brand');

        return back()->with('success', 'Brand updated.');
    }

    public function destroy(Brand $brand): RedirectResponse
    {
        abort_unless(request()->user()->can('brand.delete'), 403);

        if ($brand->products()->withoutGlobalScopes()->exists()) {
            throw ValidationException::withMessages([
                'brand' => 'A brand with products cannot be deleted.',
            ]);
        }

        $logo = $brand->logo;

        activity(request()->user()->hasRole('super-admin') ? 'admin' : 'tenant')
            ->causedBy(request()->user())
            ->performedOn($brand)
            ->log('Deleted brand');

        $brand->delete();

        if ($logo !== null) {
            $this->deleteLogo($logo);
        }

        return back()->with('success', 'Brand deleted.');
    }

    private function authorizeBrandAccess(): void
    {
        abort_unless(
            request()->user()->hasAnyRole(['super-admin', 'tenant-admin', 'branch-manager']),
            403,
        );
    }

    private function storeLogo(UploadedFile $logo): string
    {
        $path = $logo->store('brands', 'public');

        if ($path === false) {
            throw new RuntimeException('Unable to store the brand logo.');
        }

        return $path;
    }

    private function deleteLogo(string $logo): void
    {
        if (! str_starts_with($logo, 'http')) {
            Storage::disk('public')->delete($logo);
        }
    }
}
