<?php

namespace App\Http\Controllers\Auth\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\Customer\CustomerForgotPasswordRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class CustomerPasswordResetLinkController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Customer/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    public function store(CustomerForgotPasswordRequest $request): RedirectResponse
    {
        $status = Password::broker('customers')->sendResetLink(
            $request->validated(),
        );

        return $status === Password::RESET_LINK_SENT
            ? back()->with('status', __($status))
            : back()->withErrors(['email' => __($status)]);
    }
}
