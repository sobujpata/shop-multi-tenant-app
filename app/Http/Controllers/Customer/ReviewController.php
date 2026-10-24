<?php

declare(strict_types=1);

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreReviewRequest;
use App\Jobs\RecalculateProductRating;
use App\Models\Customer;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class ReviewController extends Controller
{
    public function store(StoreReviewRequest $request, int $productId): RedirectResponse
    {
        $customer = $request->user('customer');
        abort_unless($customer instanceof Customer, 403);
        $product = Product::withoutGlobalScopes()->findOrFail($productId);
        $attributes = $request->validated();
        $orderItem = OrderItem::query()
            ->whereKey($attributes['order_item_id'])
            ->where('product_id', $product->id)
            ->whereHas('subOrder', fn ($query) => $query
                ->withoutGlobalScopes()
                ->where('status', 'delivered')
                ->whereHas('order', fn ($order) => $order->where('customer_id', $customer->id)))
            ->firstOrFail();
        $paths = [];

        foreach ($request->file('images', []) as $image) {
            $path = $image->store('reviews/'.$customer->id, 'public');
            if ($path === false) {
                throw new RuntimeException('A review image could not be saved.');
            }

            $paths[] = $path;
        }

        try {
            DB::transaction(function () use ($customer, $product, $attributes, $orderItem, $paths): void {
                $review = Review::query()->create([
                    'customer_id' => $customer->id,
                    'product_id' => $product->id,
                    'order_item_id' => $orderItem->id,
                    'rating' => $attributes['rating'],
                    'comment' => $attributes['comment'] ?? null,
                    'is_approved' => false,
                ]);

                foreach ($paths as $path) {
                    $review->images()->create(['path' => $path]);
                }
            });
        } catch (\Throwable $exception) {
            Storage::disk('public')->delete($paths);

            throw $exception;
        }

        RecalculateProductRating::dispatch($product->id)->afterCommit();

        return back()->with('success', 'Your review has been submitted for approval.');
    }
}
