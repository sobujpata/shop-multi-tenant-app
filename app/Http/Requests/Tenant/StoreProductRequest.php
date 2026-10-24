<?php

namespace App\Http\Requests\Tenant;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Product::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash', 'unique:products,slug'],
            'description' => ['required', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'gender' => ['nullable', Rule::in(['men', 'women', 'kids', 'unisex'])],
            'base_price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'sale_price' => ['nullable', 'numeric', 'min:0', 'lte:base_price'],
            'is_active' => ['required', 'boolean'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.id' => ['prohibited'],
            'variants.*.sku' => ['required', 'string', 'max:255', 'distinct', 'unique:product_variants,sku'],
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
}
