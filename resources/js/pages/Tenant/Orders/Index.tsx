import { Head, router, useForm } from '@inertiajs/react';
import {
    Eye,
    FileSpreadsheet,
    FileText,
    Printer,
    RotateCcw,
    Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    AdminPage,
    Pagination,
    Panel,
    SearchForm,
    StatusBadge,
} from '@/components/super-admin/admin-page';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { imageUrl } from '@/components/storefront/types';

type OrderItem = { id: number; name: string; quantity: number; price: string };
type ShippingAddress = {
    recipient_name?: string;
    phone?: string;
    address_line?: string;
    division?: string;
    city?: string;
    district?: string;
    upazila?: string | null;
    postal_code?: string | null;
    delivery_areas?: Record<string, { area?: string; cost?: string | number }>;
};
type OrderRow = {
    id: number;
    total: string;
    status: string;
    shipping_fee_status: 'pending' | 'paid';
    branch: {
        id: number;
        name: string;
        address: string;
        city: string;
        phone: string;
        tenant: {
            name: string;
            email: string;
            phone: string | null;
            logo: string | null;
        };
    };
    order: {
        order_no: string;
        created_at: string;
        customer: { name: string; email: string };
        shipping_address: ShippingAddress;
        payment_method: string;
        payment_status: string;
    };
    items: OrderItem[];
};
type Paginated<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

const ORDER_STATUSES = [
    'pending',
    'confirmed',
    'packed',
    'shipped',
    'delivered',
    'cancelled',
    'returned',
];

function formatCurrency(value: string | number): string {
    return `Tk ${Number(value).toFixed(2)}`;
}

function formatPaymentMethod(method: string): string {
    return method === 'cod'
        ? 'Cash on delivery'
        : method.charAt(0).toUpperCase() + method.slice(1);
}

function getBranchShippingFee(order: OrderRow): number {
    const fee = Number(
        order.order.shipping_address.delivery_areas?.[
            order.branch.id.toString()
        ]?.cost ?? 0,
    );

    return Number.isFinite(fee) ? fee : 0;
}

function PaymentStatusBadge({ paid }: { paid: boolean }) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                paid
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
        >
            {paid ? 'Paid' : 'Unpaid'}
        </span>
    );
}

