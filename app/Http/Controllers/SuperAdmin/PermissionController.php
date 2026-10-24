<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StorePermissionRequest;
use App\Http\Requests\SuperAdmin\UpdatePermissionRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('SuperAdmin/Permissions/Index', [
            'permissions' => Permission::query()
                ->where('guard_name', 'web')
                ->withCount('roles')
                ->orderBy('name')
                ->get()
                ->map(fn (Permission $permission): array => [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'roles_count' => $permission->roles_count,
                ]),
        ]);
    }

    public function store(StorePermissionRequest $request): RedirectResponse
    {
        $permission = Permission::create([
            'name' => $request->validated('name'),
            'guard_name' => 'web',
        ]);

        activity('super-admin')
            ->causedBy($request->user())
            ->performedOn($permission)
            ->log('Created permission');

        return back()->with('success', 'Permission created.');
    }

    public function update(UpdatePermissionRequest $request, Permission $permission): RedirectResponse
    {
        abort_unless($permission->guard_name === 'web', 404);

        DB::transaction(function () use ($request, $permission): void {
            $permission->update(['name' => $request->validated('name')]);

            activity('super-admin')
                ->causedBy($request->user())
                ->performedOn($permission)
                ->log('Updated permission');
        });

        return back()->with('success', 'Permission updated.');
    }

    public function destroy(Permission $permission): RedirectResponse
    {
        abort_unless($permission->guard_name === 'web', 404);

        DB::transaction(function () use ($permission): void {
            activity('super-admin')
                ->causedBy(request()->user())
                ->performedOn($permission)
                ->log('Deleted permission');

            $permission->delete();
        });

        return back()->with('success', 'Permission deleted.');
    }
}
