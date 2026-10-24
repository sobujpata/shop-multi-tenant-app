<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use App\Models\Customer;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Validator;

class StoreReviewRequest extends FormRequest
{
    private ?Product $reviewProduct = null;

    public function authorize(): bool
    {
        $customer = $this->user('customer');
        $product = $this->reviewProduct();

        return $customer instanceof Customer
            && $product instanceof Product
            && Gate::forUser($customer)->allows('create', [Review::class, $product]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'order_item_id' => ['required', 'integer', 'exists:order_items,id'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:3000'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ];
    }

    /**
     * @return list<callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $customer = $this->user('customer');
                $product = $this->reviewProduct();

                if (! $customer instanceof Customer || ! $product instanceof Product) {
                    return;
                }

                $isEligible = OrderItem::query()
                    ->whereKey($this->input('order_item_id'))
                    ->where('product_id', $product->id)
                    ->whereHas('subOrder', fn ($query) => $query
                        ->withoutGlobalScopes()
                        ->where('status', 'delivered')
                        ->whereHas('order', fn ($order) => $order->where('customer_id', $customer->id)))
                    ->exists();

                if (! $isEligible) {
                    $validator->errors()->add(
                        'order_item_id',
                        'Choose an item from one of your delivered orders for this product.',
                    );
                }
            },
        ];
    }

    private function reviewProduct(): ?Product
    {
        if ($this->reviewProduct !== null) {
            return $this->reviewProduct;
        }

        $productId = $this->route('productId');
        if (! is_numeric($productId)) {
            return null;
        }

        $product = Product::withoutGlobalScopes()->find($productId);

        return $this->reviewProduct = $product;
    }
}
