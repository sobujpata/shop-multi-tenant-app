<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\SubOrder;
use App\Models\User;
use App\Services\PosReceiptService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $this->authorize('viewAny', Branch::class);

        $branches = Branch::query()
            ->where('tenant_id', $user->tenant_id)
            ->where('is_active', true)
            ->when(
                $user->hasAnyRole(['branch-manager', 'sales-man']),
                fn ($query) => $query->whereKey($user->branch_id),
            )
            ->orderBy('name')
            ->get(['id', 'name', 'address', 'is_active']);

        $selectedBranch = $branches->firstWhere('id', (int) $request->query('branch_id'))
            ?? $branches->first();

        if ($selectedBranch === null) {
            return Inertia::render('Tenant/Pos/Index', [
                'branches' => $branches,
                'selectedBranchId' => null,
                'products' => [],
                'categories' => [],
                'brands' => [],
                'lastSale' => null,
            ]);
        }

        $products = $this->branchProducts($user->tenant_id, $selectedBranch->id);
        $categories = collect($products)
            ->map(fn (array $row): array => $row['category'])
            ->unique('id')
            ->sortBy('name')
            ->values();
        $brands = collect($products)
            ->map(fn (array $row): ?array => $row['brand'])
            ->filter()
            ->unique('id')
            ->sortBy('name')
            ->values();

        $lastSale = $request->session()->get('lastSale');
        $request->session()->forget('lastSale');

        return Inertia::render('Tenant/Pos/Index', [
            'branches' => $branches,
            'selectedBranchId' => $selectedBranch->id,
            'products' => $products,
            'categories' => $categories,
            'brands' => $brands,
            'lastSale' => $lastSale,
        ]);
    }

    public function invoices(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $this->authorize('viewAny', Branch::class);

        $branches = Branch::query()
            ->where('tenant_id', $user->tenant_id)
            ->when(
                $user->hasAnyRole(['branch-manager', 'sales-man']),
                fn ($query) => $query->whereKey($user->branch_id),
            )
            ->orderBy('name')
            ->get(['id', 'name']);
        $search = $request->string('search')->trim()->toString();
        $requestedBranchId = $request->integer('branch_id');
        $branchId = $branches->contains('id', $requestedBranchId)
            ? $requestedBranchId
            : null;

        $invoices = SubOrder::query()
            ->where('tenant_id', $user->tenant_id)
            ->when(
                $user->hasAnyRole(['branch-manager', 'sales-man']),
                fn ($query) => $query->where('branch_id', $user->branch_id),
            )
            ->whereHas('order', fn ($query) => $query
                ->where('order_no', 'like', 'POS-%')
                ->when($search !== '', fn ($orderQuery) => $orderQuery->where(
                    fn ($searchQuery) => $searchQuery
                        ->where('order_no', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn ($customerQuery) => $customerQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")),
                )))
            ->when($branchId !== null, fn ($query) => $query->where('branch_id', $branchId))
            ->with([
                'order:id,order_no,customer_id,created_at,total,payment_method',
                'order.customer:id,name,email',
                'branch:id,name',
            ])
            ->withCount('items')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Tenant/Pos/Invoices', [
            'invoices' => $invoices,
            'branches' => $branches,
            'filters' => [
                'search' => $search,
                'branch_id' => $branchId === null ? '' : (string) $branchId,
            ],
        ]);
    }

    public function checkout(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $data = $request->validate([
            'branch_id' => ['required', 'integer'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],
            'payment_method' => ['required', Rule::in(['cod', 'card', 'bkash', 'nagad'])],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $branch = Branch::query()->where('tenant_id', $user->tenant_id)
            ->when(
                $user->hasAnyRole(['branch-manager', 'sales-man']),
                fn ($query) => $query->whereKey($user->branch_id),
            )
            ->whereKey($data['branch_id'])
            ->first();

        if ($branch === null) {
            throw ValidationException::withMessages([
                'branch_id' => 'The selected branch is outside your tenant or assignment.',
            ]);
        }

        [$order, $subOrder] = DB::transaction(function () use ($data, $user, $branch): array {
            $items = [];

            foreach ($data['items'] as $item) {
                $items[] = [
                    'variant_id' => (int) $item['variant_id'],
                    'quantity' => (int) $item['quantity'],
                ];
            }

            $variantIds = collect($items)->pluck('variant_id')->unique();
            $variants = ProductVariant::query()
                ->whereKey($variantIds)
                ->with([
                    'product' => fn ($productQuery) => $productQuery->where('tenant_id', $user->tenant_id),
                    'stocks' => fn ($stockQuery) => $stockQuery->where('branch_id', $branch->id),
                ])
                ->get()
                ->keyBy('id');

            $stockRows = BranchStock::query()
                ->where('branch_id', $branch->id)
                ->whereIn('variant_id', $variantIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('variant_id');

            $subtotalCents = 0;
            $lines = [];

            foreach ($items as $item) {
                $variant = $variants->get($item['variant_id']);

                if (
                    $variant === null
                    || $variant->product === null
                    || (string) $variant->product->tenant_id !== (string) $user->tenant_id
                ) {
                    throw ValidationException::withMessages([
                        'items' => 'One or more items belong to another tenant.',
                    ]);
                }

                $stock = $stockRows->get($variant->id);

                if ($stock === null || $stock->quantity < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => 'Insufficient stock for '.$variant->sku.' at this branch.',
                    ]);
                }

                $unitCents = (int) round((float) ($variant->price ?? $variant->product->sale_price ?? $variant->product->base_price) * 100);
                $lineCents = $unitCents * (int) $item['quantity'];
                $subtotalCents += $lineCents;

                $options = array_filter([(string) $variant->color, (string) $variant->size]);
                $lines[] = [
                    'product' => $variant->product,
                    'variant' => $variant,
                    'name' => $variant->product->name.($options === [] ? '' : ' - '.implode(' / ', $options)),
                    'unit_cents' => $unitCents,
                    'line_cents' => $lineCents,
                    'quantity' => (int) $item['quantity'],
                    'stock' => $stock,
                ];
            }

            $discountCents = (int) round((float) ($data['discount'] ?? 0) * 100);
            $discountCents = max(0, min($discountCents, $subtotalCents));

            $customer = Customer::query()->firstOrCreate(
                ['email' => 'pos-walkin+'.$user->tenant_id.'@pos.local'],
                ['name' => 'Walk-in Customer', 'password' => Str::password(16)],
            );

            $order = Order::query()->create([
                'order_no' => 'POS-'.now()->format('ymd').'-'.Str::upper(Str::random(8)),
                'customer_id' => $customer->id,
                'shipping_address' => [
                    'name' => 'Walk-in Customer',
                    'address' => 'In-store purchase at '.$branch->name,
                ],
                'subtotal' => $subtotalCents / 100,
                'shipping_fee' => 0,
                'discount' => $discountCents / 100,
                'total' => ($subtotalCents - $discountCents) / 100,
                'payment_method' => $data['payment_method'],
                'payment_status' => 'paid',
            ]);

            $subOrder = SubOrder::query()->create([
                'order_id' => $order->id,
                'tenant_id' => $user->tenant_id,
                'branch_id' => $branch->id,
                'total' => ($subtotalCents - $discountCents) / 100,
                'status' => 'delivered',
                'shipping_fee_status' => 'paid',
            ]);

            foreach ($lines as $line) {
                $subOrder->items()->create([
                    'product_id' => $line['product']->id,
                    'variant_id' => $line['variant']->id,
                    'name' => $line['name'],
                    'price' => $line['unit_cents'] / 100,
                    'quantity' => $line['quantity'],
                ]);
                $line['stock']->decrement('quantity', $line['quantity']);
            }

            $subOrder->trackings()->create([
                'status' => 'delivered',
                'note' => 'POS sale completed.',
            ]);

            $paidAmount = (float) ($data['paid_amount'] ?? 0);
            $paymentAmount = $paidAmount > 0 ? $paidAmount : $order->total;

            $order->payments()->create([
                'method' => $data['payment_method'],
                'amount' => $paymentAmount,
                'status' => 'paid',
            ]);

            activity('tenant')
                ->causedBy($user)
                ->performedOn($subOrder)
                ->withProperties(['order_no' => $order->order_no, 'total' => $order->total])
                ->log('Recorded POS sale');

            return [$order, $subOrder];
        });

        return redirect()
            ->route('tenant.pos.index', ['branch_id' => $branch->id])
            ->with('lastSale', [
                'order_no' => $order->order_no,
                'sub_order_id' => $subOrder->id,
                'total' => $order->total,
                'items_count' => (int) $subOrder->items()->count(),
            ]);
    }

    public function invoice(Request $request, SubOrder $subOrder): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $this->authorize('view', $subOrder);
        $subOrder->load([
            'order.customer:id,name,email',
            'order.payments',
            'branch.tenant:id,name,email,phone,logo',
            'items:id,sub_order_id,name,quantity,price',
        ]);

        abort_unless(str_starts_with($subOrder->order->order_no, 'POS-'), 404);

        $paymentAmount = (float) strval(
            $subOrder->order->payments->first()->amount ?? $subOrder->order->total,
        );
        $total = (float) $subOrder->order->total;

        return Inertia::render('Tenant/Pos/Invoice', [
            'invoice' => [
                'order_no' => $subOrder->order->order_no,
                'date' => $subOrder->created_at?->toIso8601String(),
                'store' => [
                    'name' => $subOrder->branch->tenant->name,
                    'email' => $subOrder->branch->tenant->email,
                    'phone' => $subOrder->branch->tenant->phone,
                    'logo' => $subOrder->branch->tenant->logo,
                ],
                'branch' => [
                    'name' => $subOrder->branch->name,
                    'address' => $subOrder->branch->address,
                    'city' => $subOrder->branch->city,
                    'phone' => $subOrder->branch->phone,
                ],
                'customer' => [
                    'name' => $subOrder->order->shipping_address['name']
                        ?? $subOrder->order->customer->name,
                    'email' => $subOrder->order->customer->email,
                    'address' => $subOrder->order->shipping_address['address'] ?? null,
                ],
                'items' => $subOrder->items->map(fn (OrderItem $item): array => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'price' => $item->price,
                    'quantity' => $item->quantity,
                    'total' => number_format((float) $item->price * $item->quantity, 2, '.', ''),
                ])->all(),
                'subtotal' => $subOrder->order->subtotal,
                'discount' => $subOrder->order->discount,
                'total' => $subOrder->order->total,
                'payment_method' => $subOrder->order->payment_method,
                'paid' => number_format($paymentAmount, 2, '.', ''),
                'change' => number_format(max(0, $paymentAmount - $total), 2, '.', ''),
            ],
        ]);
    }

    /**
     * Render a dedicated 80 mm POS receipt for a recorded sale.
     */
    public function receipt(Request $request, SubOrder $subOrder): \Symfony\Component\HttpFoundation\Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $this->authorize('view', $subOrder);

        $subOrder->load([
            'items',
            'branch',
            'order.payments',
        ]);

        $paymentLabel = match (strval($subOrder->order->payment_method)) {
            'cod' => 'Cash',
            'card' => 'Card',
            'bkash' => 'bKash',
            default => 'Nagad',
        };

        $paymentAmount = (float) strval($subOrder->order->payments->first()->amount ?? $subOrder->order->total);
        $orderTotal = (float) $subOrder->order->total;

        $content = (new PosReceiptService)->toReceiptPdf([
            'store_name' => strval($subOrder->branch->tenant->name ?? 'Sale Receipt'),
            'branch_name' => strval($subOrder->branch->name),
            'cashier' => $user->name,
            'order_no' => strval($subOrder->order->order_no),
            'date' => $subOrder->created_at?->format('M d, Y H:i') ?? now()->format('M d, Y H:i'),
            'payment_label' => $paymentLabel,
            'items' => $subOrder->items
                ->map(fn (OrderItem $item): array => [
                    'name' => strval($item->name),
                    'price' => number_format((float) $item->price, 2),
                    'quantity' => (int) $item->quantity,
                    'total' => number_format((float) $item->price * $item->quantity, 2),
                ])
                ->values()
                ->all(),
            'subtotal' => number_format((float) $subOrder->order->subtotal, 2),
            'discount' => number_format((float) $subOrder->order->discount, 2),
            'total' => number_format($orderTotal, 2),
            'paid' => number_format($paymentAmount, 2),
            'change' => number_format(max(0, $paymentAmount - $orderTotal), 2),
        ]);

        return response($content)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="receipt-'.$subOrder->order->order_no.'.pdf"');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function branchProducts(int $tenantId, int $branchId): array
    {
        $products = DB::table('products')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->leftJoin('brands', 'brands.id', '=', 'products.brand_id')
            ->where('products.tenant_id', $tenantId)
            ->where('products.is_active', true)
            ->orderBy('products.name')
            ->get([
                'products.id',
                'products.name',
                'products.base_price',
                'products.sale_price',
                'products.category_id',
                'categories.name as category_name',
                'products.brand_id',
                'brands.name as brand_name',
            ]);

        if ($products->isEmpty()) {
            return [];
        }

        $images = DB::table('product_images')
            ->whereIn('product_id', $products->pluck('id'))
            ->where('is_primary', true)
            ->pluck('path', 'product_id');

        $variants = DB::table('product_variants')
            ->leftJoin('branch_stocks', function ($join) use ($branchId): void {
                $join->on('branch_stocks.variant_id', '=', 'product_variants.id')
                    ->where('branch_stocks.branch_id', $branchId);
            })
            ->whereIn('product_variants.product_id', $products->pluck('id'))
            ->orderBy('product_variants.id')
            ->get([
                'product_variants.id',
                'product_variants.product_id',
                'product_variants.sku',
                'product_variants.barcode_code',
                'product_variants.size',
                'product_variants.color',
                'product_variants.price',
                DB::raw('COALESCE(branch_stocks.quantity, 0) as quantity'),
            ]);

        return $products->map(function ($product) use ($variants, $images): array {
            $variantRows = $variants
                ->where('product_id', $product->id)
                ->values()
                ->map(fn ($variant): array => [
                    'id' => (int) $variant->id,
                    'sku' => (string) $variant->sku,
                    'barcode' => (string) $variant->barcode_code,
                    'label' => trim(implode(' / ', array_filter([(string) $variant->color, (string) $variant->size]))),
                    'price' => $variant->price !== null ? (float) $variant->price : (float) $product->sale_price,
                    'stock' => (int) $variant->quantity,
                ])->values()->all();

            return [
                'id' => (int) $product->id,
                'name' => (string) $product->name,
                'price' => $product->sale_price !== null ? (float) $product->sale_price : (float) $product->base_price,
                'image' => $images->get($product->id) !== null ? (string) $images->get($product->id) : null,
                'category' => ['id' => (int) $product->category_id, 'name' => (string) $product->category_name],
                'brand' => $product->brand_id !== null
                    ? ['id' => (int) $product->brand_id, 'name' => (string) $product->brand_name]
                    : null,
                'variants' => $variantRows,
            ];
        })->values()->all();
    }
}
