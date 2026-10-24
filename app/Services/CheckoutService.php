<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\OrderPlaced;
use App\Models\Branch;
use App\Models\BranchDeliveryCost;
use App\Models\BranchStock;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SubOrder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function place(Customer $customer, array $data): Order
    {
        return DB::transaction(function () use ($customer, $data): Order {
            $cart = Cart::query()
                ->where('customer_id', $customer->id)
                ->lockForUpdate()
                ->first();

            if ($cart === null) {
                throw ValidationException::withMessages([
                    'cart' => 'Your cart is empty.',
                ]);
            }

            $items = CartItem::query()
                ->where('cart_id', $cart->id)
                ->orderBy('branch_id')
                ->orderBy('variant_id')
                ->lockForUpdate()
                ->get();

            if ($items->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => 'Your cart is empty.',
                ]);
            }

            $stockRows = [];
            $checkoutItems = [];
            $branches = [];

            foreach ($items as $item) {
                $variant = ProductVariant::query()
                    ->whereKey($item->variant_id)
                    ->firstOrFail();
                $product = Product::withoutGlobalScopes()
                    ->whereKey($variant->product_id)
                    ->where('is_active', true)
                    ->first();
                $branch = Branch::withoutGlobalScopes()
                    ->whereKey($item->branch_id)
                    ->where('is_active', true)
                    ->whereHas('tenant', fn ($query) => $query->where('status', 'active'))
                    ->lockForUpdate()
                    ->first();

                if ($product === null || $branch === null || $branch->tenant_id !== $product->tenant_id) {
                    throw ValidationException::withMessages([
                        'cart' => 'A product in your cart is no longer available at its selected branch.',
                    ]);
                }

                $stock = BranchStock::query()
                    ->where('variant_id', $variant->id)
                    ->where('branch_id', $branch->id)
                    ->lockForUpdate()
                    ->first();

                if ($stock === null || $stock->quantity < $item->quantity) {
                    throw ValidationException::withMessages([
                        'cart' => "There is not enough stock for {$product->name} at {$branch->name}.",
                    ]);
                }

                $stockRows[$item->id] = $stock;
                $branches[$branch->id] = $branch;
                $unitCents = $this->toCents(
                    $variant->price ?? $product->sale_price ?? $product->base_price,
                );
                $checkoutItems[] = [
                    'item' => $item,
                    'product' => $product,
                    'variant' => $variant,
                    'branch' => $branch,
                    'line_cents' => $unitCents * $item->quantity,
                    'unit_cents' => $unitCents,
                ];
            }

            $subtotalCents = (int) array_sum(array_column($checkoutItems, 'line_cents'));
            $discountCents = $this->couponDiscount(
                $data['coupon_code'] ?? null,
                $subtotalCents,
                $checkoutItems,
            );
            $deliveryCostIds = $data['delivery_cost_ids'];
            $selectedBranchIds = array_map('strval', array_keys($deliveryCostIds));
            $cartBranchIds = array_map('strval', array_keys($branches));
            sort($selectedBranchIds);
            sort($cartBranchIds);

            if ($selectedBranchIds !== $cartBranchIds) {
                throw ValidationException::withMessages([
                    'delivery_cost_ids' => 'Choose a delivery area for every branch in your cart.',
                ]);
            }

            $shippingFeeCents = 0;
            $deliveryAreas = [];

            foreach ($branches as $branchId => $branch) {
                $deliveryCost = BranchDeliveryCost::query()
                    ->where('branch_id', $branchId)
                    ->whereKey($deliveryCostIds[$branchId])
                    ->lockForUpdate()
                    ->first();

                if ($deliveryCost === null) {
                    throw ValidationException::withMessages([
                        "delivery_cost_ids.{$branchId}" => 'Choose a valid delivery area for this branch.',
                    ]);
                }

                $shippingFeeCents += $this->toCents($deliveryCost->cost);
                $deliveryAreas[$branchId] = [
                    'area' => $deliveryCost->area,
                    'cost' => $deliveryCost->cost,
                ];
            }
            $address = $this->shippingAddress($customer, $data);
            $address['delivery_areas'] = $deliveryAreas;
            $order = Order::query()->create([
                'order_no' => 'ORD-'.now()->format('ymd').'-'.Str::upper(Str::random(8)),
                'customer_id' => $customer->id,
                'shipping_address' => $address,
                'subtotal' => $this->fromCents($subtotalCents),
                'shipping_fee' => $this->fromCents($shippingFeeCents),
                'discount' => $this->fromCents($discountCents),
                'total' => $this->fromCents(max(0, $subtotalCents + $shippingFeeCents - $discountCents)),
                'payment_method' => $data['payment_method'],
                'payment_status' => 'pending',
            ]);

            $groups = collect($checkoutItems)->groupBy(
                fn (array $entry): string => $entry['product']->tenant_id.':'.$entry['branch']->id,
            );

            foreach ($groups as $group) {
                $first = $group->first();
                $subOrderCents = (int) array_sum(array_column($group->all(), 'line_cents'));
                $subOrder = SubOrder::query()->create([
                    'order_id' => $order->id,
                    'tenant_id' => $first['product']->tenant_id,
                    'branch_id' => $first['branch']->id,
                    'total' => $this->fromCents($subOrderCents),
                    'status' => 'pending',
                ]);

                foreach ($group as $entry) {
                    $item = $entry['item'];
                    $variant = $entry['variant'];
                    $product = $entry['product'];
                    $options = array_filter([$variant->color, $variant->size]);
                    $name = $product->name.($options === [] ? '' : ' - '.implode(' / ', $options));

                    $subOrder->items()->create([
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'name' => $name,
                        'price' => $this->fromCents($entry['unit_cents']),
                        'quantity' => $item->quantity,
                    ]);
                    $itemStock = $stockRows[$item->id];
                    $itemStock->decrement('quantity', $item->quantity);
                }

                $subOrder->trackings()->create([
                    'status' => 'pending',
                    'note' => 'Order received.',
                ]);
            }

            $order->payments()->create([
                'method' => $data['payment_method'],
                'amount' => $order->total,
                'status' => 'pending',
            ]);
            $cart->items()->delete();

            event(new OrderPlaced($order));

            return $order;
        });
    }

    /**
     * @param  array<int, array{item: CartItem, product: Product, variant: ProductVariant, branch: Branch, line_cents: int, unit_cents: int}>  $items
     */
    private function couponDiscount(?string $code, int $subtotalCents, array $items): int
    {
        if ($code === null || trim($code) === '') {
            return 0;
        }

        $coupon = Coupon::query()
            ->whereRaw('LOWER(code) = ?', [mb_strtolower(trim($code))])
            ->lockForUpdate()
            ->first();

        if (
            $coupon === null
            || ($coupon->starts_at !== null && Carbon::parse($coupon->starts_at)->isFuture())
            || ($coupon->ends_at !== null && Carbon::parse($coupon->ends_at)->isPast())
            || ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit)
        ) {
            throw ValidationException::withMessages([
                'coupon_code' => 'This coupon is invalid or has expired.',
            ]);
        }

        $eligibleCents = $subtotalCents;
        if ($coupon->tenant_id !== null) {
            $eligibleCents = array_sum(array_map(
                fn (array $entry): int => $entry['product']->tenant_id === $coupon->tenant_id
                    ? $entry['line_cents']
                    : 0,
                $items,
            ));
        }

        if (
            $eligibleCents === 0
            || $eligibleCents < $this->toCents($coupon->min_order)
        ) {
            throw ValidationException::withMessages([
                'coupon_code' => 'Your order does not meet this coupon’s minimum or store requirements.',
            ]);
        }

        $discountCents = $coupon->type === 'percent'
            ? (int) round($eligibleCents * ((float) $coupon->value / 100))
            : $this->toCents($coupon->value);
        $coupon->increment('used_count');

        return min($eligibleCents, $discountCents);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function shippingAddress(Customer $customer, array $data): array
    {
        if (! empty($data['address_id'])) {
            $address = $customer->addresses()->whereKey($data['address_id'])->firstOrFail();
        } else {
            $address = $customer->addresses()->create([
                'label' => $data['label'],
                'recipient_name' => $data['recipient_name'],
                'phone' => $data['phone'],
                'address_line' => $data['address_line'],
                'division' => $data['division'],
                'district' => $data['district'],
                'upazila' => $data['upazila'],
                'postal_code' => $data['postal_code'] ?? null,
                'is_default' => false,
            ]);
        }

        return $address->only([
            'label',
            'recipient_name',
            'phone',
            'address_line',
            'division',
            'district',
            'upazila',
            'postal_code',
        ]);
    }

    private function toCents(string|int|float $amount): int
    {
        return (int) round((float) $amount * 100);
    }

    private function fromCents(int $amount): string
    {
        return number_format($amount / 100, 2, '.', '');
    }
}
