<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use App\Models\Customer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('customer') instanceof Customer;
    }

    /**
     * @return list<callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $customer = $this->user('customer');
                $addressId = $this->input('address_id');

                if (
                    $customer instanceof Customer
                    && $addressId !== null
                    && ! $customer->addresses()->whereKey($addressId)->exists()
                ) {
                    $validator->errors()->add('address_id', 'Choose one of your saved addresses.');
                }
            },
        ];
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'address_id' => ['nullable', 'integer', 'exists:customer_addresses,id'],
            'label' => ['required_without:address_id', 'nullable', 'string', 'max:100'],
            'recipient_name' => ['required_without:address_id', 'nullable', 'string', 'max:255'],
            'phone' => ['required_without:address_id', 'nullable', 'string', 'max:32'],
            'address_line' => ['required_without:address_id', 'nullable', 'string', 'max:255'],
            'division' => ['required_without:address_id', 'nullable', 'string', 'max:100'],
            'district' => ['required_without:address_id', 'nullable', 'string', 'max:100'],
            'upazila' => ['required_without:address_id', 'nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'payment_method' => ['required', 'in:cod'],
            'coupon_code' => ['nullable', 'string', 'max:64'],
            'delivery_cost_ids' => ['required', 'array', 'min:1'],
            'delivery_cost_ids.*' => ['required', 'integer', 'exists:branch_delivery_costs,id'],
        ];
    }
}
