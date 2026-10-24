<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('subOrder'));
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    'pending',
                    'confirmed',
                    'packed',
                    'shipped',
                    'delivered',
                    'cancelled',
                    'returned',
                ]),
            ],
            'note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
