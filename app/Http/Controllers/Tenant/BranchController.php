<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreBranchRequest;
use App\Http\Requests\Tenant\UpdateBranchRequest;
use App\Models\Branch;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Branch::class);
        $user = request()->user();
        $search = request()->string('search')->trim()->toString();
        $branches = Branch::query()
            ->where('tenant_id', $user->tenant_id)
            ->when($user->hasRole('branch-manager'), fn ($query) => $query->whereKey($user->branch_id))
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%");
                });
            })
            ->withCount(['stocks'])
            ->with(['deliveryCosts:id,branch_id,area,cost'])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Tenant/Branches/Index', [
            'branches' => $branches,
            'filters' => ['search' => $search],
            'canManage' => $user->hasRole('tenant-admin'),
            'branchLimit' => $user->tenant->activeSubscription?->plan?->max_branches ?? 0,
        ]);
    }

    public function store(StoreBranchRequest $request): RedirectResponse
    {
        $tenant = $request->user()->tenant;

        $branch = DB::transaction(function () use ($request, $tenant): Branch {
            $tenant = Tenant::query()->lockForUpdate()->findOrFail($tenant->id);
            $limit = $tenant->activeSubscription?->plan?->max_branches ?? 0;
            $branchCount = Branch::query()->where('tenant_id', $tenant->id)->lockForUpdate()->count();

            if ($branchCount >= $limit) {
                throw ValidationException::withMessages([
                    'name' => "Your active plan allows up to {$limit} branches.",
                ]);
            }

            $data = $request->validated();
            $deliveryCosts = $data['delivery_costs'];
            unset($data['delivery_costs']);

            $branch = $tenant->branches()->create([
                ...$data,
                'is_active' => $data['is_active'] ?? true,
            ]);
            $branch->deliveryCosts()->createMany($deliveryCosts);

            return $branch;
        });

        activity('tenant')
            ->causedBy($request->user())
            ->performedOn($branch)
            ->log('Created branch');

        return back()->with('success', 'Branch created.');
    }

    public function update(UpdateBranchRequest $request, Branch $branch): RedirectResponse
    {
        $this->authorize('update', $branch);
        DB::transaction(function () use ($branch, $request): void {
            $data = $request->validated();
            $deliveryCosts = $data['delivery_costs'];
            unset($data['delivery_costs']);

            $branch->update($data);
            $branch->deliveryCosts()->delete();
            $branch->deliveryCosts()->createMany($deliveryCosts);
        });

        activity('tenant')->causedBy($request->user())->performedOn($branch)->log('Updated branch');

        return back()->with('success', 'Branch updated.');
    }

    public function destroy(Branch $branch): RedirectResponse
    {
        $this->authorize('delete', $branch);
        if ($branch->subOrders()->exists()) {
            throw ValidationException::withMessages([
                'branch' => 'A branch with order history cannot be deleted.',
            ]);
        }

        DB::transaction(function () use ($branch): void {
            activity('tenant')->causedBy(request()->user())->performedOn($branch)->log('Deleted branch');
            $branch->delete();
        });

        return back()->with('success', 'Branch deleted.');
    }
}
