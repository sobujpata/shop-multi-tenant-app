<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Http\Requests\Settings\TenantProfileRequest;
use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $tenant = null;

        if ($user instanceof User && $user->hasRole('tenant-admin')) {
            $tenant = $user->tenant()->first(['id', 'name', 'email', 'phone', 'logo']);
        }

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'tenant' => $tenant,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if (array_key_exists('phone', $data) && strval($data['phone']) === '') {
            $data['phone'] = null;
        }

        $request->user()->fill($data);

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Update the tenant record for the logged in tenant owner.
     */
    public function updateTenant(TenantProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        $tenant = $user instanceof User ? $user->tenant : null;

        if ($tenant === null) {
            abort(403);
        }

        $data = $request->validated();
        $logo = $data['logo'] ?? null;

        if ($logo instanceof UploadedFile) {
            if (filled($tenant->logo)) {
                Storage::disk('public')->delete(strval($tenant->logo));
            }

            $data['logo'] = $logo->store('tenants/'.$tenant->id, 'public');
        } else {
            unset($data['logo']);
        }

        $tenant->fill($data);
        $tenant->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Store information updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
