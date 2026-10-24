<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Category;
use App\Models\Customer;
use App\Models\MarketSetting;
use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $marketSettings = MarketSetting::current();
        $staffUser = $request->user('web');
        $tenant = $staffUser?->tenant;
        $tenantReadOnly = $tenant !== null
            && $tenant->status === 'active'
            && $staffUser->hasAnyRole(['tenant-admin', 'branch-manager'])
            && ! $tenant->activeSubscription()->exists();

        return [
            ...parent::share($request),
            'name' => $marketSettings->market_name,
            'storefrontSettings' => [
                'name' => $marketSettings->market_name,
                'logo' => $marketSettings->logo_path
                    ? Storage::disk('public')->url($marketSettings->logo_path)
                    : null,
                'currency' => $marketSettings->currency_code,
                'timezone' => $marketSettings->timezone,
                'socialLinks' => $marketSettings->social_links ?? [],
                'footerContent' => array_replace(
                    MarketSetting::defaultFooterContent(),
                    $marketSettings->footer_content ?? [],
                ),
            ],
            'auth' => [
                'user' => $staffUser,
                'roles' => $staffUser?->getRoleNames()->all() ?? [],
                'customer' => $request->user('customer'),
            ],
            'tenantReadOnly' => $tenantReadOnly,
            'storefront' => fn (): array => $this->storefrontCounts($request),
            'storefrontCategories' => fn () => Category::query()
                ->whereNull('parent_id')
                ->with(['children:id,parent_id,name,slug'])
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * @return array{cartCount: int, favoritesCount: int, cart: array<string, mixed>}
     */
    private function storefrontCounts(Request $request): array
    {
        $user = $request->user('customer');
        $customer = $user instanceof Customer ? $user : null;
        $cart = app(CartService::class)->data($customer, $request->session()->getId());

        return [
            'cartCount' => $cart['count'],
            'favoritesCount' => $customer?->wishlists()->count() ?? 0,
            'cart' => $cart,
        ];
    }
}
