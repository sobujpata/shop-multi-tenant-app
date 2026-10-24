<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('SuperAdmin/Dashboard', $this->dashboardData());
    }

    public function starterKit(Request $request): Response
    {
        $data = $request->user()->hasRole('super-admin')
            ? $this->dashboardData()
            : [];

        return Inertia::render('dashboard', $data);
    }

    /**
     * @return array{
     *     metrics: array{
     *         tenants: int,
     *         activeSubscriptions: int,
     *         todaysOrders: int,
     *         revenue: float|int
     *     },
     *     recentActivity: Collection<int, Activity>
     * }
     */
    private function dashboardData(): array
    {
        return [
            'metrics' => [
                'tenants' => Tenant::count(),
                'activeSubscriptions' => Subscription::query()
                    ->where('status', 'active')
                    ->whereDate('ends_at', '>=', today())
                    ->count(),
                'todaysOrders' => Order::query()
                    ->whereDate('created_at', today())
                    ->count(),
                'revenue' => Order::query()
                    ->where('payment_status', 'paid')
                    ->sum('total'),
            ],
            'recentActivity' => Activity::query()
                ->with('causer')
                ->latest()
                ->limit(8)
                ->get(),
        ];
    }
}
