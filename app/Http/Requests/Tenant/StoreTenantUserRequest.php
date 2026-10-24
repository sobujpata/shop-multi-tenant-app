<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class StoreTenantUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['tenant-admin', 'super-admin']);
    }

    public function rules(): array
    {
        $isSuperAdmin = $this->user()->hasRole('super-admin');
        $roleNames = $isSuperAdmin
            ? Role::query()->where('guard_name', 'web')->pluck('name')->all()
            : ['tenant-admin', 'branch-manager', 'sales-man'];

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:32'],
            'password' => ['required', 'string', Password::defaults(), 'confirmed'],
            'role' => ['required', Rule::in($roleNames)],
            'tenant_id' => $isSuperAdmin
                ? [
                    'nullable',
                    'required_if:role,tenant-admin,branch-manager,sales-man',
                    Rule::exists('tenants', 'id'),
                ]
                : ['prohibited'],
            'branch_id' => [
                'nullable',
                'required_if:role,branch-manager,sales-man',
                Rule::exists('branches', 'id')->where(
                    'tenant_id',
                    $isSuperAdmin ? $this->input('tenant_id') : $this->user()->tenant_id,
                ),
            ],
            'permissions' => $isSuperAdmin ? ['sometimes', 'array'] : ['prohibited'],
            'permissions.*' => $isSuperAdmin
                ? [Rule::exists('permissions', 'name')->where('guard_name', 'web')]
                : ['prohibited'],
        ];
    }
}
