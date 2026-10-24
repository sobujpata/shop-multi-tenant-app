<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\AssignSubscriptionRequest;
use App\Http\Requests\SuperAdmin\SubscriptionActionRequest;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function index(): Response
    {
        $search = request()->string('search')->trim()->toString();

        return Inertia::render('SuperAdmin/Subscriptions/Index', [
            'subscriptions' => Subscription::query()
                ->with(['tenant:id,name,slug,status', 'plan:id,name,price,interval'])
                ->when($search !== '', function ($query) use ($search): void {
                    $query->whereHas('tenant', fn ($tenant) => $tenant->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('plan', fn ($plan) => $plan->where('name', 'like', "%{$search}%"));
                })
                ->latest()
                ->paginate(10)
                ->withQueryString(),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name', 'status']),
            'plans' => Plan::query()->where('is_active', true)->orderBy('price')->get([
                'id',
                'name',
                'price',
                'interval',
            ]),
            'filters' => ['search' => $search],
        ]);
    }

    public function store(AssignSubscriptionRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $subscription = DB::transaction(function () use ($request, $data): Subscription {
            $tenant = Tenant::query()->lockForUpdate()->findOrFail($data['tenant_id']);

            Subscription::query()
                ->where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->lockForUpdate()
                ->get()
                ->each(fn (Subscription $active): bool => $active->update(['status' => 'cancelled']));

            $subscription = $tenant->subscriptions()->create([
                'plan_id' => $data['plan_id'],
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'],
                'status' => 'active',
            ]);
            $tenant->update(['status' => 'active']);

            activity('super-admin')
                ->causedBy($request->user())
                ->performedOn($subscription)
                ->log('Assigned plan to tenant');

            return $subscription;
        });

        return back()->with('success', "Subscription #{$subscription->id} assigned.");
    }

    public function renew(SubscriptionActionRequest $request, Subscription $subscription): RedirectResponse
    {
        DB::transaction(function () use ($request, $subscription): void {
            $subscription = Subscription::query()->lockForUpdate()->findOrFail($subscription->id);
            $baseDate = $subscription->ends_at->isFuture()
                ? $subscription->ends_at->copy()
                : today();
            $plan = Plan::findOrFail($subscription->plan_id);
            $endsAt = $plan->interval === 'yearly'
                ? $baseDate->addYear()
                : $baseDate->addMonth();

            $subscription->update([
                'starts_at' => $subscription->starts_at->isFuture()
                    ? $subscription->starts_at
                    : today(),
                'ends_at' => $endsAt,
                'status' => 'active',
            ]);
            $subscription->tenant()->firstOrFail()->update(['status' => 'active']);

            activity('super-admin')
                ->causedBy($request->user())
                ->performedOn($subscription)
                ->log('Renewed subscription');
        });

        return back()->with('success', 'Subscription renewed.');
    }

    public function cancel(SubscriptionActionRequest $request, Subscription $subscription): RedirectResponse
    {
        DB::transaction(function () use ($request, $subscription): void {
            $subscription = Subscription::query()->lockForUpdate()->findOrFail($subscription->id);
            $subscription->update(['status' => 'cancelled']);

            $tenant = $subscription->tenant()->lockForUpdate()->firstOrFail();
            $hasActiveSubscription = $tenant->subscriptions()
                ->where('status', 'active')
                ->whereDate('ends_at', '>=', today())
                ->exists();

            if (! $hasActiveSubscription) {
                $tenant->update(['status' => 'suspended']);
            }

            activity('super-admin')
                ->causedBy($request->user())
                ->performedOn($subscription)
                ->log('Cancelled subscription');
        });

        return back()->with('success', 'Subscription cancelled.');
    }
}
