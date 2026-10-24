<?php

namespace App\Http\Requests\Tenant;

use App\Models\Branch;
use Illuminate\Foundation\Http\FormRequest;

class StoreBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Branch::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:32'],
            'is_active' => ['sometimes', 'boolean'],
            'delivery_costs' => ['required', 'array', 'min:1'],
            'delivery_costs.*.area' => ['required', 'string', 'max:100', 'distinct:ignore_case'],
            'delivery_costs.*.cost' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
        ];
    }
}
