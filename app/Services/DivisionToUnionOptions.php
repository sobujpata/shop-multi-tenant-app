<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Divisiontounion;

class DivisionToUnionOptions
{
    /**
     * @return list<array{division: string, district: string, upazila: string}>
     */
    public function all(): array
    {
        return Divisiontounion::query()
            ->select([
                'divisions as division',
                'districts as district',
                'upazilas as upazila',
            ])
            ->whereNotIn('divisions', ['', '-'])
            ->whereNotIn('districts', ['', '-'])
            ->whereNotIn('upazilas', ['', '-'])
            ->distinct()
            ->orderBy('divisions')
            ->orderBy('districts')
            ->orderBy('upazilas')
            ->get()
            ->map(fn (Divisiontounion $location): array => [
                'division' => $location->division,
                'district' => $location->district,
                'upazila' => $location->upazila,
            ])
            ->all();
    }
}
