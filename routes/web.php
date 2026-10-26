<?php

use App\Http\Controllers\AboutController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\BrandDirectoryController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CategoryDirectoryController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LegalPageController;
use App\Http\Controllers\SellerOnboardingController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\StorefrontSeoController;
use App\Http\Controllers\SuperAdmin\AboutPageController;
use App\Http\Controllers\SuperAdmin\ActivityLogController;
use App\Http\Controllers\SuperAdmin\ContactPageController;
use App\Http\Controllers\SuperAdmin\DashboardController;
use App\Http\Controllers\SuperAdmin\DivisionToUnionController;
use App\Http\Controllers\SuperAdmin\FooterContentController;
use App\Http\Controllers\SuperAdmin\LegalPagesController;
use App\Http\Controllers\SuperAdmin\MarketSettingsController;
use App\Http\Controllers\SuperAdmin\PermissionController;
use App\Http\Controllers\SuperAdmin\PlanController;
use App\Http\Controllers\SuperAdmin\RoleController;
use App\Http\Controllers\SuperAdmin\SocialMediaController;
use App\Http\Controllers\SuperAdmin\SubscriptionController;
use App\Http\Controllers\SuperAdmin\TenantController;
use App\Http\Controllers\Tenant\BranchController as TenantBranchController;
use App\Http\Controllers\Tenant\DashboardController as TenantDashboardController;
use App\Http\Controllers\Tenant\OrderController as TenantOrderController;
use App\Http\Controllers\Tenant\PosController as TenantPosController;
use App\Http\Controllers\Tenant\ProductController as TenantProductController;
use App\Http\Controllers\Tenant\StockController as TenantStockController;
use App\Http\Controllers\Tenant\UserController as TenantUserController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', HomeController::class)->name('home');
Route::get('/robots.txt', [StorefrontSeoController::class, 'robots'])->name('robots');
Route::get('/sitemap.xml', [StorefrontSeoController::class, 'sitemap'])->name('sitemap');
Route::get('/about', AboutController::class)->name('about');
Route::get('/contact', ContactController::class)->name('contact');
Route::get('/terms-of-use', LegalPageController::class)->defaults('slug', 'terms-of-use')->name('legal.terms');
Route::get('/privacy-policy', LegalPageController::class)->defaults('slug', 'privacy-policy')->name('legal.privacy');
Route::get('/refund-policy', LegalPageController::class)->defaults('slug', 'refund-policy')->name('legal.refund');
Route::inertia('/faq', 'Faq')->name('faq');
Route::get('/shop', [ShopController::class, 'index'])->name('shop.index');
Route::get('/shop/{product}', [ShopController::class, 'show'])->name('shop.show');
Route::get('/categories', CategoryDirectoryController::class)->name('categories.browse');
Route::get('/brands', BrandDirectoryController::class)->name('brands.browse');
Route::get('/stores', [StoreController::class, 'index'])->name('stores.index');
Route::get('/stores/{store:slug}', [StoreController::class, 'show'])->name('stores.show');
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart/items', [CartController::class, 'store'])->name('cart.items.store');
Route::patch('/cart/items/{item}', [CartController::class, 'update'])->name('cart.items.update');
Route::delete('/cart/items/{item}', [CartController::class, 'destroy'])->name('cart.items.destroy');

require __DIR__.'/customer.php';

