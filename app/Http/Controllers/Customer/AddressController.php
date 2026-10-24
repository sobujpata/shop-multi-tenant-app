<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreCustomerAddressRequest;
use App\Http\Requests\Customer\UpdateCustomerAddressRequest;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Services\DivisionToUnionOptions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AddressController extends Controller
{
    public function index(DivisionToUnionOptions $locationOptions): Response
    {
        /** @var Customer $customer */
        $customer = request()->user('customer');

        return Inertia::render('Customer/Account/Addresses', [
            'addresses' => $customer->addresses()->orderByDesc('is_default')->orderBy('id')->get(),
            'locations' => $locationOptions->all(),
        ]);
    }

    public function store(StoreCustomerAddressRequest $request): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');
        $attributes = $request->validated();
        $makeDefault = (bool) ($attributes['is_default'] ?? false);

        DB::transaction(function () use ($customer, $attributes, $makeDefault): void {
            $this->lockCustomer($customer);

            if ($makeDefault) {
                $customer->addresses()->update(['is_default' => false]);
            }

            $customer->addresses()->create($attributes);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Address added.')]);

        return to_route('customer.account.addresses');
    }

    public function update(
        UpdateCustomerAddressRequest $request,
        CustomerAddress $address,
    ): RedirectResponse {
        /** @var Customer $customer */
        $customer = $request->user('customer');
        $attributes = $request->validated();

        DB::transaction(function () use ($customer, $address, $attributes): void {
            $this->lockCustomer($customer);
            $ownedAddress = $customer->addresses()->whereKey($address->getKey())->firstOrFail();

            if (filter_var($attributes['is_default'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                $customer->addresses()->where('id', '!=', $ownedAddress->getKey())
                    ->update(['is_default' => false]);
            }

            $ownedAddress->fill($attributes)->save();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Address updated.')]);

        return to_route('customer.account.addresses');
    }

    public function setDefault(Request $request, CustomerAddress $address): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');

        DB::transaction(function () use ($customer, $address): void {
            $this->lockCustomer($customer);
            $ownedAddress = $customer->addresses()->whereKey($address->getKey())->firstOrFail();

            $customer->addresses()->update(['is_default' => false]);
            $ownedAddress->update(['is_default' => true]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Default address updated.')]);

        return to_route('customer.account.addresses');
    }

    public function destroy(CustomerAddress $address): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = request()->user('customer');

        $customer->addresses()->whereKey($address->getKey())->firstOrFail()->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Address removed.')]);

        return to_route('customer.account.addresses');
    }

    private function lockCustomer(Customer $customer): void
    {
        Customer::query()->whereKey($customer->getKey())->lockForUpdate()->firstOrFail();
    }
}
