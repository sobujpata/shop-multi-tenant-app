<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->tenant_id !== null;
    }

    public function rules(): array
    {
        return [
            'stocks' => ['required', 'array', 'min:1'],
            'stocks.*.branch_id' => ['required', 'integer', 'exists:branches,id'],
            'stocks.*.variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'stocks.*.quantity' => ['required', 'integer', 'min:0'],
        ];
    }
}
