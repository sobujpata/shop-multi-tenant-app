<?php

declare(strict_types=1);

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\ToggleWishlistRequest;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    public function index(Request $request): Response
    {
        $customer = $this->customer($request);

        return Inertia::render('Customer/Account/Wishlist', [
            'products' => $customer->wishlists()
                ->with(['product' => fn ($query) => $query
                    ->withoutGlobalScopes()
                    ->withStorefrontCardDetails()
                    ->with(['images' => fn ($images) => $images->orderByDesc('is_primary')])])
                ->latest()
                ->get()
                ->pluck('product')
                ->filter()
                ->values(),
        ]);
    }

    public function toggle(ToggleWishlistRequest $request): RedirectResponse
    {
        $customer = $this->customer($request);
        $product = Product::withoutGlobalScopes()
            ->whereKey($request->validated('product_id'))
            ->where('is_active', true)
            ->first();

        if ($product === null) {
            throw ValidationException::withMessages([
                'product_id' => 'This product is no longer available.',
            ]);
        }

        $wishlist = $customer->wishlists()->where('product_id', $product->id)->first();
        if ($wishlist === null) {
            $customer->wishlists()->create(['product_id' => $product->id]);
        } else {
            $wishlist->delete();
        }

        return back();
    }

    private function customer(Request $request): Customer
    {
        $customer = $request->user('customer');
        abort_unless($customer instanceof Customer, 403);

        return $customer;
    }
}
