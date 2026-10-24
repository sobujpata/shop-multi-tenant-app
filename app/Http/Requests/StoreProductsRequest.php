<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'price_range' => ['nullable', 'in:under_1000,1000_5000,5000_20000,20000_50000,over_50000'],
            'rating' => ['nullable', 'in:1.5,2,3'],
            'discounted' => ['nullable', 'boolean'],
            'sort' => ['nullable', 'in:relevance,newest,price_asc,price_desc,rating'],
        ];
    }
}
