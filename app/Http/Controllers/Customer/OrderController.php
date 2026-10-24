<?php

declare(strict_types=1);

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\CancelSubOrderRequest;
use App\Models\BranchStock;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\SubOrder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $customer = $this->customer($request);
        Gate::forUser($customer)->authorize('viewAny', Order::class);

        $orders = $customer->orders()
            ->with([
                'subOrders' => fn ($query) => $query
                    ->withoutGlobalScopes()
                    ->select(['id', 'order_id', 'branch_id', 'status', 'total'])
                    ->with([
                        'branch' => fn ($branches) => $branches
                            ->withoutGlobalScopes()
                            ->select(['id', 'name']),
                    ]),
            ])
            ->latest()
            ->paginate(12)
            ->through(function (Order $order): array {
                $statuses = $order->subOrders->pluck('status')->unique();

                return [
                    'id' => $order->id,
                    'order_no' => $order->order_no,
                    'created_at' => $order->created_at,
                    'total' => $order->total,
                    'payment_status' => $order->payment_status,
                    'status' => $this->orderStatus($statuses->all()),
                    'sub_orders' => $order->subOrders->map(fn (SubOrder $subOrder): array => [
                        'id' => $subOrder->id,
                        'status' => $subOrder->status,
                        'branch' => $subOrder->branch->name,
                    ])->all(),
                ];
            });

        return Inertia::render('Customer/Account/Orders/Index', ['orders' => $orders]);
    }

    public function show(Request $request, int $order): Response
    {
        $customer = $this->customer($request);
        $order = $customer->orders()
            ->with([
                'subOrders' => fn ($query) => $query->withoutGlobalScopes()->with([
                    'tenant:id,name',
                    'branch' => fn ($branches) => $branches
                        ->withoutGlobalScopes()
                        ->select(['id', 'name', 'city', 'address']),
                    'items.product' => fn ($products) => $products
                        ->withoutGlobalScopes()
                        ->select(['id', 'name', 'slug'])
                        ->with('images:id,product_id,path,is_primary'),
                    'items.variant:id,size,color,sku',
                    'items.review:id,customer_id,product_id,order_item_id',
                    'trackings' => fn ($trackings) => $trackings->oldest(),
                ]),
            ])
            ->whereKey($order)
            ->firstOrFail();
        Gate::forUser($customer)->authorize('view', $order);
        $reviewedProductIds = $customer->reviews()->pluck('product_id')->all();

        return Inertia::render('Customer/Account/Orders/Show', [
            'order' => $order,
            'reviewedProductIds' => $reviewedProductIds,
        ]);
    }

    public function tracking(Request $request, int $order): Response
    {
        $customer = $this->customer($request);
        $order = $customer->orders()
            ->with([
                'subOrders' => fn ($query) => $query->withoutGlobalScopes()->with([
                    'tenant:id,name',
                    'branch' => fn ($branches) => $branches
                        ->withoutGlobalScopes()
                        ->select(['id', 'name', 'city']),
                    'trackings' => fn ($trackings) => $trackings->oldest(),
                ]),
            ])
            ->whereKey($order)
            ->firstOrFail();
        Gate::forUser($customer)->authorize('view', $order);

        return Inertia::render('Customer/Account/Orders/Tracking', ['order' => $order]);
    }

    public function cancel(
        CancelSubOrderRequest $request,
        int $order,
        int $subOrder,
    ): RedirectResponse {
        $customer = $this->customer($request);
        $ownedOrder = $customer->orders()->whereKey($order)->firstOrFail();
        $note = $request->validated('note') ?? 'Cancelled by customer.';

        DB::transaction(function () use ($customer, $ownedOrder, $subOrder, $note): void {
            $subOrder = SubOrder::withoutGlobalScopes()
                ->where('order_id', $ownedOrder->id)
                ->whereKey($subOrder)
                ->lockForUpdate()
                ->firstOrFail();
            Gate::forUser($customer)->authorize('cancel', $subOrder);

            $items = OrderItem::query()
                ->where('sub_order_id', $subOrder->id)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            foreach ($items as $item) {
                $stock = BranchStock::query()
                    ->where('branch_id', $subOrder->branch_id)
                    ->where('variant_id', $item->variant_id)
                    ->lockForUpdate()
                    ->firstOrFail();
                $stock->increment('quantity', $item->quantity);
            }

            $subOrder->update(['status' => 'cancelled']);
            $subOrder->trackings()->create([
                'status' => 'cancelled',
                'note' => $note,
            ]);
        });

        return to_route('customer.account.orders.show', $ownedOrder);
    }

    /**
     * @param  array<int, string>  $statuses
     */
    private function orderStatus(array $statuses): string
    {
        if (count($statuses) === 1) {
            return $statuses[0];
        }

        if (in_array('cancelled', $statuses, true) && count($statuses) === 2) {
            return 'partially_cancelled';
        }

        return 'processing';
    }

    private function customer(Request $request): Customer
    {
        $customer = $request->user('customer');
        abort_unless($customer instanceof Customer, 403);

        return $customer;
    }
}
