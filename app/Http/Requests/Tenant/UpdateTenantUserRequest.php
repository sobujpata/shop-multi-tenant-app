<?php

namespace App\Http\Requests\Tenant;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class UpdateTenantUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('user');

        return $target instanceof User
            && ($this->user()->hasRole('super-admin')
                || ($this->user()->hasRole('tenant-admin')
                    && $target->tenant_id === $this->user()->tenant_id));
    }

    public function rules(): array
    {
        /** @var User $target */
        $target = $this->route('user');
        $isSuperAdmin = $this->user()->hasRole('super-admin');
        $isSelf = $target->is($this->user());
        $roleNames = $isSuperAdmin
            ? Role::query()->where('guard_name', 'web')->pluck('name')->all()
            : ['tenant-admin', 'branch-manager', 'sales-man'];

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($target->id),
            ],
            'phone' => ['nullable', 'string', 'max:32'],
            'password' => ['nullable', 'string', Password::defaults(), 'confirmed'],
            'role' => $isSelf
                ? ['prohibited']
                : ['required', Rule::in($roleNames)],
            'tenant_id' => ! $isSuperAdmin || $isSelf
                ? ['prohibited']
                : [
                    'nullable',
                    'required_if:role,tenant-admin,branch-manager,sales-man',
                    Rule::exists('tenants', 'id'),
                ],
            'branch_id' => $isSelf
                ? ['prohibited']
                : [
                    'nullable',
                    'required_if:role,branch-manager,sales-man',
                    Rule::exists('branches', 'id')->where(
                        'tenant_id',
                        $isSuperAdmin ? $this->input('tenant_id') : $this->user()->tenant_id,
                    ),
                ],
            'permissions' => $isSuperAdmin && ! $isSelf
                ? ['sometimes', 'array']
                : ['prohibited'],
            'permissions.*' => $isSuperAdmin && ! $isSelf
                ? [Rule::exists('permissions', 'name')->where('guard_name', 'web')]
                : ['prohibited'],
        ];
    }
}
