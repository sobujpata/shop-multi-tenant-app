<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreTenantRequest;
use App\Http\Requests\SuperAdmin\UpdateTenantRequest;
use App\Http\Requests\SuperAdmin\UpdateTenantStatusRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class TenantController extends Controller
{
    public function index(): Response
    {
        $search = request()->string('search')->trim()->toString();

        $tenants = Tenant::query()
            ->with(['activeSubscription.plan', 'users:id,tenant_id,name,email'])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('SuperAdmin/Tenants/Index', [
            'tenants' => $tenants,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(StoreTenantRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $tenant = DB::transaction(function () use ($data, $request): Tenant {
            $tenant = Tenant::create([
                'name' => $data['name'],
                'slug' => $data['slug'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'status' => 'pending',
            ]);

            $admin = User::create([
                'name' => $data['admin_name'],
                'email' => $data['admin_email'],
                'password' => $data['admin_password'],
                'tenant_id' => $tenant->id,
            ]);
            $admin->assignRole(Role::findByName('tenant-admin', 'web'));

            activity('super-admin')
                ->causedBy($request->user())
                ->performedOn($tenant)
                ->withProperties(['tenant_admin_id' => $admin->id])
                ->log('Created tenant and tenant-admin user');

            return $tenant;
        });

        return to_route('super-admin.tenants.index')
            ->with('success', "Tenant {$tenant->name} created.");
    }

    public function update(UpdateTenantRequest $request, Tenant $tenant): RedirectResponse
    {
        $tenant->update($request->validated());

        activity('super-admin')
            ->causedBy($request->user())
            ->performedOn($tenant)
            ->log('Updated tenant details');

        return back()->with('success', 'Tenant details updated.');
    }

    public function updateStatus(UpdateTenantStatusRequest $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validated();
        $tenant->update(['status' => $validated['status']]);

        activity('super-admin')
            ->causedBy($request->user())
            ->performedOn($tenant)
            ->log($validated['status'] === 'suspended' ? 'Suspended tenant' : 'Activated tenant');

        return back()->with(
            'success',
            $validated['status'] === 'suspended' ? 'Tenant suspended.' : 'Tenant activated.',
        );
    }

    public function destroy(Tenant $tenant): RedirectResponse
    {
        $tenantName = $tenant->name;

        DB::transaction(function () use ($tenant): void {
            activity('super-admin')
                ->causedBy(auth()->user())
                ->performedOn($tenant)
                ->log('Deleted tenant and associated records');

            User::query()->where('tenant_id', $tenant->id)->delete();
            $tenant->delete();
        });

        return back()->with('success', "Tenant {$tenantName} deleted.");
    }
}
