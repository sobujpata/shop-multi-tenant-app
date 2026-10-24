<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TenantProfileRequest extends FormRequest
{
    /**
     * Only the tenant owner may update the tenant record.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User
            && $user->hasRole('tenant-admin')
            && $user->tenant_id !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('tenants', 'email')->ignore(
                    $user instanceof User ? $user->tenant_id : null,
                ),
            ],
            'phone' => ['nullable', 'string', 'max:32'],
            'logo' => ['nullable', 'image', 'max:2048'],
        ];
    }
}
