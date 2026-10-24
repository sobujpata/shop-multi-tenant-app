<?php

namespace App\Http\Controllers\Auth\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\Customer\CustomerResetPasswordRequest;
use App\Models\Customer;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class NewCustomerPasswordController extends Controller
{
    public function create(string $token): Response
    {
        return Inertia::render('Customer/ResetPassword', [
            'email' => request()->query('email'),
            'token' => $token,
        ]);
    }

    public function store(CustomerResetPasswordRequest $request): RedirectResponse
    {
        $status = Password::broker('customers')->reset(
            $request->validated(),
            function (Customer $customer, string $password): void {
                $customer->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($customer));
            },
        );

        return $status === Password::PASSWORD_RESET
            ? to_route('customer.login')->with('status', __($status))
            : back()->withInput($request->safe()->only('email'))
                ->withErrors(['email' => __($status)]);
    }
}
