<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Seller\CompleteOnboardingRequest;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class SellerOnboardingController extends Controller
{
    public function create(): Response|RedirectResponse
    {
        $user = request()->user();
        abort_unless($user instanceof User, 403);

        if ($user->tenant_id !== null) {
            return to_route('dashboard');
        }

        abort_if($user->hasRole('super-admin'), 403);

        return Inertia::render('Seller/Onboarding', [
            'account' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    public function store(CompleteOnboardingRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $userId = $request->user()->id;

        $tenant = DB::transaction(function () use ($data, $userId): Tenant {
            $user = User::query()->lockForUpdate()->findOrFail($userId);

            if ($user->tenant_id !== null) {
                throw ValidationException::withMessages([
                    'tenant_name' => 'Your seller account has already been set up.',
                ]);
            }

            $baseSlug = Str::slug($data['tenant_name']);
            $slug = $baseSlug;
            $suffix = 2;
            while (Tenant::query()->where('slug', $slug)->exists()) {
                $slug = Str::limit($baseSlug, 245, '').'-'.$suffix++;
            }

            $tenant = Tenant::create([
                'name' => $data['tenant_name'],
                'slug' => $slug,
                'email' => $data['email'],
                'phone' => $data['phone'],
                'status' => 'active',
            ]);

            $freePlan = Plan::query()->firstOrCreate(
                ['name' => 'Free'],
                [
                    'price' => 0,
                    'interval' => 'monthly',
                    'max_branches' => 1,
                    'max_products' => 10,
                    'is_active' => true,
                ],
            );

            $startsAt = today();
            $tenant->subscriptions()->create([
                'plan_id' => $freePlan->id,
                'starts_at' => $startsAt,
                'ends_at' => $startsAt->addMonthNoOverflow(),
                'status' => 'active',
            ]);

            $branch = $tenant->branches()->create([
                'name' => $data['branch_name'],
                'address' => $data['address'],
                'city' => $data['city'],
                'phone' => $data['phone'],
                'is_active' => true,
            ]);
            $branch->deliveryCosts()->create([
                'area' => $data['delivery_area'],
                'cost' => $data['delivery_cost'],
            ]);

            $user->update(['tenant_id' => $tenant->id]);
            $user->assignRole(Role::findByName('tenant-admin', 'web'));

            activity('seller-onboarding')
                ->causedBy($user)
                ->performedOn($tenant)
                ->withProperties([
                    'subscription_plan' => $freePlan->name,
                    'free_trial_ends_at' => $startsAt->addMonthNoOverflow()->toDateString(),
                ])
                ->log('Completed seller onboarding');

            return $tenant;
        });

        return to_route('tenant.dashboard')
            ->with('success', "Your {$tenant->name} seller panel is ready.");
    }
}
