<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Product;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class RecalculateProductRating implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $productId) {}

    public function handle(): void
    {
        DB::transaction(function (): void {
            $product = Product::withoutGlobalScopes()
                ->whereKey($this->productId)
                ->lockForUpdate()
                ->first();

            if ($product === null) {
                return;
            }

            $aggregate = $product->reviews()
                ->where('is_approved', true)
                ->selectRaw('COALESCE(AVG(rating), 0) AS rating_avg, COUNT(*) AS rating_count')
                ->first();

            $product->forceFill([
                'rating_avg' => round((float) $aggregate->rating_avg, 2),
                'rating_count' => (int) $aggregate->rating_count,
            ])->save();
        });
    }
}
