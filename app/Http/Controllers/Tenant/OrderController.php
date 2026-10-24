<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UpdateOrderPaymentStatusRequest;
use App\Http\Requests\Tenant\UpdateSubOrderShippingFeeStatusRequest;
use App\Http\Requests\Tenant\UpdateSubOrderStatusRequest;
use App\Models\OrderItem;
use App\Models\SubOrder;
use App\Models\User;
use App\Notifications\CustomerOrderStatusChanged;
use App\Services\OrderExportService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    private const ORDER_STATUSES = [
        'pending',
        'confirmed',
        'packed',
        'shipped',
        'delivered',
        'cancelled',
        'returned',
    ];

    private const PAID_STATUSES = ['pending', 'paid'];

    public function index(): Response
    {
        $user = request()->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $this->authorize('viewAny', SubOrder::class);
        $filters = $this->filters();
        $orders = $this->ordersQuery($user, $filters)->latest()->paginate(15)->withQueryString();

        return Inertia::render('Tenant/Orders/Index', [
            'orders' => $orders,
            'filters' => $filters,
        ]);
    }

    public function export(): \Symfony\Component\HttpFoundation\Response
    {
        $user = request()->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $this->authorize('viewAny', SubOrder::class);
        $filters = $this->filters();
        $subOrders = $this->ordersQuery($user, $filters)->latest()->get();
        [$headings, $rows] = $this->exportRows($subOrders);
        $subtitle = $this->exportSubtitle($filters);
        $service = new OrderExportService;
        $format = request()->string('format')->trim()->toString();

        if ($format === 'pdf') {
            $content = $service->toPdf('Orders Export', $subtitle, $headings, $rows);
            $mimeType = 'application/pdf';
            $extension = 'pdf';
        } else {
            $content = $service->toXlsx($headings, $rows);
            $mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            $extension = 'xlsx';
        }

        return response($content)
            ->header('Content-Type', $mimeType)
            ->header(
                'Content-Disposition',
                'inline; filename="tenant-orders-'.now()->format('Ymd-His').'.'.$extension.'"',
            );
    }

    public function invoice(SubOrder $subOrder): \Symfony\Component\HttpFoundation\Response
    {
        $this->authorize('view', $subOrder);
        $subOrder->loadMissing([
            'order:id,order_no,customer_id,created_at,shipping_address,payment_method,payment_status',
            'order.customer:id,name,email',
            'branch:id,tenant_id,name,address,city,phone',
            'branch.tenant:id,name,email,phone,logo',
            'items:id,sub_order_id,name,quantity,price',
        ]);
        $order = $subOrder->order;
        $deliveryAreas = $order->shipping_address['delivery_areas'] ?? [];

        if (! is_array($deliveryAreas)) {
            $deliveryAreas = [];
        }

        $branchArea = $deliveryAreas[$subOrder->branch_id] ?? null;

        if (! is_array($branchArea)) {
            $branchArea = [];
        }

        $shippingFee = (float) ($branchArea['cost'] ?? 0);
        $subtotalCents = (int) $subOrder->items->reduce(
            fn (int $carry, OrderItem $item): int => $carry
                + (int) round((float) $item->price * 100) * (int) $item->quantity,
            0,
        );
        $money = fn (float $amount): string => 'Tk '.number_format($amount, 2);
        $shippingPaid = $subOrder->shipping_fee_status === 'paid';
        $items = [];

        foreach ($subOrder->items as $item) {
            $items[] = [
                'name' => strval($item->name),
                'rate' => number_format((float) $item->price, 2, '.', ''),
                'quantity' => (int) $item->quantity,
            ];
        }

        $service = new OrderExportService;
        $logo = $subOrder->branch->tenant->logo ?? null;
        $logoPath = filled($logo) && Storage::disk('public')->exists(strval($logo))
            ? Storage::disk('public')->path(strval($logo))
            : null;
        $content = $service->toInvoicePdf([
            'order_no' => $order->order_no,
            'date' => $order->created_at->format('d/m/Y'),
            'logo_path' => $logoPath,
            'branch_name' => strval($subOrder->branch->name ?? ''),
            'branch_address' => strval($subOrder->branch->address ?? ''),
            'branch_city' => strval($subOrder->branch->city ?? ''),
            'tenant_email' => strval($subOrder->branch->tenant->email ?? ''),
            'branch_phone' => strval($subOrder->branch->phone ?? ''),
            'customer_name' => strval($order->customer->name ?? ''),
            'customer_email' => strval($order->customer->email ?? ''),
            'customer_phone' => strval($order->shipping_address['phone'] ?? 'No contact number'),
            'customer_address' => implode(', ', array_filter([
                $order->shipping_address['address_line'] ?? null,
                $order->shipping_address['division'] ?? $order->shipping_address['city'] ?? null,
                $order->shipping_address['district'] ?? null,
                $order->shipping_address['upazila'] ?? null,
                $order->shipping_address['postal_code'] ?? null,
            ])) ?: 'No delivery address provided',
            'items' => $items,
            'subtotal' => $money($subtotalCents / 100),
            'shipping_fee' => $money($shippingFee),
            'shipping_paid' => $shippingPaid && $shippingFee > 0,
            'total' => $money($subtotalCents / 100 + ($shippingPaid ? 0.0 : $shippingFee)),
            'payment_method' => $order->payment_method === 'cod'
                ? 'Cash on delivery'
                : ucfirst(strval($order->payment_method)),
        ]);

        return response($content)
            ->header('Content-Type', 'application/pdf')
            ->header(
                'Content-Disposition',
                'inline; filename="invoice-'.$order->order_no.'.pdf"',
            );
    }

    /**
     * @return array{search: string, status: string, payment_status: string, shipping_fee_status: string, order_type: string, date_preset: string, date_from: string, date_to: string}
     */
    private function filters(): array
    {
        $data = request()->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string'],
            'payment_status' => ['nullable', 'string'],
            'shipping_fee_status' => ['nullable', 'string'],
            'order_type' => ['nullable', 'in:all,pos,online'],
            'date_preset' => ['nullable', 'in:all,today,custom'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);

        return [
            'search' => trim((string) ($data['search'] ?? '')),
            'status' => in_array($data['status'] ?? '', self::ORDER_STATUSES, true)
                ? (string) $data['status']
                : '',
            'payment_status' => in_array($data['payment_status'] ?? '', self::PAID_STATUSES, true)
                ? (string) $data['payment_status']
                : '',
            'shipping_fee_status' => in_array($data['shipping_fee_status'] ?? '', self::PAID_STATUSES, true)
                ? (string) $data['shipping_fee_status']
                : '',
            'order_type' => (string) ($data['order_type'] ?? 'all'),
            'date_preset' => (string) ($data['date_preset'] ?? 'all'),
            'date_from' => (string) ($data['date_from'] ?? ''),
            'date_to' => (string) ($data['date_to'] ?? ''),
        ];
    }

    /**
     * @param  array{search: string, status: string, payment_status: string, shipping_fee_status: string, order_type: string, date_preset: string, date_from: string, date_to: string}  $filters
     * @return Builder<SubOrder>
     */
    private function ordersQuery(User $user, array $filters): Builder
    {
        return SubOrder::query()
            ->where('tenant_id', $user->tenant_id)
            ->when($user->hasRole('branch-manager'), fn ($query) => $query->where('branch_id', $user->branch_id))
            ->when($filters['status'] !== '', fn ($query) => $query->where('status', $filters['status']))
            ->when($filters['payment_status'] !== '', fn ($query) => $query->whereHas(
                'order',
                fn ($order) => $order->where('payment_status', $filters['payment_status']),
            ))
            ->when($filters['shipping_fee_status'] !== '', fn ($query) => $query->where(
                'shipping_fee_status',
                $filters['shipping_fee_status'],
            ))
            ->when($filters['order_type'] === 'pos', fn ($query) => $query->whereHas(
                'order',
                fn ($order) => $order->where('order_no', 'like', 'POS-%'),
            ))
            ->when($filters['order_type'] === 'online', fn ($query) => $query->whereHas(
                'order',
                fn ($order) => $order->where('order_no', 'not like', 'POS-%'),
            ))
            ->when($filters['date_preset'] === 'today', fn ($query) => $query->whereHas(
                'order',
                fn ($order) => $order->whereDate('created_at', today()->toDateString()),
            ))
            ->when(
                $filters['date_preset'] === 'custom' && $filters['date_from'] !== '',
                fn ($query) => $query->whereHas(
                    'order',
                    fn ($order) => $order->whereDate('created_at', '>=', $filters['date_from']),
                ),
            )
            ->when(
                $filters['date_preset'] === 'custom' && $filters['date_to'] !== '',
                fn ($query) => $query->whereHas(
                    'order',
                    fn ($order) => $order->whereDate('created_at', '<=', $filters['date_to']),
                ),
            )
            ->when($filters['search'] !== '', fn ($query) => $query->whereHas(
                'order',
                fn ($order) => $order->where('order_no', 'like', "%{$filters['search']}%"),
            ))
            ->with([
                'order:id,order_no,customer_id,created_at,shipping_address,payment_method,payment_status',
                'order.customer:id,name,email',
                'branch:id,tenant_id,name,address,city,phone',
                'branch.tenant:id,name,email,phone,logo',
                'items:id,sub_order_id,name,quantity,price',
            ]);
    }

    /**
     * @param  array{search: string, status: string, payment_status: string, shipping_fee_status: string, order_type: string, date_preset: string, date_from: string, date_to: string}  $filters
     */
    private function exportSubtitle(array $filters): string
    {
        $parts = ['Generated '.now()->format('Y-m-d H:i')];

        if ($filters['search'] !== '') {
            $parts[] = 'Search: '.$filters['search'];
        }

        if ($filters['status'] !== '') {
            $parts[] = 'Status: '.$filters['status'];
        }

        if ($filters['payment_status'] !== '') {
            $parts[] = 'Payment: '.$filters['payment_status'];
        }

        if ($filters['shipping_fee_status'] !== '') {
            $parts[] = 'Shipping fee: '.$filters['shipping_fee_status'];
        }

        if ($filters['order_type'] !== 'all') {
            $parts[] = 'Order type: '.strtoupper($filters['order_type']);
        }

        if ($filters['date_preset'] === 'today') {
            $parts[] = 'Date: Today';
        } elseif ($filters['date_preset'] === 'custom') {
            $parts[] = 'Date range: '.($filters['date_from'] ?: 'Any')
                .' to '.($filters['date_to'] ?: 'Any');
        }

        return implode('  |  ', $parts);
    }

    /**
     * @param  Collection<int, SubOrder>  $subOrders
     * @return array{0: list<string>, 1: list<list<string>>}
     */
    private function exportRows(Collection $subOrders): array
    {
        $headings = [
            'Order no',
            'Date',
            'Customer',
            'Branch',
            'Qty',
            'Total',
            'Shipping fee',
            'Grand total',
            'Payment status',
            'Shipping fee status',
            'Order status',
        ];
        $rows = [];
        $quantitySum = 0;
        $totalSum = 0.0;
        $shippingSum = 0.0;

        foreach ($subOrders as $subOrder) {
            $order = $subOrder->order;
            $deliveryAreas = $order->shipping_address['delivery_areas'] ?? [];

            if (! is_array($deliveryAreas)) {
                $deliveryAreas = [];
            }

            $branchArea = $deliveryAreas[$subOrder->branch_id] ?? $deliveryAreas[(string) $subOrder->branch_id] ?? null;

            if (! is_array($branchArea)) {
                $branchArea = [];
            }

            $shippingFee = (float) ($branchArea['cost'] ?? 0);
            $grandTotal = (float) $subOrder->total + $shippingFee;
            $quantity = (int) $subOrder->items->sum('quantity');
            $quantitySum += $quantity;
            $totalSum += (float) $subOrder->total;
            $shippingSum += $shippingFee;

            $rows[] = [
                $order->order_no,
                $order->created_at->format('Y-m-d'),
                $order->customer->name ?? '',
                $subOrder->branch->name ?? '',
                (string) $quantity,
                number_format((float) $subOrder->total, 2, '.', ''),
                number_format($shippingFee, 2, '.', ''),
                number_format($grandTotal, 2, '.', ''),
                strval($order->payment_status ?? ''),
                strval($subOrder->shipping_fee_status ?? ''),
                strval($subOrder->status),
            ];
        }

        if ($rows !== []) {
            $rows[] = [
                'Total orders: '.$subOrders->count(),
                '',
                '',
                '',
                (string) $quantitySum,
                number_format($totalSum, 2, '.', ''),
                number_format($shippingSum, 2, '.', ''),
                number_format($totalSum + $shippingSum, 2, '.', ''),
                '',
                '',
                '',
            ];
        }

        return [$headings, $rows];
    }

    public function updateStatus(UpdateSubOrderStatusRequest $request, SubOrder $subOrder): RedirectResponse
    {
        $this->authorize('update', $subOrder);
        $data = $request->validated();

        DB::transaction(function () use ($request, $subOrder, $data): void {
            $subOrder->update(['status' => $data['status']]);
            $subOrder->trackings()->create([
                'status' => $data['status'],
                'note' => $data['note'] ?? null,
            ]);

            activity('tenant')
                ->causedBy($request->user())
                ->performedOn($subOrder)
                ->withProperties(['status' => $data['status']])
                ->log('Updated sub-order status');
        });

        $subOrder->load('order.customer');
        $subOrder->order->customer->notify(
            new CustomerOrderStatusChanged($subOrder, $data['note'] ?? null),
        );

        return back()->with('success', 'Order status updated and customer notified.');
    }

    public function updatePaymentStatus(
        UpdateOrderPaymentStatusRequest $request,
        SubOrder $subOrder,
    ): RedirectResponse {
        $this->authorize('update', $subOrder);
        $status = $request->validated('status');

        DB::transaction(function () use ($request, $subOrder, $status): void {
            $order = $subOrder->order()->lockForUpdate()->firstOrFail();
            $order->update(['payment_status' => $status]);
            $order->payments()->update(['status' => $status]);

            activity('tenant')
                ->causedBy($request->user())
                ->performedOn($subOrder)
                ->withProperties(['payment_status' => $status])
                ->log('Updated order payment status');
        });

        return back()->with('success', 'Order payment status updated.');
    }

    public function updateShippingFeeStatus(
        UpdateSubOrderShippingFeeStatusRequest $request,
        SubOrder $subOrder,
    ): RedirectResponse {
        $this->authorize('update', $subOrder);
        $status = $request->validated('status');

        DB::transaction(function () use ($request, $subOrder, $status): void {
            $subOrder->update(['shipping_fee_status' => $status]);

            activity('tenant')
                ->causedBy($request->user())
                ->performedOn($subOrder)
                ->withProperties(['shipping_fee_status' => $status])
                ->log('Updated shipping fee status');
        });

        return back()->with('success', 'Shipping fee status updated.');
    }
}
