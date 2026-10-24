<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StorePlanRequest;
use App\Http\Requests\SuperAdmin\UpdatePlanRequest;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    public function index(): Response
    {
        $search = request()->string('search')->trim()->toString();

        return Inertia::render('SuperAdmin/Plans/Index', [
            'plans' => Plan::query()
                ->withCount('subscriptions')
                ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
                ->orderBy('price')
                ->paginate(10)
                ->withQueryString(),
            'filters' => ['search' => $search],
        ]);
    }

    public function store(StorePlanRequest $request): RedirectResponse
    {
        $plan = Plan::create($request->validated());

        activity('super-admin')
            ->causedBy($request->user())
            ->performedOn($plan)
            ->log('Created plan');

        return back()->with('success', 'Plan created.');
    }

    public function update(UpdatePlanRequest $request, Plan $plan): RedirectResponse
    {
        $plan->update($request->validated());

        activity('super-admin')
            ->causedBy($request->user())
            ->performedOn($plan)
            ->log('Updated plan');

        return back()->with('success', 'Plan updated.');
    }

    public function destroy(Plan $plan): RedirectResponse
    {
        if ($plan->subscriptions()->exists()) {
            throw ValidationException::withMessages([
                'plan' => 'A plan with subscriptions cannot be deleted.',
            ]);
        }

        $plan->delete();

        activity('super-admin')
            ->causedBy(request()->user())
            ->performedOn($plan)
            ->log('Deleted plan');

        return back()->with('success', 'Plan deleted.');
    }
}
