<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Category;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('category.edit') ?? false;
    }

    public function rules(): array
    {
        /** @var Category $category */
        $category = $this->route('category');

        return [
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id'),
                function (string $attribute, mixed $value, Closure $fail) use ($category): void {
                    $parent = Category::query()->find($value);

                    while ($parent !== null) {
                        if ($parent->is($category)) {
                            $fail('A category cannot be nested under itself or one of its descendants.');

                            return;
                        }

                        $parent = $parent->parent;
                    }
                },
            ],
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('categories', 'slug')->ignore($category->id),
            ],
            'image' => ['nullable', 'image', 'max:5120'],
        ];
    }
}
