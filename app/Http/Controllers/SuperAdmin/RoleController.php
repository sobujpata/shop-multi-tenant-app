<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreRoleRequest;
use App\Http\Requests\SuperAdmin\UpdateRoleRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    private const SYSTEM_ROLES = ['super-admin', 'tenant-admin', 'branch-manager'];

    public function index(): Response
    {
        return Inertia::render('SuperAdmin/Roles/Index', [
            'roles' => Role::query()
                ->where('guard_name', 'web')
                ->with('permissions:id,name')
                ->withCount('users')
                ->orderBy('name')
                ->get()
                ->map(fn (Role $role): array => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'permissions' => $role->permissions->pluck('name')->all(),
                    'users_count' => $role->users_count,
                    'is_system' => in_array($role->name, self::SYSTEM_ROLES, true),
                ]),
            'permissions' => Permission::query()
                ->where('guard_name', 'web')
                ->orderBy('name')
                ->pluck('name'),
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request): void {
            $role = Role::create([
                'name' => $data['name'],
                'guard_name' => 'web',
            ]);
            $role->syncPermissions($data['permissions'] ?? []);

            activity('super-admin')
                ->causedBy($request->user())
                ->performedOn($role)
                ->log('Created role');
        });

        return back()->with('success', 'Role created.');
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        abort_unless($role->guard_name === 'web', 404);

        $data = $request->validated();
        $oldName = $role->name;

        DB::transaction(function () use ($data, $request, $role, $oldName): void {
            if (! in_array($oldName, self::SYSTEM_ROLES, true)) {
                $role->name = $data['name'];
                $role->save();
            }

            if (array_key_exists('permissions', $data)) {
                $role->syncPermissions($data['permissions']);
            }

            activity('super-admin')
                ->causedBy($request->user())
                ->performedOn($role)
                ->log('Updated role');
        });

        return back()->with('success', 'Role updated.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        abort_unless($role->guard_name === 'web', 404);
        abort_if(in_array($role->name, self::SYSTEM_ROLES, true), 403);

        if ($role->users()->exists()) {
            return back()->withErrors([
                'role' => 'This role is assigned to staff. Reassign those users before deleting it.',
            ]);
        }

        activity('super-admin')
            ->causedBy(request()->user())
            ->performedOn($role)
            ->log('Deleted role');

        $role->delete();

        return back()->with('success', 'Role deleted.');
    }
}