function PaymentStatusForm({
    order,
    status,
    endpoint,
    onClose,
}: {
    order: OrderRow;
    status: 'pending' | 'paid';
    endpoint: 'payment-status' | 'shipping-fee-status';
    onClose: () => void;
}) {
    const form = useForm({ status });

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                form.patch(`/tenant/orders/${order.id}/${endpoint}`, {
                    preserveScroll: true,
                    onSuccess: onClose,
                });
            }}
            className="flex flex-col gap-4"
        >
            <label className="flex flex-col gap-2 text-sm font-medium">
                {endpoint === 'payment-status'
                    ? 'Payment status'
                    : 'Shipping fee status'}
                <select
                    value={form.data.status}
                    onChange={(event) =>
                        form.setData(
                            'status',
                            event.target.value === 'paid' ? 'paid' : 'pending',
                        )
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-950"
                >
                    <option value="pending">Unpaid</option>
                    <option value="paid">Paid</option>
                </select>
            </label>
            {form.errors.status && (
                <span className="text-xs text-red-600">
                    {form.errors.status}
                </span>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={form.processing}
                    className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-medium dark:border-slate-700"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={form.processing || form.data.status === status}
                    className="h-9 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                    Update
                </button>
            </div>
        </form>
    );
}

const CODE39_PATTERNS: Record<string, string> = {
    '0': 'nnnwwnwnn',
    '1': 'wnnwnnnnw',
    '2': 'nnwwnnnnw',
    '3': 'wnwwnnnnn',
    '4': 'nnnwwnnnw',
    '5': 'wnnwwnnnn',
    '6': 'nnwwwnnnn',
    '7': 'nnnwnnwnw',
    '8': 'wnnwnnwnn',
    '9': 'nnwwnnwnn',
    A: 'wnnnnwnnw',
    B: 'nnwnnwnnw',
    C: 'wnwnnwnnn',
    D: 'nnnnwwnnw',
    E: 'wnnnwwnnn',
    F: 'nnwnwwnnn',
    G: 'nnnnnwwnw',
    H: 'wnnnnwwnn',
    I: 'nnwnnwwnn',
    J: 'nnnnwwwnn',
    K: 'wnnnnnnww',
    L: 'nnwnnnnww',
    M: 'wnwnnnnwn',
    N: 'nnnnwnnww',
    O: 'wnnnwnnwn',
    P: 'nnwnwnnwn',
    Q: 'nnnnnnwwn',
    R: 'wnnnnnwwn',
    S: 'nnwnnnwwn',
    T: 'nnnnwnwwn',
    U: 'wwnnnnnnw',
    V: 'nwwnnnnnw',
    W: 'wwwnnnnnn',
    X: 'nwnnwnnnw',
    Y: 'wwnnwnnnn',
    Z: 'nwwnwnnnn',
    '-': 'nwnnnnwnw',
    '.': 'wwnnnwnnn',
    ' ': 'nwwnnnwnn',
    $: 'nwnwnwnnn',
    '/': 'nwnwnnnwn',
    '+': 'nwnnnwnwn',
    '%': 'nnnwnwnwn',
    '*': 'nwnnwnwnn',
};

function OrderBarcode({ value }: { value: string }) {
    const characters = `*${value.toUpperCase()}*`;
    const bars: Array<{ x: number; width: number }> = [];
    let position = 0;

    for (const [characterIndex, character] of Array.from(
        characters,
    ).entries()) {
        const pattern = CODE39_PATTERNS[character];

        if (!pattern) {
            return null;
        }

        for (const [elementIndex, width] of Array.from(pattern).entries()) {
            const elementWidth = width === 'w' ? 3 : 1;

            if (elementIndex % 2 === 0) {
                bars.push({ x: position, width: elementWidth });
            }

            position += elementWidth;
        }

        if (characterIndex < characters.length - 1) {
            position += 1;
        }
    }

    return (
        <svg
            role="img"
            aria-label={`Barcode for invoice ${value}`}
            viewBox={`0 0 ${position} 36`}
            preserveAspectRatio="none"
            className="mt-2 h-9 w-full"
        >
            {bars.map((bar, index) => (
                <rect
                    key={index}
                    x={bar.x}
                    y="0"
                    width={bar.width}
                    height="36"
                    fill="currentColor"
                />
            ))}
        </svg>
    );
}

function OrderStatusForm({
    order,
    onClose,
}: {
    order: OrderRow;
    onClose: () => void;
}) {
    const form = useForm({ status: order.status, note: '' });
    const statuses = [
        'pending',
        'confirmed',
        'packed',
        'shipped',
        'delivered',
        'cancelled',
        'returned',
    ];

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                form.patch(`/tenant/orders/${order.id}/status`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        form.setData('note', '');
                        onClose();
                    },
                });
            }}
            className="flex min-w-72 flex-col gap-2"
        >
            <div>
                <select
                    value={form.data.status}
                    onChange={(event) =>
                        form.setData('status', event.target.value)
                    }
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs capitalize dark:border-slate-700 dark:bg-slate-950"
                >
                    {statuses.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
            </div>
            <input
                value={form.data.note}
                onChange={(event) => form.setData('note', event.target.value)}
                placeholder="Optional note for customer"
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            {form.errors.status && (
                <span className="text-xs text-red-600">
                    {form.errors.status}
                </span>
            )}
            <div className="mt-3 flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={form.processing}
                    className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-medium dark:border-slate-700"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={
                        form.processing || form.data.status === order.status
                    }
                    className="h-9 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                    Update
                </button>
            </div>
        </form>
    );
}

