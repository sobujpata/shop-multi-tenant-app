<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UpdateStockRequest;
use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\BarcodeLabelService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    public function index(): Response
    {
        $user = request()->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $branches = Branch::query()
            ->where('tenant_id', $user->tenant_id)
            ->when($user->hasRole('branch-manager'), fn ($query) => $query->whereKey($user->branch_id))
            ->orderBy('name')
            ->get(['id', 'name']);

        $variants = ProductVariant::query()
            ->whereHas('product', fn ($query) => $query->where('tenant_id', $user->tenant_id))
            ->with([
                'product:id,name',
                'stocks' => fn ($query) => $query->whereIn('branch_id', $branches->pluck('id')),
            ])
            ->orderBy('sku')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Tenant/Stock/Index', [
            'branches' => $branches,
            'variants' => $variants,
            'canManage' => $user->hasAnyRole(['tenant-admin', 'branch-manager']),
        ]);
    }

    /**
     * Render printable CODE 39 barcode label sheets for a single branch.
     * Paper format, label size and content lines are query-configurable.
     */
    public function labels(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $data = $request->validate([
            'branch_id' => ['required', 'integer'],
            'paper' => ['nullable', 'in:a4,a5,letter,thermal'],
            'size' => ['nullable', 'in:50x25,40x30,38x21,38x19,57x50,57x40,56x38,56x30,custom'],
            'width' => ['nullable', 'numeric', 'min:10', 'max:250'],
            'height' => ['nullable', 'numeric', 'min:10', 'max:180'],
            'show' => ['nullable', 'array'],
            'show.*' => ['nullable', 'string', Rule::in(BarcodeLabelService::CONTENT_OPTIONS)],
            'variant_ids' => ['nullable', 'array'],
            'variant_ids.*' => ['integer'],
        ]);

        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $branch = Branch::query()->where('tenant_id', $user->tenant_id)
            ->when($user->hasRole('branch-manager'), fn ($query) => $query->whereKey($user->branch_id))
            ->whereKey($data['branch_id'])
            ->first();

        if ($branch === null) {
            abort(404, 'The selected branch is outside your tenant or assignment.');
        }

        $variants = ProductVariant::query()
            ->whereHas('product', fn ($query) => $query
                ->where('tenant_id', $user->tenant_id)
                ->where('is_active', true))
            ->with(['product:id,name,sale_price,base_price'])
            ->orderBy('sku')
            ->when(count($data['variant_ids'] ?? []) > 0, fn ($query) => $query->whereKey($data['variant_ids']))
            ->get();

        $labels = $variants->map(fn (ProductVariant $variant): array => [
            'branch' => strval($branch->name),
            'name' => strval($variant->product->name),
            'size' => strval($variant->size),
            'sku' => strval($variant->sku),
            'barcode' => strval($variant->barcode_code),
            'price' => number_format((float) ($variant->price ?? $variant->product->sale_price ?? $variant->product->base_price), 2),
            'regular_price' => number_format((float) $variant->product->base_price, 2),
        ])->values()->all();

        // Individual product prints loop to fill exactly one full page for
        // the chosen paper + label size combination; thermal paper already
        // prints each sticker on its own exact-size page, so it stays as-is.
        if (count($data['variant_ids'] ?? []) > 0 && ($data['paper'] ?? 'a4') !== 'thermal') {
            $copies = BarcodeLabelService::labelsPerPage(
                strval($data['paper'] ?? 'a4'),
                strval($data['size'] ?? '50x25'),
                floatval($data['width'] ?? 0.0),
                floatval($data['height'] ?? 0.0),
            );

            $labels = array_merge(...array_map(
                static fn (array $label): array => array_fill(0, $copies, $label),
                $labels,
            ));
        }

        $content = (new BarcodeLabelService)->toLabelPdf(
            $labels,
            strval($data['paper'] ?? 'a4'),
            strval($data['size'] ?? '50x25'),
            array_values(array_filter($data['show'] ?? BarcodeLabelService::DEFAULT_CONTENT)),
            floatval($data['width'] ?? 0.0),
            floatval($data['height'] ?? 0.0),
        );

        return response($content)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="labels-'.str($branch->name)->slug().'.pdf"');
    }

    public function update(UpdateStockRequest $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $rows = $request->validated('stocks');

        DB::transaction(function () use ($rows, $user): void {
            foreach ($rows as $row) {
                $branch = Branch::query()->where('tenant_id', $user->tenant_id)
                    ->whereKey($row['branch_id'])
                    ->first();
                $variant = ProductVariant::query()
                    ->whereHas('product', fn ($query) => $query->where('tenant_id', $user->tenant_id))
                    ->whereKey($row['variant_id'])
                    ->first();

                if (
                    $branch === null
                    || $variant === null
                ) {
                    throw ValidationException::withMessages([
                        'stocks' => 'One or more stock rows are outside your assigned tenant or branch.',
                    ]);
                }
                $this->authorize('view', $branch);

                $stock = BranchStock::query()->updateOrCreate(
                    [
                        'branch_id' => $branch->id,
                        'variant_id' => $variant->id,
                    ],
                    ['quantity' => $row['quantity']],
                );

                activity('tenant')
                    ->causedBy($user)
                    ->performedOn($stock)
                    ->withProperties(['quantity' => $row['quantity']])
                    ->log('Updated branch stock');
            }
        });

        return back()->with('success', 'Stock quantities updated.');
    }
}
