<?php

declare(strict_types=1);

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\CheckoutRequest;
use App\Models\BranchDeliveryCost;
use App\Models\Customer;
use App\Services\CartService;
use App\Services\CheckoutService;
use App\Services\DivisionToUnionOptions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly CheckoutService $checkoutService,
    ) {}

    public function show(
        Request $request,
        DivisionToUnionOptions $locationOptions,
    ): Response|RedirectResponse
    {
        $customer = $this->customer($request);
        $cart = $this->cartService->data($customer, $request->session()->getId());

        if ($cart['items'] === []) {
            return to_route('cart.index')->withErrors(['cart' => 'Add an item before checking out.']);
        }

        $branchIds = array_unique(array_column($cart['items'], 'branch_id'));
        $deliveryAreas = BranchDeliveryCost::query()
            ->whereIn('branch_id', $branchIds)
            ->orderBy('area')
            ->get(['id', 'branch_id', 'area', 'cost'])
            ->groupBy('branch_id');

        return Inertia::render('Checkout/Index', [
            'cart' => $cart,
            'deliveryAreas' => $deliveryAreas,
            'addresses' => $customer->addresses()->orderByDesc('is_default')->orderBy('id')->get(),
            'locations' => $locationOptions->all(),
        ]);
    }

    public function place(CheckoutRequest $request): RedirectResponse
    {
        $customer = $this->customer($request);
        $order = $this->checkoutService->place($customer, $request->validated());

        return to_route('customer.checkout.success', $order);
    }

    public function success(Request $request, int $order): Response
    {
        $customer = $this->customer($request);
        $order = $customer->orders()
            ->with([
                'subOrders.items',
                'subOrders.branch' => fn ($branches) => $branches
                    ->withoutGlobalScopes()
                    ->select(['id', 'name']),
                'payments',
            ])
            ->whereKey($order)
            ->firstOrFail();

        return Inertia::render('Checkout/Success', ['order' => $order]);
    }

    private function customer(Request $request): Customer
    {
        $customer = $request->user('customer');
        abort_unless($customer instanceof Customer, 403);

        return $customer;
    }
}
