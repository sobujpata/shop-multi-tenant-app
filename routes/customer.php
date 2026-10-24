<?php

use App\Http\Controllers\Auth\Customer\AuthenticatedCustomerSessionController;
use App\Http\Controllers\Auth\Customer\CustomerEmailVerificationController;
use App\Http\Controllers\Auth\Customer\CustomerPasswordResetLinkController;
use App\Http\Controllers\Auth\Customer\NewCustomerPasswordController;
use App\Http\Controllers\Auth\Customer\RegisteredCustomerController;
use App\Http\Controllers\Customer\AddressController;
use App\Http\Controllers\Customer\CheckoutController;
use App\Http\Controllers\Customer\OrderController;
use App\Http\Controllers\Customer\ProfileController;
use App\Http\Controllers\Customer\ReviewController;
use App\Http\Controllers\Customer\WishlistController;
use Illuminate\Support\Facades\Route;

Route::prefix('customer')->name('customer.')->group(function (): void {
    Route::middleware('guest:customer')->group(function (): void {
        Route::get('register', [RegisteredCustomerController::class, 'create'])
            ->name('register');
        Route::post('register', [RegisteredCustomerController::class, 'store'])
            ->middleware('throttle:5,1')
            ->name('register.store');

        Route::get('login', [AuthenticatedCustomerSessionController::class, 'create'])
            ->name('login');
        Route::post('login', [AuthenticatedCustomerSessionController::class, 'store'])
            ->middleware('throttle:5,1')
            ->name('login.store');

        Route::get('forgot-password', [CustomerPasswordResetLinkController::class, 'create'])
            ->name('password.request');
        Route::post('forgot-password', [CustomerPasswordResetLinkController::class, 'store'])
            ->middleware('throttle:6,1')
            ->name('password.email');

        Route::get('reset-password/{token}', [NewCustomerPasswordController::class, 'create'])
            ->name('password.reset');
        Route::post('reset-password', [NewCustomerPasswordController::class, 'store'])
            ->middleware('throttle:6,1')
            ->name('password.update');
    });

    Route::middleware('auth:customer')->group(function (): void {
        Route::post('logout', [AuthenticatedCustomerSessionController::class, 'destroy'])
            ->name('logout');
        Route::get('wishlist', [WishlistController::class, 'index'])->name('wishlist.index');
        Route::post('wishlist/toggle', [WishlistController::class, 'toggle'])->name('wishlist.toggle');
        Route::get('checkout', [CheckoutController::class, 'show'])->name('checkout');
        Route::post('checkout', [CheckoutController::class, 'place'])->name('checkout.place');
        Route::get('checkout/success/{order}', [CheckoutController::class, 'success'])
            ->name('checkout.success');
        Route::post('products/{productId}/reviews', [ReviewController::class, 'store'])
            ->name('reviews.store');

        Route::get('email/verify', [CustomerEmailVerificationController::class, 'notice'])
            ->name('verification.notice');
        Route::get('email/verify/{id}/{hash}', [CustomerEmailVerificationController::class, 'verify'])
            ->middleware(['signed', 'throttle:6,1'])
            ->name('verification.verify');
        Route::post('email/verification-notification', [CustomerEmailVerificationController::class, 'send'])
            ->middleware('throttle:6,1')
            ->name('verification.send');

        Route::prefix('account')->name('account.')->group(function (): void {
            Route::get('/', fn () => to_route('customer.account.profile'))
                ->name('index');

            Route::get('profile', [ProfileController::class, 'show'])->name('profile');
            Route::put('profile', [ProfileController::class, 'update'])->name('profile.update');
            Route::put('password', [ProfileController::class, 'updatePassword'])
                ->name('password.update');

            Route::get('addresses', [AddressController::class, 'index'])->name('addresses');
            Route::post('addresses', [AddressController::class, 'store'])
                ->name('addresses.store');
            Route::put('addresses/{address}', [AddressController::class, 'update'])
                ->name('addresses.update');
            Route::put('addresses/{address}/default', [AddressController::class, 'setDefault'])
                ->name('addresses.default');
            Route::delete('addresses/{address}', [AddressController::class, 'destroy'])
                ->name('addresses.destroy');

            Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
            Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
            Route::get('orders/{order}/tracking', [OrderController::class, 'tracking'])
                ->name('orders.tracking');
            Route::post('orders/{order}/sub-orders/{subOrder}/cancel', [OrderController::class, 'cancel'])
                ->name('orders.sub-orders.cancel');
        });
    });
});
