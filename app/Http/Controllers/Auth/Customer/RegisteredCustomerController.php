<?php

namespace App\Http\Controllers\Auth\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\Customer\CustomerRegistrationRequest;
use App\Models\Customer;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredCustomerController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Customer/Register');
    }

    public function store(CustomerRegistrationRequest $request): RedirectResponse
    {
        $customer = Customer::create($request->validated());

        event(new Registered($customer));

        Auth::guard('customer')->login($customer);
        $request->session()->regenerate();

        return to_route('customer.verification.notice');
    }
}