export default function OrdersIndex({
    orders,
    filters,
}: {
    orders: Paginated<OrderRow>;
    filters: {
        search: string;
        status: string;
        payment_status: string;
        shipping_fee_status: string;
        order_type: string;
        date_preset: string;
        date_from: string;
        date_to: string;
    };
}) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status);
    const [shippingFeeStatus, setShippingFeeStatus] = useState(
        filters.shipping_fee_status,
    );
    const [orderType, setOrderType] = useState(filters.order_type);
    const [datePreset, setDatePreset] = useState(filters.date_preset);
    const [dateFrom, setDateFrom] = useState(filters.date_from);
    const [dateTo, setDateTo] = useState(filters.date_to);
    const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
    const [statusOrder, setStatusOrder] = useState<OrderRow | null>(null);
    const [paymentOrder, setPaymentOrder] = useState<OrderRow | null>(null);
    const [shippingFeeOrder, setShippingFeeOrder] = useState<OrderRow | null>(
        null,
    );

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(
                '/tenant/orders',
                {
                    search,
                    status,
                    payment_status: paymentStatus,
                    shipping_fee_status: shippingFeeStatus,
                    order_type: orderType,
                    date_preset: datePreset,
                    date_from: dateFrom,
                    date_to: dateTo,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [
        search,
        status,
        paymentStatus,
        shippingFeeStatus,
        orderType,
        datePreset,
        dateFrom,
        dateTo,
    ]);

    const invoiceSubtotal =
        selectedOrder?.items.reduce(
            (subtotal, item) =>
                subtotal + Math.round(Number(item.price) * 100) * item.quantity,
            0,
        ) ?? 0;

    function exportHref(format: 'xlsx' | 'pdf'): string {
        const params = new URLSearchParams({
            search,
            status,
            payment_status: paymentStatus,
            shipping_fee_status: shippingFeeStatus,
            order_type: orderType,
            date_preset: datePreset,
            date_from: dateFrom,
            date_to: dateTo,
            format,
        });

        return `/tenant/orders/export?${params.toString()}`;
    }

    const branchLogo = selectedOrder
        ? imageUrl(selectedOrder.branch.tenant.logo)
        : null;
    const branchShippingFee = selectedOrder
        ? getBranchShippingFee(selectedOrder)
        : 0;
    const invoiceTotal = invoiceSubtotal / 100 + branchShippingFee;

    function clearFilters() {
        setSearch('');
        setStatus('');
        setPaymentStatus('');
        setShippingFeeStatus('');
        setOrderType('all');
        setDatePreset('all');
        setDateFrom('');
        setDateTo('');
    }

    return (
        <>
            <Head title="Orders" />
            <AdminPage
                title="Orders"
                description="Fulfill and track orders routed to your tenant branches."
            >
                <Panel>
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
                        <Search className="size-4 text-slate-400" />
                        <SearchForm
                            value={search}
                            onChange={setSearch}
                            placeholder="Search by order number"
                        />
                        <select
                            aria-label="Filter by order type"
                            value={orderType}
                            onChange={(event) =>
                                setOrderType(event.target.value)
                            }
                            className="h-10 min-w-36 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                        >
                            <option value="all">All order types</option>
                            <option value="pos">POS orders</option>
                            <option value="online">Online orders</option>
                        </select>
                        <select
                            aria-label="Filter orders by date"
                            value={datePreset}
                            onChange={(event) => {
                                const preset = event.target.value;
                                setDatePreset(preset);
                                if (preset !== 'custom') {
                                    setDateFrom('');
                                    setDateTo('');
                                }
                            }}
                            className="h-10 min-w-36 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                        >
                            <option value="all">All dates</option>
                            <option value="today">Today</option>
                            <option value="custom">Date range</option>
                        </select>
                        {datePreset === 'custom' && (
                            <>
                                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    From
                                    <input
                                        type="date"
                                        aria-label="Orders from date"
                                        value={dateFrom}
                                        onChange={(event) =>
                                            setDateFrom(event.target.value)
                                        }
                                        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                                    />
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    To
                                    <input
                                        type="date"
                                        aria-label="Orders to date"
                                        value={dateTo}
                                        min={dateFrom || undefined}
                                        onChange={(event) =>
                                            setDateTo(event.target.value)
                                        }
                                        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                                    />
                                </label>
                            </>
                        )}
                        <select
                            aria-label="Filter orders by status"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="h-10 min-w-40 rounded-lg border border-slate-300 bg-white px-3 text-sm capitalize outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                        >
                            <option value="">All statuses</option>
                            {ORDER_STATUSES.map((orderStatus) => (
                                <option key={orderStatus} value={orderStatus}>
                                    {orderStatus}
                                </option>
                            ))}
                        </select>
                        <select
                            aria-label="Filter orders by payment status"
                            value={paymentStatus}
                            onChange={(event) =>
                                setPaymentStatus(event.target.value)
                            }
                            className="h-10 min-w-40 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                        >
                            <option value="">All payment statuses</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Unpaid</option>
                        </select>
                        <select
                            aria-label="Filter orders by shipping fee status"
                            value={shippingFeeStatus}
                            onChange={(event) =>
                                setShippingFeeStatus(event.target.value)
                            }
                            className="h-10 min-w-40 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                        >
                            <option value="">All shipping fee statuses</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Unpaid</option>
                        </select>
                        <button
                            type="button"
                            onClick={clearFilters}
                            disabled={
                                search === '' &&
                                status === '' &&
                                paymentStatus === '' &&
                                shippingFeeStatus === '' &&
                                orderType === 'all' &&
                                datePreset === 'all' &&
                                dateFrom === '' &&
                                dateTo === ''
                            }
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                        >
                            <RotateCcw className="size-4" />
                            Clear filters
                        </button>
                        <div className="ml-auto flex items-center gap-2">
                            <a
                                href={exportHref('xlsx')}
                                aria-label="Download filtered orders as Excel"
                                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
                            >
                                <FileSpreadsheet className="size-4" />
                                Excel
                            </a>
                            <a
                                href={exportHref('pdf')}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Download filtered orders as PDF"
                                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
                            >
                                <FileText className="size-4" />
                                PDF
                            </a>
                        </div>
                    </div>
                    <div className="overflow-x-auto px-2">
                        <table className="w-full min-w-[1100px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">Order</th>
                                    <th className="px-5 py-3">Customer</th>
                                    <th className="px-5 py-3">Branch</th>
                                    <th className="px-5 py-3">Shipping fee</th>
                                    <th className="px-5 py-3">Total</th>
                                    <th className="px-5 py-3">Grand total</th>
                                    <th className="px-5 py-3">
                                        Payment status
                                    </th>
                                    <th className="px-5 py-3">
                                        Shipping fee status
                                    </th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {orders.data.map((order) => (
                                    <tr key={order.id} className="align-top">
                                        <td className="px-5 py-4">
                                            <a
                                                href={`/tenant/orders/${order.id}/invoice`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={`Open PDF invoice for ${order.order.order_no}`}
                                                className="font-semibold text-slate-900 underline-offset-2 transition hover:text-emerald-600 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:text-slate-100 dark:hover:text-emerald-400"
                                            >
                                                {order.order.order_no}
                                            </a>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(
                                                    order.order.created_at,
                                                ).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-medium">
                                                {order.order.customer.name}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {order.order.customer.email}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            {order.branch.name}
                                        </td>
                                        <td className="px-5 py-4">
                                            {formatCurrency(
                                                getBranchShippingFee(order),
                                            )}
                                        </td>
                                        <td className="px-5 py-4 font-semibold">
                                            {formatCurrency(order.total)}
                                        </td>
                                        <td className="px-5 py-4 font-semibold">
                                            {formatCurrency(
                                                Number(order.total) +
                                                    getBranchShippingFee(order),
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPaymentOrder(order)
                                                }
                                                aria-label={`Update payment status for ${order.order.order_no}`}
                                                className="rounded-full focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                                            >
                                                <PaymentStatusBadge
                                                    paid={
                                                        order.order
                                                            .payment_status ===
                                                        'paid'
                                                    }
                                                />
                                            </button>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShippingFeeOrder(order)
                                                }
                                                disabled={
                                                    getBranchShippingFee(
                                                        order,
                                                    ) === 0
                                                }
                                                aria-label={`Update shipping fee status for ${order.order.order_no}`}
                                                className="rounded-full focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-default"
                                            >
                                                <PaymentStatusBadge
                                                    paid={
                                                        getBranchShippingFee(
                                                            order,
                                                        ) === 0 ||
                                                        order.shipping_fee_status ===
                                                            'paid'
                                                    }
                                                />
                                            </button>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setStatusOrder(order)
                                                }
                                                aria-label={`Update status for ${order.order.order_no}`}
                                                className="rounded-full focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                                            >
                                                <StatusBadge>
                                                    {order.status}
                                                </StatusBadge>
                                            </button>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedOrder(order)
                                                }
                                                aria-label={`View invoice for ${order.order.order_no}`}
                                                className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
                                            >
                                                <Eye className="size-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {orders.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={10}
                                            className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No orders found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={orders.links} />
                </Panel>
            </AdminPage>
            <Dialog
                open={statusOrder !== null}
                onOpenChange={(open) => !open && setStatusOrder(null)}
            >
                {statusOrder && (
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Update order status</DialogTitle>
                            <DialogDescription>
                                Update order {statusOrder.order.order_no}. The
                                customer will be notified of the change.
                            </DialogDescription>
                        </DialogHeader>
                        <OrderStatusForm
                            order={statusOrder}
                            onClose={() => setStatusOrder(null)}
                        />
                    </DialogContent>
                )}
            </Dialog>
            <Dialog
                open={paymentOrder !== null}
                onOpenChange={(open) => !open && setPaymentOrder(null)}
            >
                {paymentOrder && (
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Update payment status</DialogTitle>
                            <DialogDescription>
                                This updates payment status for the shared
                                checkout order {paymentOrder.order.order_no}.
                            </DialogDescription>
                        </DialogHeader>
                        <PaymentStatusForm
                            order={paymentOrder}
                            status={
                                paymentOrder.order.payment_status === 'paid'
                                    ? 'paid'
                                    : 'pending'
                            }
                            endpoint="payment-status"
                            onClose={() => setPaymentOrder(null)}
                        />
                    </DialogContent>
                )}
            </Dialog>
            <Dialog
                open={shippingFeeOrder !== null}
                onOpenChange={(open) => !open && setShippingFeeOrder(null)}
            >
                {shippingFeeOrder && (
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                Update shipping fee status
                            </DialogTitle>
                            <DialogDescription>
                                Update the shipping fee payment for{' '}
                                {shippingFeeOrder.branch.name} on order{' '}
                                {shippingFeeOrder.order.order_no}.
                            </DialogDescription>
                        </DialogHeader>
                        <PaymentStatusForm
                            order={shippingFeeOrder}
                            status={shippingFeeOrder.shipping_fee_status}
                            endpoint="shipping-fee-status"
                            onClose={() => setShippingFeeOrder(null)}
                        />
                    </DialogContent>
                )}
            </Dialog>
            <Dialog
                open={selectedOrder !== null}
                onOpenChange={(open) => !open && setSelectedOrder(null)}
            >
                {selectedOrder && (
                    <DialogContent
                        data-invoice-print
                        className="order-invoice-dialog max-h-[92vh] max-w-xl overflow-y-auto rounded-none border-0 bg-white p-0 shadow-2xl sm:rounded-xl"
                    >
                        <DialogHeader className="sr-only">
                            <DialogTitle>
                                Order invoice {selectedOrder.order.order_no}
                            </DialogTitle>
                            <DialogDescription>
                                Order details and printable invoice.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="invoice-print-area bg-white px-6 py-7 text-slate-900 sm:px-8">
                            <header className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h2 className="text-4xl font-extrabold tracking-[0.14em] uppercase">
                                        Invoice
                                    </h2>
                                    <p className="mt-4 text-xs font-bold tracking-[0.15em] uppercase">
                                        Issued to
                                    </p>
                                    <p className="mt-1 text-sm leading-5 tracking-wide">
                                        <span className="font-semibold">
                                            {selectedOrder.branch.name}
                                        </span>
                                        <br />
                                        {selectedOrder.branch.address},{' '}
                                        {selectedOrder.branch.city}
                                        <br />
                                        {selectedOrder.branch.tenant.email}
                                        <br />
                                        Contact No: {selectedOrder.branch.phone}
                                    </p>
                                </div>
                                <div className="w-[46%] shrink-0 pt-1 text-right">
                                    {branchLogo && (
                                        <img
                                            src={branchLogo}
                                            alt={`${selectedOrder.branch.tenant.name} logo`}
                                            className="mb-4 ml-auto max-h-14 max-w-full object-contain"
                                        />
                                    )}
                                    <p className="text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Invoice no.
                                    </p>
                                    <p className="mt-1 text-xs font-semibold break-all">
                                        {selectedOrder.order.order_no}
                                    </p>
                                    <OrderBarcode
                                        value={selectedOrder.order.order_no}
                                    />
                                    <div className="mt-3 border-t border-slate-300 pt-2 text-left text-[10px] leading-4">
                                        <p className="text-right font-bold tracking-[0.1em] uppercase">
                                            Customer info
                                        </p>
                                        <p className="mt-1 font-semibold">
                                            {selectedOrder.order.customer.name}
                                        </p>
                                        <p className="break-all">
                                            {selectedOrder.order.customer.email}
                                        </p>
                                        <p>
                                            {selectedOrder.order
                                                .shipping_address.phone ??
                                                'No contact number'}
                                        </p>
                                        <p>
                                            {[
                                                selectedOrder.order
                                                    .shipping_address
                                                    .address_line,
                                                selectedOrder.order
                                                    .shipping_address
                                                    .division ??
                                                    selectedOrder.order
                                                        .shipping_address.city,
                                                selectedOrder.order
                                                    .shipping_address.district,
                                                selectedOrder.order
                                                    .shipping_address.upazila,
                                                selectedOrder.order
                                                    .shipping_address
                                                    .postal_code,
                                            ]
                                                .filter(Boolean)
                                                .join(', ') ||
                                                'No delivery address provided'}
                                        </p>
                                    </div>
                                </div>
                            </header>

                            <section className="mt-5">
                                <table className="w-full table-fixed text-left text-xs">
                                    <colgroup>
                                        <col className="w-[54%]" />
                                        <col className="w-[17%]" />
                                        <col className="w-[10%]" />
                                        <col className="w-[19%]" />
                                    </colgroup>
                                    <thead>
                                        <tr className="border-b border-slate-500 text-[10px] font-bold tracking-[0.1em] uppercase">
                                            <th className="py-2 pr-2">
                                                Description
                                            </th>
                                            <th className="px-1 py-2 text-right">
                                                Rate
                                            </th>
                                            <th className="px-1 py-2 text-right">
                                                Qty
                                            </th>
                                            <th className="py-2 pl-1 text-right">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.items.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b border-slate-200"
                                            >
                                                <td className="py-2 pr-2 leading-4 break-words">
                                                    {item.name}
                                                </td>
                                                <td className="px-1 py-2 text-right">
                                                    {formatCurrency(item.price)}
                                                </td>
                                                <td className="px-1 py-2 text-right">
                                                    {item.quantity}
                                                </td>
                                                <td className="py-2 pl-1 text-right">
                                                    {formatCurrency(
                                                        Number(item.price) *
                                                            item.quantity,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>

                            <section className="mt-5 ml-auto w-56 max-w-full text-xs">
                                <div className="flex justify-between border-t border-slate-500 px-1 py-2 font-bold tracking-[0.08em] uppercase">
                                    <span>Subtotal</span>
                                    <span>
                                        {formatCurrency(invoiceSubtotal / 100)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-200 px-1 py-2">
                                    <span>Shipping charge</span>
                                    <span className="flex items-center gap-2">
                                        {formatCurrency(branchShippingFee)}
                                        {branchShippingFee > 0 &&
                                            selectedOrder.shipping_fee_status ===
                                                'paid' && (
                                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold tracking-wide text-emerald-800 uppercase">
                                                    Paid
                                                </span>
                                            )}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t border-slate-300 px-1 py-2 font-bold tracking-[0.08em] uppercase">
                                    <span>Total</span>
                                    <span>{formatCurrency(invoiceTotal)}</span>
                                </div>
                            </section>
                            <section className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-1 pt-8 text-left text-[10px] leading-5">
                                <p>
                                    <span className="font-bold">Date:</span>{' '}
                                    {new Date(
                                        selectedOrder.order.created_at,
                                    ).toLocaleDateString()}
                                </p>
                                <p>
                                    <span className="font-bold">Payment:</span>{' '}
                                    {formatPaymentMethod(
                                        selectedOrder.order.payment_method,
                                    )}
                                </p>
                            </section>
                            <footer className="mt-8 border-t border-slate-200 pt-3 text-center text-[10px] tracking-wide text-slate-500">
                                Thank you for your order.
                            </footer>
                        </div>
                        <div className="invoice-print-controls flex justify-end border-t border-slate-200 bg-white px-6 py-4">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                            >
                                <Printer className="size-4" />
                                Print invoice
                            </button>
                        </div>
                        <style>{`
                            @page {
                                size: A5 portrait;
                                margin: 0;
                            }
                            @media print {
                                body * {
                                    visibility: hidden !important;
                                }
                                [data-invoice-print],
                                [data-invoice-print] * {
                                    visibility: visible !important;
                                    color: #111827 !important;
                                }
                                [data-invoice-print] {
                                    position: absolute !important;
                                    inset: 0 !important;
                                    width: 148mm !important;
                                    min-height: 210mm !important;
                                    max-width: none !important;
                                    height: auto !important;
                                    max-height: none !important;
                                    overflow: visible !important;
                                    display: block !important;
                                    border: 0 !important;
                                    border-radius: 0 !important;
                                    transform: none !important;
                                    translate: none !important;
                                    animation: none !important;
                                    background: #fff !important;
                                    box-shadow: none !important;
                                }
                                .invoice-print-area {
                                    box-sizing: border-box !important;
                                    display: flex !important;
                                    flex-direction: column !important;
                                    min-height: 210mm !important;
                                    padding: 10mm !important;
                                    background: #fff !important;
                                    color: #111827 !important;
                                }
                                .invoice-print-area * {
                                    color: #111827 !important;
                                }
                                .order-invoice-dialog > button,
                                .invoice-print-controls {
                                    display: none !important;
                                }
                            }
                        `}</style>
                    </DialogContent>
                )}
            </Dialog>
        </>
    );
}
