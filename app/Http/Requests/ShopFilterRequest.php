<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ShopFilterRequest extends FormRequest
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
            'category' => ['nullable', 'string', 'max:180'],
            'brand' => ['sometimes', 'array'],
            'brand.*' => ['string', 'max:180'],
            'gender' => ['nullable', 'in:men,women,kids,unisex'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'color' => ['sometimes', 'array'],
            'color.*' => ['string', 'max:100'],
            'size' => ['sometimes', 'array'],
            'size.*' => ['string', 'max:100'],
            'search' => ['nullable', 'string', 'max:180'],
            'sort' => ['nullable', 'in:newest,price_asc,price_desc,rating'],
        ];
    }
}
