<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\SubOrder;
use App\Models\User;

class SubOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function view(User $user, SubOrder $subOrder): bool
    {
        return $user->tenant_id === $subOrder->tenant_id
            && (
                ! $user->hasAnyRole(['branch-manager', 'sales-man'])
                || $user->branch_id === $subOrder->branch_id
            );
    }

    public function update(User $user, SubOrder $subOrder): bool
    {
        return $this->view($user, $subOrder);
    }

    public function cancel(Customer $customer, SubOrder $subOrder): bool
    {
        return $subOrder->status === 'pending'
            && $subOrder->order()->where('customer_id', $customer->id)->exists();
    }
}
