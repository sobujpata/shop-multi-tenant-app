<?php

namespace App\Http\Requests\Tenant;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('product'));
    }

    public function rules(): array
    {
        /** @var Product $product */
        $product = $this->route('product');

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('products', 'slug')->ignore($product->id),
            ],
            'description' => ['required', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'gender' => ['nullable', Rule::in(['men', 'women', 'kids', 'unisex'])],
            'base_price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'sale_price' => ['nullable', 'numeric', 'min:0', 'lte:base_price'],
            'is_active' => ['required', 'boolean'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.id' => [
                'nullable',
                Rule::exists('product_variants', 'id')->where('product_id', $product->id),
            ],
            'variants.*.sku' => [
                'required',
                'string',
                'max:255',
                'distinct',
            ],
            'variants.*.size' => ['nullable', 'string', 'max:100'],
            'variants.*.color' => ['nullable', 'string', 'max:100'],
            'variants.*.price' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'images' => ['sometimes', 'array', 'max:10'],
            'images.*' => ['image', 'max:5120'],
            'attributes' => ['sometimes', 'array'],
            'attributes.*.attribute_id' => ['required', 'exists:attributes,id', 'distinct'],
            'attributes.*.value' => ['required', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            foreach ($this->input('variants', []) as $index => $variant) {
                $existing = DB::table('product_variants')
                    ->where('sku', $variant['sku'] ?? '')
                    ->when(
                        ! empty($variant['id']),
                        fn ($query) => $query->where('id', '!=', $variant['id']),
                    )
                    ->exists();

                if ($existing) {
                    $validator->errors()->add(
                        "variants.{$index}.sku",
                        'This SKU has already been taken.',
                    );
                }
            }
        });
    }
}
