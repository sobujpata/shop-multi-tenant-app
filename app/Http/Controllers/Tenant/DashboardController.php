<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\BranchStock;
use App\Models\SubOrder;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        return Inertia::render('Tenant/Dashboard', $this->dashboardData($request, $user));
    }

    public function starterKit(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        return Inertia::render('dashboard', [
            'tenantDashboard' => $this->dashboardData($request, $user),
        ]);
    }

    /**
     * @return array{
     *     metrics: array{sales: float, orders: int, branches: int, products: int},
     *     salesChart: Collection<int, array{date: string, sales: float, orders: int}>,
     *     lowStock: \Illuminate\Database\Eloquent\Collection<int, BranchStock>,
     *     branches: \Illuminate\Database\Eloquent\Collection<int, \App\Models\Branch>,
     *     canFilterBranches: bool,
     *     filters: array{order_type: string, date_preset: string, date_from: string, date_to: string, branch_id: string}
     * }
     */
    private function dashboardData(Request $request, User $user): array
    {
        $validated = $request->validate([
            'order_type' => ['nullable', 'in:all,pos,online'],
            'date_preset' => ['nullable', 'in:last_7_days,today,custom'],
            'branch_id' => ['nullable', 'integer', 'min:1'],
            'date_from' => ['required_if:date_preset,custom', 'nullable', 'date_format:Y-m-d'],
            'date_to' => ['required_if:date_preset,custom', 'nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);

        $tenantId = $user->tenant_id;
        $isBranchScoped = $user->hasAnyRole(['branch-manager', 'sales-man']);
        $branches = $user->tenant->branches()->orderBy('name')->get(['id', 'name']);
        $requestedBranchId = $request->integer('branch_id');

        if ($isBranchScoped) {
            $branchId = $user->branch_id;
        } elseif ($requestedBranchId > 0) {
            abort_unless($branches->contains('id', $requestedBranchId), 404);
            $branchId = $requestedBranchId;
        } else {
            $branchId = null;
        }

        $datePreset = (string) ($validated['date_preset'] ?? 'last_7_days');
        $start = match ($datePreset) {
            'today' => today(),
            'custom' => Carbon::parse($validated['date_from']),
            default => today()->subDays(6),
        };
        $end = match ($datePreset) {
            'today' => today(),
            'custom' => Carbon::parse($validated['date_to']),
            default => today(),
        };
        $orderType = (string) ($validated['order_type'] ?? 'all');
        $orders = SubOrder::query()
            ->where('tenant_id', $tenantId)
            ->when($branchId !== null, fn (Builder $query) => $query->where('branch_id', $branchId))
            ->whereHas('order', function (Builder $query) use ($start, $end, $orderType): void {
                $query->whereBetween('created_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
                    ->when($orderType === 'pos', fn (Builder $orderQuery) => $orderQuery->where('order_no', 'like', 'POS-%'))
                    ->when($orderType === 'online', fn (Builder $orderQuery) => $orderQuery->where('order_no', 'not like', 'POS-%'));
            });

        $dailySales = $orders
            ->with('order:id,created_at')
            ->get(['id', 'order_id', 'branch_id', 'total'])
            ->groupBy(fn (SubOrder $subOrder): string => $subOrder->order->created_at->toDateString())
            ->map(fn ($dayOrders, string $date): array => [
                'date' => $date,
                'sales' => round($dayOrders->sum('total'), 2),
                'orders' => $dayOrders->count(),
            ]);

        $sales = collect();
        for ($date = $start->copy(); $date->lte($end); $date = $date->addDay()) {
            $dateString = $date->toDateString();
            $sales->push($dailySales->get($dateString, [
                'date' => $dateString,
                'sales' => 0,
                'orders' => 0,
            ]));
        }

        $lowStockQuery = BranchStock::query()
            ->with(['branch:id,name', 'variant:id,product_id,sku,size,color', 'variant.product:id,name'])
            ->whereHas('branch', fn ($query) => $query->where('tenant_id', $tenantId))
            ->where('quantity', '<=', 5)
            ->orderBy('quantity');

        if ($branchId !== null) {
            $lowStockQuery->where('branch_id', $branchId);
        }

        return [
            'metrics' => [
                'sales' => (float) $orders->sum('total'),
                'orders' => (clone $orders)->count(),
                'branches' => $branchId !== null
                    ? 1
                    : $branches->count(),
                'products' => $branchId !== null
                    ? $user->tenant->products()->whereHas(
                        'branchStocks',
                        fn ($query) => $query->where('branch_id', $branchId),
                    )->distinct()->count()
                    : $user->tenant->products()->count(),
            ],
            'salesChart' => $sales->values(),
            'lowStock' => $lowStockQuery->limit(10)->get(),
            'branches' => $branches,
            'canFilterBranches' => $user->hasRole('tenant-admin'),
            'filters' => [
                'order_type' => $orderType,
                'date_preset' => $datePreset,
                'date_from' => (string) ($validated['date_from'] ?? ''),
                'date_to' => (string) ($validated['date_to'] ?? ''),
                'branch_id' => $branchId === null ? '' : (string) $branchId,
            ],
        ];
    }
}
