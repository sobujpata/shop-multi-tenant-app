<?php

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class ActivityLogFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'subject_type' => [
                'nullable',
                'string',
                'in:'.implode(',', [
                    'App\\Models\\Tenant',
                    'App\\Models\\Plan',
                    'App\\Models\\Subscription',
                    'App\\Models\\Product',
                    'App\\Models\\Order',
                ]),
            ],
            'from' => ['nullable', 'date'],
            'to' => [
                'nullable',
                'date',
                ...($this->filled('from') ? ['after_or_equal:from'] : []),
            ],
            'search' => ['nullable', 'string', 'max:255'],
            'detail' => ['nullable', 'integer', 'exists:activity_log,id'],
        ];
    }
}
