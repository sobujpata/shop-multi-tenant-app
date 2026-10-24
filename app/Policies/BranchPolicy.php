<?php

namespace App\Policies;

use App\Models\Branch;
use App\Models\User;

class BranchPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function view(User $user, Branch $branch): bool
    {
        return $user->tenant_id === $branch->tenant_id
            && (
                ! $user->hasAnyRole(['branch-manager', 'sales-man'])
                || $user->branch_id === $branch->id
            );
    }

    public function create(User $user): bool
    {
        return $user->hasRole('tenant-admin');
    }

    public function update(User $user, Branch $branch): bool
    {
        return $user->hasRole('tenant-admin') && $user->tenant_id === $branch->tenant_id;
    }

    public function delete(User $user, Branch $branch): bool
    {
        return $this->update($user, $branch);
    }
}
