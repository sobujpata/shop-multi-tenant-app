<?php

namespace App\Http\Controllers\Auth\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\Customer\CustomerLoginRequest;
use App\Services\CartService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedCustomerSessionController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('Customer/Login', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(CustomerLoginRequest $request): RedirectResponse
    {
        $request->session()->put(
            CartService::GUEST_SESSION_KEY,
            $request->session()->getId(),
        );
        $credentials = [
            ...$request->safe()->only(['email', 'password']),
            'status' => 'active',
        ];

        if (! Auth::guard('customer')->attempt($credentials, $request->boolean('remember'))) {
            $request->session()->forget(CartService::GUEST_SESSION_KEY);

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $request->session()->regenerate();
        $request->user('customer')->forceFill([
            'last_login_at' => now(),
        ])->save();

        return redirect()->intended(route('home', absolute: false));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('customer')->logout();

        $request->session()->regenerate();
        $request->session()->regenerateToken();

        return to_route('home');
    }
}
