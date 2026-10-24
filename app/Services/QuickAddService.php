<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class QuickAddService
{
    /**
     * Resolve one purchasable (variant, branch) pair with live stock for
     * every product, keyed by product id.
     *
     * @param  Collection<int, Product>  $products
     * @return array<int, array{variant_id: int, branch_id: int}>
     */
    public static function pairs(Collection $products): array
    {
        $rows = DB::table('branch_stocks')
            ->join('product_variants', 'product_variants.id', '=', 'branch_stocks.variant_id')
            ->whereIn('product_variants.product_id', $products->pluck('id')->unique()->values())
            ->where('branch_stocks.quantity', '>', 0)
            ->orderBy('product_variants.id')
            ->orderBy('branch_stocks.id')
            ->get([
                'product_variants.product_id',
                'product_variants.id as variant_id',
                'branch_stocks.branch_id',
            ]);

        $pairs = [];

        foreach ($rows as $row) {
            $pairs[(int) $row->product_id] ??= [
                'variant_id' => (int) $row->variant_id,
                'branch_id' => (int) $row->branch_id,
            ];
        }

        return $pairs;
    }

    /**
     * @param  array<int, array{variant_id: int, branch_id: int}>  $pairs
     * @return array<string, mixed>
     */
    public static function payloadProduct(Product $product, array $pairs): array
    {
        return array_merge($product->toArray(), [
            'default_variant_id' => $pairs[$product->id]['variant_id'] ?? null,
            'default_branch_id' => $pairs[$product->id]['branch_id'] ?? null,
        ]);
    }

    /**
     * @param  Collection<int, Product>  $products
     * @param  array<int, array{variant_id: int, branch_id: int}>  $pairs
     * @return array<int, array<string, mixed>>
     */
    public static function payload(Collection $products, array $pairs): array
    {
        return $products->values()->map(
            fn (Product $product): array => self::payloadProduct($product, $pairs),
        )->all();
    }
}
