import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Check,
    Minus,
    Plus,
    Printer,
    ScanLine,
    Search,
    ShoppingBag,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AdminPage, Panel } from '@/components/super-admin/admin-page';
import { imageUrl, money } from '@/components/storefront/types';

type PosVariant = {
    id: number;
    sku: string;
    barcode: string;
    label: string;
    price: number;
    stock: number;
};

type PosProduct = {
    id: number;
    name: string;
    price: number;
    image: string | null;
    category: { id: number; name: string };
    brand: { id: number; name: string } | null;
    variants: PosVariant[];
};

type BranchOption = {
    id: number;
    name: string;
};

type LastSale = {
    order_no: string;
    sub_order_id: number;
    total: string;
    items_count: number;
};

type CartLine = {
    product: PosProduct;
    variant: PosVariant;
    quantity: number;
};

type CheckoutForm = {
    branch_id: number | null;
    items: Array<{ variant_id: number; quantity: number }>;
    payment_method: 'cod' | 'card' | 'bkash' | 'nagad';
    discount: string;
    paid_amount: string;
};

const PAYMENT_METHODS: Array<{
    value: CheckoutForm['payment_method'];
    label: string;
}> = [
    { value: 'cod', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'bkash', label: 'bKash' },
    { value: 'nagad', label: 'Nagad' },
];

