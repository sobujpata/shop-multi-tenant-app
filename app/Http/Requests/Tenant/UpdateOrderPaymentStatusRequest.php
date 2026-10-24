<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderPaymentStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('subOrder'));
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['pending', 'paid'])],
        ];
    }
}