Route::middleware('auth')->group(function () {
    Route::get('dashboard', function (Request $request) {
        $user = $request->user();

        if ($user instanceof User) {
            if ($user->hasRole('super-admin')) {
                return app(DashboardController::class)->starterKit($request);
            }

            if ($user->tenant_id === null) {
                return to_route('seller.onboarding.create');
            }

            if ($user->hasAnyRole(['tenant-admin', 'branch-manager'])) {
                return app(TenantDashboardController::class)->starterKit($request);
            }
        }

        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('seller/onboarding', [SellerOnboardingController::class, 'create'])
        ->name('seller.onboarding.create');
    Route::post('seller/onboarding', [SellerOnboardingController::class, 'store'])
        ->name('seller.onboarding.store');
});

Route::prefix('super-admin')
    ->name('super-admin.')
    ->middleware(['auth', 'role:super-admin'])
    ->group(function (): void {
        Route::get('/', DashboardController::class)->name('dashboard');
        Route::get('market-settings', [MarketSettingsController::class, 'edit'])
            ->name('market-settings.edit');
        Route::put('market-settings', [MarketSettingsController::class, 'update'])
            ->name('market-settings.update');
        Route::get('social-media', [SocialMediaController::class, 'edit'])
            ->name('social-media.edit');
        Route::put('social-media', [SocialMediaController::class, 'update'])
            ->name('social-media.update');
        Route::get('footer-content', [FooterContentController::class, 'edit'])
            ->name('footer-content.edit');
        Route::put('footer-content', [FooterContentController::class, 'update'])
            ->name('footer-content.update');
        Route::get('about', [AboutPageController::class, 'edit'])
            ->name('about.edit');
        Route::put('about', [AboutPageController::class, 'update'])
            ->name('about.update');
        Route::get('contact', [ContactPageController::class, 'edit'])
            ->name('contact.edit');
        Route::put('contact', [ContactPageController::class, 'update'])
            ->name('contact.update');
        Route::get('legal-pages', [LegalPagesController::class, 'edit'])
            ->name('legal-pages.edit');
        Route::put('legal-pages', [LegalPagesController::class, 'update'])
            ->name('legal-pages.update');

        Route::resource('tenants', TenantController::class)->except(['create', 'show', 'edit']);
        Route::patch('tenants/{tenant}/status', [TenantController::class, 'updateStatus'])
            ->name('tenants.status');

        Route::resource('plans', PlanController::class)->except(['create', 'show', 'edit']);
        Route::resource('divisiontounions', DivisionToUnionController::class)
            ->except(['create', 'show', 'edit']);

        Route::get('subscriptions', [SubscriptionController::class, 'index'])
            ->name('subscriptions.index');
        Route::post('subscriptions', [SubscriptionController::class, 'store'])
            ->name('subscriptions.store');
        Route::post('subscriptions/{subscription}/renew', [SubscriptionController::class, 'renew'])
            ->name('subscriptions.renew');
        Route::post('subscriptions/{subscription}/cancel', [SubscriptionController::class, 'cancel'])
            ->name('subscriptions.cancel');

        Route::get('users', [TenantUserController::class, 'index'])->name('users.index');
        Route::post('users', [TenantUserController::class, 'store'])->name('users.store');
        Route::put('users/{user}', [TenantUserController::class, 'update'])->name('users.update');

        Route::resource('categories', CategoryController::class)->except(['show', 'create', 'edit']);
        Route::resource('brands', BrandController::class)->except(['show', 'create', 'edit']);
        Route::resource('roles', RoleController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('permissions', PermissionController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::get('activity-logs', [ActivityLogController::class, 'index'])
            ->name('activity-logs.index');
    });

Route::prefix('tenant')
    ->name('tenant.')
    ->middleware(['auth', 'role:tenant-admin|branch-manager', 'subscription.active'])
    ->group(function (): void {
        Route::get('/', TenantDashboardController::class)->name('dashboard');
        Route::middleware('role:tenant-admin')->group(function (): void {
            Route::get('users', [TenantUserController::class, 'index'])->name('users.index');
            Route::post('users', [TenantUserController::class, 'store'])->name('users.store');
            Route::put('users/{user}', [TenantUserController::class, 'update'])->name('users.update');
        });
        Route::resource('branches', TenantBranchController::class)->except(['show', 'create', 'edit']);
        Route::resource('categories', CategoryController::class)->except(['show', 'create', 'edit']);
        Route::resource('brands', BrandController::class)->except(['show', 'create', 'edit']);
        Route::resource('products', TenantProductController::class)->except(['show', 'create', 'edit']);
        Route::get('stock', [TenantStockController::class, 'index'])->name('stock.index');
        Route::put('stock', [TenantStockController::class, 'update'])->name('stock.update');
        Route::get('stock/labels', [TenantStockController::class, 'labels'])->name('stock.labels');
        Route::get('orders', [TenantOrderController::class, 'index'])->name('orders.index');
        Route::get('orders/export', [TenantOrderController::class, 'export'])->name('orders.export');
        Route::get('orders/{subOrder}/invoice', [TenantOrderController::class, 'invoice'])->name('orders.invoice');
        Route::patch('orders/{subOrder}/status', [TenantOrderController::class, 'updateStatus'])
            ->name('orders.status');
        Route::patch('orders/{subOrder}/payment-status', [TenantOrderController::class, 'updatePaymentStatus'])
            ->name('orders.payment-status');
        Route::patch('orders/{subOrder}/shipping-fee-status', [TenantOrderController::class, 'updateShippingFeeStatus'])
            ->name('orders.shipping-fee-status');
    });

Route::prefix('tenant')
    ->name('tenant.')
    ->middleware(['auth', 'role:tenant-admin|branch-manager|sales-man', 'subscription.active'])
    ->group(function (): void {
        Route::get('pos', [TenantPosController::class, 'index'])->name('pos.index');
        Route::get('pos/invoices', [TenantPosController::class, 'invoices'])->name('pos.invoices');
        Route::post('pos/checkout', [TenantPosController::class, 'checkout'])->name('pos.checkout');
        Route::get('pos/{subOrder}/invoice', [TenantPosController::class, 'invoice'])
            ->name('pos.invoice');
        Route::get('pos/{subOrder}/receipt', [TenantPosController::class, 'receipt'])
            ->name('pos.receipt');
    });

require __DIR__.'/settings.php';