export default function PosIndex({
    branches,
    selectedBranchId,
    products,
    categories,
    brands,
    lastSale,
}: {
    branches: BranchOption[];
    selectedBranchId: number | null;
    products: PosProduct[];
    categories: Array<{ id: number; name: string }>;
    brands: Array<{ id: number; name: string }>;
    lastSale: LastSale | null;
}) {
    const auth = usePage().props.auth as { roles: string[] };
    const isTenantAdmin = auth.roles.includes('tenant-admin');

    const [barcodeSearch, setBarcodeSearch] = useState('');
    const [nameSearch, setNameSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [cart, setCart] = useState<Record<number, CartLine>>({});

    const form = useForm<CheckoutForm>({
        branch_id: selectedBranchId,
        items: [],
        payment_method: 'cod',
        discount: '',
        paid_amount: '',
    });

    const cartLines = useMemo(
        () => Object.values(cart).sort((a, b) => a.variant.id - b.variant.id),
        [cart],
    );

    const subtotal = cartLines.reduce(
        (total, line) =>
            total + Math.round(line.variant.price * 100) * line.quantity,
        0,
    );
    const discountCents = Math.max(
        0,
        Math.min(Math.round(Number(form.data.discount || 0) * 100), subtotal),
    );
    const total = subtotal - discountCents;
    const paidCents = Math.round(
        Number(form.data.paid_amount === '' ? 0 : form.data.paid_amount) * 100,
    );
    const validPaid = paidCents > 0;
    const changeCents = validPaid && paidCents > total ? paidCents - total : 0;
    const dueCents = validPaid && paidCents < total ? total - paidCents : 0;

    const visibleProducts = useMemo(
        () =>
            products.filter((product) => {
                const barcodeQuery = barcodeSearch.trim().toLowerCase();

                if (
                    barcodeQuery !== '' &&
                    !product.variants.some((variant) =>
                        variant.barcode.toLowerCase().includes(barcodeQuery),
                    )
                ) {
                    return false;
                }

                const nameQuery = nameSearch.trim().toLowerCase();

                if (
                    nameQuery !== '' &&
                    !product.name.toLowerCase().includes(nameQuery) &&
                    !product.variants.some((variant) =>
                        variant.sku.toLowerCase().includes(nameQuery),
                    )
                ) {
                    return false;
                }

                if (
                    categoryId !== '' &&
                    product.category.id !== Number(categoryId)
                ) {
                    return false;
                }
                if (brandId !== '' && product.brand?.id !== Number(brandId)) {
                    return false;
                }
                return true;
            }),
        [products, barcodeSearch, nameSearch, categoryId, brandId],
    );

    function addToCart(product: PosProduct, variant: PosVariant): void {
        if (variant.stock <= 0) {
            return;
        }

        setCart((previous) => {
            const existing = previous[variant.id];
            const quantity = Math.min(
                (existing?.quantity ?? 0) + 1,
                variant.stock,
            );

            if (existing && existing.quantity + 1 > variant.stock) {
                return previous;
            }

            return {
                ...previous,
                [variant.id]: { product, variant, quantity },
            };
        });
    }

    function addToCartDefault(product: PosProduct): void {
        const variant = product.variants.find(
            (candidate) => candidate.stock > 0,
        );

        if (variant) {
            addToCart(product, variant);
        }
    }

    function updateQuantity(variantId: number, change: number): void {
        setCart((previous) => {
            const line = previous[variantId];

            if (line === undefined) {
                return previous;
            }

            const quantity = Math.max(
                1,
                Math.min(line.quantity + change, line.variant.stock),
            );

            return { ...previous, [variantId]: { ...line, quantity } };
        });
    }

    function removeFromCart(variantId: number): void {
        setCart((previous) => {
            const next = { ...previous };
            delete next[variantId];
            return next;
        });
    }

    function autoAddByBarcode(value: string): void {
        const query = value.trim().toLowerCase();

        if (query === '') {
            return;
        }

        for (const product of products) {
            const variant = product.variants.find(
                (candidate) => candidate.barcode.toLowerCase() === query,
            );

            if (variant && variant.stock > 0) {
                addToCart(product, variant);
                setBarcodeSearch('');

                return;
            }
        }
    }

    function onBarcodeInput(value: string): void {
        setBarcodeSearch(value);
        autoAddByBarcode(value);
    }

    function handleBarcodeKeyDown(key: string): void {
        if (key !== 'Enter') {
            return;
        }

        const query = barcodeSearch.trim().toLowerCase();

        if (query === '') {
            return;
        }

        for (const product of products) {
            const variant = product.variants.find(
                (candidate) => candidate.barcode.toLowerCase() === query,
            );

            if (variant && variant.stock > 0) {
                addToCart(product, variant);
                setBarcodeSearch('');

                return;
            }
        }
    }

    function changeBranch(branchId: number): void {
        setCart({});
        setBarcodeSearch('');
        setNameSearch('');

        router.get(
            '/tenant/pos',
            { branch_id: branchId },
            { preserveState: true, preserveScroll: true },
        );
    }

    function submitCheckout(event: FormEvent): void {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            branch_id: selectedBranchId,
            items: cartLines.map((line) => ({
                variant_id: line.variant.id,
                quantity: line.quantity,
            })),
            discount: form.data.discount === '' ? '0' : form.data.discount,
            paid_amount:
                form.data.paid_amount === '' ? null : form.data.paid_amount,
        }));
        form.post('/tenant/pos/checkout', {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setCart({});
                setBarcodeSearch('');
                setNameSearch('');
                form.reset('paid_amount');
            },
        });
    }

    return (
        <>
            <Head title="POS" />
            <AdminPage
                title="POS"
                description="Ring up in-store sales, scan barcodes, and keep branch stock live."
            >
                {lastSale && (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                        <Check className="size-5 shrink-0" />
                        <span className="flex-1">
                            Sale <strong>{lastSale.order_no}</strong> recorded —{' '}
                            {lastSale.items_count} item(s), total{' '}
                            <strong>{money(lastSale.total)}</strong>.
                        </span>
                        <a
                            href={`/tenant/pos/${lastSale.sub_order_id}/invoice`}
                            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100 dark:hover:bg-emerald-900"
                        >
                            <Printer className="size-4" />
                            View invoice
                        </a>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-4">
                        <Panel>
                            <div className="space-y-3 border-b border-slate-200 p-4 dark:border-slate-800">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="relative">
                                        <ScanLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={barcodeSearch}
                                            onChange={(event) =>
                                                onBarcodeInput(
                                                    event.target.value,
                                                )
                                            }
                                            onKeyDown={(event) =>
                                                handleBarcodeKeyDown(event.key)
                                            }
                                            autoFocus
                                            placeholder="Scan barcode code"
                                            aria-label="Barcode code search"
                                            className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-3 pl-9 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={nameSearch}
                                            onChange={(event) =>
                                                setNameSearch(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Search product name or SKU"
                                            aria-label="Product name search"
                                            className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-3 pl-9 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <select
                                        aria-label="Filter products by category"
                                        value={categoryId}
                                        onChange={(event) =>
                                            setCategoryId(event.target.value)
                                        }
                                        className="h-10 min-w-36 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                                    >
                                        <option value="">All categories</option>
                                        {categories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        aria-label="Filter products by brand"
                                        value={brandId}
                                        onChange={(event) =>
                                            setBrandId(event.target.value)
                                        }
                                        className="h-10 min-w-36 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                                    >
                                        <option value="">All brands</option>
                                        {brands.map((brand) => (
                                            <option
                                                key={brand.id}
                                                value={brand.id}
                                            >
                                                {brand.name}
                                            </option>
                                        ))}
                                    </select>
                                    {isTenantAdmin && (
                                        <select
                                            aria-label="Select branch"
                                            value={selectedBranchId ?? ''}
                                            onChange={(event) =>
                                                changeBranch(
                                                    Number(event.target.value),
                                                )
                                            }
                                            className="h-10 min-w-40 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 sm:ml-auto dark:border-slate-700 dark:bg-slate-950"
                                        >
                                            {branches.map((branch) => (
                                                <option
                                                    key={branch.id}
                                                    value={branch.id}
                                                >
                                                    {branch.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {!isTenantAdmin && (
                                        <span className="h-10 min-w-40 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:ml-auto dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                                            {branches[0]?.name ?? 'No branch'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                {visibleProducts.map((product) => {
                                    const totalStock = product.variants.reduce(
                                        (stock, variant) =>
                                            stock + variant.stock,
                                        0,
                                    );
                                    const isOutOfStock = totalStock <= 0;

                                    return (
                                        <div
                                            key={product.id}
                                            className={`flex flex-col overflow-hidden rounded-xl border bg-white transition ${isOutOfStock ? 'border-slate-200 opacity-75 dark:border-slate-700' : 'border-slate-200 hover:border-indigo-400'} dark:bg-slate-950`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addToCartDefault(product)
                                                }
                                                disabled={isOutOfStock}
                                                className="relative flex h-28 items-center justify-center bg-slate-100 disabled:cursor-not-allowed dark:bg-slate-900"
                                                aria-label={`Add ${product.name} to cart`}
                                            >
                                                {product.image ? (
                                                    <img
                                                        src={
                                                            imageUrl(
                                                                product.image,
                                                            ) ?? ''
                                                        }
                                                        alt={product.name}
                                                        className="max-h-28 w-full object-contain"
                                                    />
                                                ) : (
                                                    <ShoppingBag className="size-8 text-slate-300 dark:text-slate-700" />
                                                )}
                                                <span
                                                    className={
                                                        isOutOfStock
                                                            ? 'absolute top-1.5 right-1.5 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300'
                                                            : 'absolute top-1.5 right-1.5 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                    }
                                                >
                                                    {isOutOfStock
                                                        ? 'Out of stock'
                                                        : `${totalStock} in stock`}
                                                </span>
                                            </button>
                                            <div className="flex flex-1 flex-col gap-1 p-2.5">
                                                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    {product.name}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                                        {money(product.price)}
                                                    </span>
                                                    {product.brand && (
                                                        <span className="truncate text-xs text-slate-400">
                                                            {product.brand.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {product.variants.map(
                                                        (variant) => (
                                                            <button
                                                                key={variant.id}
                                                                type="button"
                                                                onClick={() =>
                                                                    addToCart(
                                                                        product,
                                                                        variant,
                                                                    )
                                                                }
                                                                disabled={
                                                                    variant.stock <=
                                                                    0
                                                                }
                                                                title={`${variant.barcode} · ${variant.sku} — ${money(variant.price)} (${variant.stock} in stock)`}
                                                                className={
                                                                    variant.stock <=
                                                                    0
                                                                        ? 'cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-400 line-through dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600'
                                                                        : 'rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-indigo-400'
                                                                }
                                                            >
                                                                {variant.label ||
                                                                    variant.sku}{' '}
                                                                ·{' '}
                                                                {variant.stock}
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {visibleProducts.length === 0 && (
                                    <div className="col-span-full flex flex-col items-center gap-2 py-12 text-sm text-slate-500">
                                        <Search className="size-6 text-slate-400" />
                                        No products match your search or
                                        filters.
                                    </div>
                                )}
                            </div>
                        </Panel>
                    </div>

                    <div className="h-fit">
                        <Panel>
                            <form
                                onSubmit={submitCheckout}
                                className="flex flex-col gap-4 p-4"
                            >
                                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                                    <h2 className="text-sm font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400">
                                        Cart ({cartLines.length})
                                    </h2>
                                </div>

                                {form.errors.items && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        {form.errors.items}
                                    </p>
                                )}

                                <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
                                    {cartLines.map((line) => (
                                        <div
                                            key={line.variant.id}
                                            className="flex flex-col gap-1 rounded-lg border border-slate-200 p-2.5 dark:border-slate-700"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                                        {line.product.name}
                                                    </p>
                                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                        {line.variant.label ||
                                                            line.variant
                                                                .sku}{' '}
                                                        · {line.variant.sku}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeFromCart(
                                                            line.variant.id,
                                                        )
                                                    }
                                                    aria-label="Remove item"
                                                    className="text-slate-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                line.variant.id,
                                                                -1,
                                                            )
                                                        }
                                                        className="rounded-md border border-slate-300 p-1 text-slate-600 hover:border-indigo-500 dark:border-slate-700 dark:text-slate-300"
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus className="size-3.5" />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-medium">
                                                        {line.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                line.variant.id,
                                                                1,
                                                            )
                                                        }
                                                        className="rounded-md border border-slate-300 p-1 text-slate-600 hover:border-indigo-500 dark:border-slate-700 dark:text-slate-300"
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus className="size-3.5" />
                                                    </button>
                                                </div>
                                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    {money(
                                                        (Math.round(
                                                            line.variant.price *
                                                                100,
                                                        ) *
                                                            line.quantity) /
                                                            100,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {cartLines.length === 0 && (
                                        <p className="py-6 text-center text-sm text-slate-500">
                                            Cart is empty. Tap a product card or
                                            scan a SKU.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2 border-t border-slate-200 pt-3 text-sm dark:border-slate-800">
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>Subtotal</span>
                                        <span>{money(subtotal / 100)}</span>
                                    </div>
                                    <label className="flex items-center justify-between gap-3">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            Discount
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={form.data.discount}
                                            onChange={(event) =>
                                                form.setData(
                                                    'discount',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="0.00"
                                            className="h-9 w-28 rounded-lg border border-slate-300 bg-white px-2 text-right text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                                        />
                                    </label>
                                    <div className="flex justify-between text-base font-bold text-slate-900 dark:text-slate-100">
                                        <span>Total</span>
                                        <span>{money(total / 100)}</span>
                                    </div>
                                </div>

                                <label className="block space-y-1 text-sm">
                                    <span className="font-medium">Payment</span>
                                    <select
                                        value={form.data.payment_method}
                                        onChange={(event) =>
                                            form.setData(
                                                'payment_method',
                                                event.target
                                                    .value as CheckoutForm['payment_method'],
                                            )
                                        }
                                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                                    >
                                        {PAYMENT_METHODS.map((method) => (
                                            <option
                                                key={method.value}
                                                value={method.value}
                                            >
                                                {method.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                {form.errors.discount && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        {form.errors.discount}
                                    </p>
                                )}

                                <div className="space-y-2 text-sm">
                                    <label className="block space-y-1">
                                        <span className="font-medium">
                                            Paid amount
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={form.data.paid_amount}
                                            onChange={(event) =>
                                                form.setData(
                                                    'paid_amount',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={(total / 100).toFixed(
                                                2,
                                            )}
                                            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-right text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                                        />
                                    </label>
                                    {changeCents > 0 && (
                                        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                            <span>Change to return</span>
                                            <span>
                                                {money(changeCents / 100)}
                                            </span>
                                        </div>
                                    )}
                                    {dueCents > 0 && (
                                        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                            <span>Remaining due</span>
                                            <span>{money(dueCents / 100)}</span>
                                        </div>
                                    )}
                                </div>

                                {form.errors.paid_amount && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        {form.errors.paid_amount}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={
                                        form.processing ||
                                        cartLines.length === 0
                                    }
                                    className="flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing ? (
                                        'Processing…'
                                    ) : (
                                        <>
                                            <ShoppingBag className="size-4" />
                                            Record sale ({money(total / 100)})
                                        </>
                                    )}
                                </button>
                            </form>
                        </Panel>
                    </div>
                </div>
            </AdminPage>
        </>
    );
}
