<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $this->authorizeCategoryAccess();
        $canViewProducts = request()->user()->can('category.products');
        $search = request()->string('search')->trim()->toString();
        $categoryQuery = Category::query()
            ->with('parent:id,name');

        if ($canViewProducts) {
            $categoryQuery->withCount([
                'products' => fn ($query) => $query->withoutGlobalScopes(),
            ]);
        }

        $categories = $categoryQuery
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'parent_id' => $category->parent_id,
                'parent' => $category->parent,
                ...($canViewProducts ? ['products_count' => $category->products_count] : []),
                'image_url' => $category->image === null
                    ? null
                    : (str_starts_with($category->image, 'http')
                        ? $category->image
                        : Storage::disk('public')->url($category->image)),
            ]);

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
            'categoryOptions' => Category::query()->orderBy('name')->get(['id', 'name', 'parent_id']),
            'filters' => ['search' => $search],
            'baseUrl' => request()->routeIs('super-admin.categories.*')
                ? '/super-admin/categories'
                : '/tenant/categories',
            'canCreateCategory' => request()->user()->can('category.create'),
            'canEditCategory' => request()->user()->can('category.edit'),
            'canDeleteCategory' => request()->user()->can('category.delete'),
            'canViewCategoryProducts' => $canViewProducts,
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $this->storeImage($request->file('image'));
        }

        $category = Category::query()->create($data);

        activity($request->user()->hasRole('super-admin') ? 'admin' : 'tenant')
            ->causedBy($request->user())
            ->performedOn($category)
            ->log('Created category');

        return back()->with('success', 'Category created.');
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $data = $request->validated();
        $previousImage = $category->image;

        if ($request->hasFile('image')) {
            $data['image'] = $this->storeImage($request->file('image'));
        } else {
            unset($data['image']);
        }

        $category->update($data);

        if (isset($data['image']) && $previousImage !== null) {
            $this->deleteImage($previousImage);
        }

        activity($request->user()->hasRole('super-admin') ? 'admin' : 'tenant')
            ->causedBy($request->user())
            ->performedOn($category)
            ->log('Updated category');

        return back()->with('success', 'Category updated.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        abort_unless(request()->user()->can('category.delete'), 403);

        if ($category->products()->withoutGlobalScopes()->exists()) {
            throw ValidationException::withMessages([
                'category' => 'A category with products cannot be deleted.',
            ]);
        }

        if ($category->children()->exists()) {
            throw ValidationException::withMessages([
                'category' => 'Move or delete child categories before deleting this category.',
            ]);
        }

        $image = $category->image;

        activity(request()->user()->hasRole('super-admin') ? 'admin' : 'tenant')
            ->causedBy(request()->user())
            ->performedOn($category)
            ->log('Deleted category');

        $category->delete();

        if ($image !== null) {
            $this->deleteImage($image);
        }

        return back()->with('success', 'Category deleted.');
    }

    private function authorizeCategoryAccess(): void
    {
        abort_unless(
            request()->user()->hasAnyRole(['super-admin', 'tenant-admin', 'branch-manager']),
            403,
        );
    }

    private function storeImage(UploadedFile $image): string
    {
        $path = $image->store('categories', 'public');

        if ($path === false) {
            throw new RuntimeException('Unable to store the category image.');
        }

        return $path;
    }

    private function deleteImage(string $image): void
    {
        if (! str_starts_with($image, 'http')) {
            Storage::disk('public')->delete($image);
        }
    }
}
