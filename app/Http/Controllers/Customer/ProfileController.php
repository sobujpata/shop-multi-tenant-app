<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\UpdateCustomerPasswordRequest;
use App\Http\Requests\Customer\UpdateCustomerProfileRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class ProfileController extends Controller
{
    public function show(): Response
    {
        /** @var Customer $customer */
        $customer = request()->user('customer');
        $customer->load('profile');

        return Inertia::render('Customer/Account/Profile', [
            'profile' => $customer->full_profile,
            'avatarUrl' => $customer->profile->avatar
                ? Storage::disk('public')->url($customer->profile->avatar)
                : null,
        ]);
    }

    public function update(UpdateCustomerProfileRequest $request): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');
        $validated = $request->validated();
        $profileData = collect($validated)->only([
            'gender',
            'date_of_birth',
            'bio',
            'preferred_language',
            'newsletter_opt_in',
        ])->all();
        $profile = $customer->profile()->firstOrCreate();
        $oldAvatar = $profile->avatar;

        if ($request->hasFile('avatar')) {
            $avatar = $request->file('avatar')->storePublicly('customers/avatars', 'public');

            if ($avatar === false) {
                throw new RuntimeException('Unable to store the customer avatar.');
            }

            $profileData['avatar'] = $avatar;
        }

        $emailChanged = $customer->email !== $validated['email'];
        $customer->fill(collect($validated)->only(['name', 'email', 'phone'])->all());

        if ($emailChanged) {
            $customer->email_verified_at = null;
        }

        $customer->save();
        $profile->fill($profileData)->save();

        if ($emailChanged) {
            $customer->sendEmailVerificationNotification();
        }

        if (isset($profileData['avatar']) && $oldAvatar !== null) {
            Storage::disk('public')->delete($oldAvatar);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('customer.account.profile');
    }

    public function updatePassword(UpdateCustomerPasswordRequest $request): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');
        $customer->forceFill([
            'password' => Hash::make($request->validated('password')),
        ])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Password updated.')]);

        return to_route('customer.account.profile');
    }
}
