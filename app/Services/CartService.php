<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartService
{
    public const GUEST_SESSION_KEY = '_guest_cart_session_id';

    public function getCart(?Customer $customer, string $sessionId): Cart
    {
        return Cart::query()->firstOrCreate(
            $customer === null
                ? ['customer_id' => null, 'session_id' => $sessionId]
                : ['customer_id' => $customer->id],
            ['session_id' => $customer === null ? $sessionId : null],
        );
    }

    /**
     * @return array{subtotal: float, count: int, items: array<int, array<string, mixed>>}
     */
    public function data(?Customer $customer, string $sessionId): array
    {
        $cartQuery = Cart::query();
        if ($customer === null) {
            $cartQuery->whereNull('customer_id')->where('session_id', $sessionId);
        } else {
            $cartQuery->where('customer_id', $customer->id);
        }

        $cart = $cartQuery->first();
        if ($cart === null) {
            return ['subtotal' => 0.0, 'count' => 0, 'items' => []];
        }

        $items = CartItem::query()
            ->where('cart_id', $cart->id)
            ->get()
            ->map(function (CartItem $item): array {
                $variant = ProductVariant::query()->findOrFail($item->variant_id);
                $product = Product::withoutGlobalScopes()
                    ->whereKey($variant->product_id)
                    ->first();
                $branch = Branch::withoutGlobalScopes()
                    ->whereKey($item->branch_id)
                    ->first();
                $image = $product === null
                    ? null
                    : ProductImage::query()
                        ->where('product_id', $product->id)
                        ->orderByDesc('is_primary')
                        ->value('path');
                $price = $this->price($variant, $product);

                return [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'branch_id' => $item->branch_id,
                    'branch' => $branch->name,
                    'variant' => [
                        'id' => $variant->id,
                        'sku' => $variant->sku,
                        'size' => $variant->size,
                        'color' => $variant->color,
                    ],
                    'product' => [
                        'id' => $product?->id,
                        'name' => $product->name ?? 'Unavailable product',
                        'slug' => $product?->slug,
                        'image' => $image,
                    ],
                    'price' => $price,
                    'line_total' => round($price * $item->quantity, 2),
                ];
            })
            ->all();

        return [
            'subtotal' => round(array_sum(array_column($items, 'line_total')), 2),
            'count' => array_sum(array_column($items, 'quantity')),
            'items' => $items,
        ];
    }

    public function add(
        ?Customer $customer,
        string $sessionId,
        int $variantId,
        int $branchId,
        int $quantity,
    ): Cart {
        return DB::transaction(function () use (
            $customer,
            $sessionId,
            $variantId,
            $branchId,
            $quantity,
        ): Cart {
            $variant = ProductVariant::query()->findOrFail($variantId);
            $product = Product::withoutGlobalScopes()
                ->whereKey($variant->product_id)
                ->where('is_active', true)
                ->first();
            $branch = Branch::withoutGlobalScopes()
                ->whereKey($branchId)
                ->where('is_active', true)
                ->whereHas('tenant', fn ($query) => $query->where('status', 'active'))
                ->first();

            if ($product === null || $branch === null || $branch->tenant_id !== $product->tenant_id) {
                throw ValidationException::withMessages([
                    'branch_id' => 'This product is not available at the selected branch.',
                ]);
            }

            $cart = $this->getCart($customer, $sessionId);
            $item = CartItem::query()
                ->where('cart_id', $cart->id)
                ->where('variant_id', $variantId)
                ->where('branch_id', $branchId)
                ->lockForUpdate()
                ->first();
            $newQuantity = $quantity + ($item->quantity ?? 0);
            $this->assertStock($variantId, $branchId, $newQuantity);

            if ($item === null) {
                $cart->items()->create([
                    'variant_id' => $variantId,
                    'branch_id' => $branchId,
                    'quantity' => $newQuantity,
                ]);
            } else {
                $item->update(['quantity' => $newQuantity]);
            }

            return $cart->refresh();
        });
    }

    public function update(
        ?Customer $customer,
        string $sessionId,
        int $itemId,
        int $quantity,
    ): Cart {
        return DB::transaction(function () use ($customer, $sessionId, $itemId, $quantity): Cart {
            $cart = $this->getCart($customer, $sessionId);
            $item = CartItem::query()
                ->where('cart_id', $cart->id)
                ->whereKey($itemId)
                ->lockForUpdate()
                ->firstOrFail();
            $this->assertStock($item->variant_id, $item->branch_id, $quantity);
            $item->update(['quantity' => $quantity]);

            return $cart->refresh();
        });
    }

    public function remove(?Customer $customer, string $sessionId, int $itemId): Cart
    {
        $cart = $this->getCart($customer, $sessionId);
        CartItem::query()->where('cart_id', $cart->id)->whereKey($itemId)->delete();

        return $cart->refresh();
    }

    public function mergeGuestCart(Customer $customer, string $sessionId): void
    {
        DB::transaction(function () use ($customer, $sessionId): void {
            $guestCart = Cart::query()
                ->whereNull('customer_id')
                ->where('session_id', $sessionId)
                ->lockForUpdate()
                ->first();

            if ($guestCart === null) {
                return;
            }

            $customerCart = $this->getCart($customer, $sessionId);

            $guestItems = CartItem::query()
                ->where('cart_id', $guestCart->id)
                ->orderBy('branch_id')
                ->orderBy('variant_id')
                ->lockForUpdate()
                ->get();

            foreach ($guestItems as $guestItem) {
                $variant = ProductVariant::query()->find($guestItem->variant_id);
                $product = $variant === null
                    ? null
                    : Product::withoutGlobalScopes()
                        ->whereKey($variant->product_id)
                        ->where('is_active', true)
                        ->first();
                $branch = Branch::withoutGlobalScopes()
                    ->whereKey($guestItem->branch_id)
                    ->where('is_active', true)
                    ->whereHas('tenant', fn ($query) => $query->where('status', 'active'))
                    ->first();
                $stock = $product !== null
                    && $branch !== null
                    && $branch->tenant_id === $product->tenant_id
                    ? BranchStock::query()
                        ->where('variant_id', $guestItem->variant_id)
                        ->where('branch_id', $guestItem->branch_id)
                        ->lockForUpdate()
                        ->value('quantity') ?? 0
                    : 0;

                $existing = CartItem::query()
                    ->where('cart_id', $customerCart->id)
                    ->where('variant_id', $guestItem->variant_id)
                    ->where('branch_id', $guestItem->branch_id)
                    ->lockForUpdate()
                    ->first();
                $quantity = min($stock, $guestItem->quantity + ($existing->quantity ?? 0));

                if ($quantity === 0) {
                    $existing?->delete();

                    continue;
                }

                if ($existing === null) {
                    $customerCart->items()->create([
                        'variant_id' => $guestItem->variant_id,
                        'branch_id' => $guestItem->branch_id,
                        'quantity' => $quantity,
                    ]);
                } else {
                    $existing->update(['quantity' => $quantity]);
                }
            }

            $guestCart->delete();
        });
    }

    public function assertStock(int $variantId, int $branchId, int $quantity): void
    {
        $stock = BranchStock::query()
            ->where('variant_id', $variantId)
            ->where('branch_id', $branchId)
            ->lockForUpdate()
            ->value('quantity');

        if ($stock === null || $stock < $quantity) {
            throw ValidationException::withMessages([
                'quantity' => 'The selected branch does not have enough stock for this quantity.',
            ]);
        }
    }

    private function price(ProductVariant $variant, ?Product $product): float
    {
        if ($product === null) {
            return 0.0;
        }

        return (float) ($variant->price ?? $product->sale_price ?? $product->base_price);
    }
}
