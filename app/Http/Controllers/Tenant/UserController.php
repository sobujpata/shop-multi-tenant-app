<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreTenantUserRequest;
use App\Http\Requests\Tenant\UpdateTenantUserRequest;
use App\Models\Branch;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(): Response
    {
        $actor = request()->user();
        $isSuperAdmin = $actor->hasRole('super-admin');
        $tenantId = $actor->tenant_id;
        $search = request()->string('search')->trim()->toString();
        $users = User::query()
            ->when(! $isSuperAdmin, fn ($query) => $query->where('tenant_id', $tenantId))
            ->with(['branch:id,name', 'roles:id,name', 'permissions:id,name', 'tenant:id,name'])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        $users->through(fn (User $user): array => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'roles' => $user->getRoleNames()->all(),
            'branch' => $user->branch,
            'tenant' => $user->tenant ? [
                'id' => $user->tenant->id,
                'name' => $user->tenant->name,
            ] : null,
            'permissions' => $user->getDirectPermissions()->pluck('name')->all(),
        ]);

        return Inertia::render('Tenant/Users/Index', [
            'users' => $users,
            'branches' => Branch::query()
                ->when(! $isSuperAdmin, fn ($query) => $query->where('tenant_id', $tenantId))
                ->orderBy('name')
                ->get(['id', 'tenant_id', 'name']),
            'tenants' => $isSuperAdmin
                ? Tenant::query()->orderBy('name')->get(['id', 'name'])
                : [],
            'roles' => Role::query()
                ->where('guard_name', 'web')
                ->when(! $isSuperAdmin, fn ($query) => $query->whereIn('name', [
                    'tenant-admin',
                    'branch-manager',
                    'sales-man',
                ]))
                ->orderBy('name')
                ->pluck('name'),
            'permissions' => $isSuperAdmin
                ? Permission::query()->where('guard_name', 'web')->orderBy('name')->pluck('name')
                : [],
            'isSuperAdmin' => $isSuperAdmin,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(StoreTenantUserRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request): void {
            $user = User::create([
                'tenant_id' => $request->user()->hasRole('super-admin')
                    ? ($data['tenant_id'] ?? null)
                    : $request->user()->tenant_id,
                'branch_id' => in_array($data['role'], ['branch-manager', 'sales-man'], true)
                    ? $data['branch_id']
                    : null,
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $data['password'],
            ]);
            $user->syncRoles([Role::findByName($data['role'], 'web')]);
            $user->syncPermissions($data['permissions'] ?? []);

            activity($request->user()->hasRole('super-admin') ? 'super-admin' : 'tenant')
                ->causedBy($request->user())
                ->performedOn($user)
                ->log('Created staff user');
        });

        return back()->with('success', 'Staff user created.');
    }

    public function update(UpdateTenantUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request, $user): void {
            $actorIsSuperAdmin = $request->user()->hasRole('super-admin');
            $attributes = [
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
            ];

            if (! empty($data['password'])) {
                $attributes['password'] = $data['password'];
            }

            if (isset($data['role'])) {
                $attributes['tenant_id'] = $actorIsSuperAdmin
                    ? ($data['tenant_id'] ?? null)
                    : $request->user()->tenant_id;
                $attributes['branch_id'] = in_array($data['role'], ['branch-manager', 'sales-man'], true)
                    ? $data['branch_id']
                    : null;
                $user->syncRoles([Role::findByName($data['role'], 'web')]);
            }

            $user->update($attributes);

            if (array_key_exists('permissions', $data)) {
                $user->syncPermissions($data['permissions']);
            }

            activity($actorIsSuperAdmin ? 'super-admin' : 'tenant')
                ->causedBy($request->user())
                ->performedOn($user)
                ->log('Updated staff user');
        });

        return back()->with('success', 'Staff user updated.');
    }
}
