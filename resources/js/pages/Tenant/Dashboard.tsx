import { Head, router } from '@inertiajs/react';
import {
    Boxes,
    ClipboardList,
    DollarSign,
    RotateCcw,
    Warehouse,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminPage, Panel } from '@/components/super-admin/admin-page';

type SalesPoint = { date: string; sales: number; orders: number };
type LowStock = {
    id: number;
    quantity: number;
    branch: { name: string };
    variant: {
        sku: string;
        size: string | null;
        color: string | null;
        product: { name: string };
    };
};

type BranchOption = { id: number; name: string };

export default function TenantDashboard({
    metrics,
    salesChart,
    lowStock,
    branches,
    canFilterBranches,
    filters,
}: {
    metrics: {
        sales: number;
        orders: number;
        branches: number;
        products: number;
    };
    salesChart: SalesPoint[];
    lowStock: LowStock[];
    branches: BranchOption[];
    canFilterBranches: boolean;
    filters: {
        order_type: string;
        date_preset: string;
        date_from: string;
        date_to: string;
        branch_id: string;
    };
}) {
    const [orderType, setOrderType] = useState(filters.order_type);
    const [datePreset, setDatePreset] = useState(filters.date_preset);
    const [dateFrom, setDateFrom] = useState(filters.date_from);
    const [dateTo, setDateTo] = useState(filters.date_to);
    const [branchId, setBranchId] = useState(filters.branch_id);
    const maxSales = Math.max(...salesChart.map((point) => point.sales), 1);
    const selectedBranchName = branches.find(
        (branch) => String(branch.id) === branchId,
    )?.name;
    const periodLabel =
        datePreset === 'today'
            ? 'Today'
            : datePreset === 'custom'
              ? `${dateFrom} – ${dateTo}`
              : 'Last 7 days';
    const hasActiveFilters =
        orderType !== 'all' ||
        datePreset !== 'last_7_days' ||
        dateFrom !== '' ||
        dateTo !== '' ||
        (canFilterBranches && branchId !== '');

    function clearFilters() {
        setOrderType('all');
        setDatePreset('last_7_days');
        setDateFrom('');
        setDateTo('');
        if (canFilterBranches) {
            setBranchId('');
        }
    }

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(
                window.location.pathname,
                {
                    order_type: orderType,
                    date_preset: datePreset,
                    date_from: dateFrom,
                    date_to: dateTo,
                    branch_id: branchId,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [orderType, datePreset, dateFrom, dateTo, branchId]);

    const cards = [
        {
            label: `Sales (${periodLabel})`,
            value: `৳${metrics.sales.toLocaleString('en-BD')}`,
            icon: DollarSign,
        },
        {
            label: `Orders (${periodLabel})`,
            value: metrics.orders,
            icon: ClipboardList,
        },
        { label: 'Branches', value: metrics.branches, icon: Warehouse },
        { label: 'Products', value: metrics.products, icon: Boxes },
    ];

    return (
        <>
            <Head title="Tenant dashboard" />
            <AdminPage
                title="Store overview"
                description="Recent sales performance, operations, and inventory alerts."
            >
                <Panel>
                    <div className="flex flex-wrap items-end gap-3 p-4">
                        <label className="block space-y-1.5 text-sm font-medium">
                            Order type
                            <select
                                aria-label="Filter dashboard by order type"
                                value={orderType}
                                onChange={(event) =>
                                    setOrderType(event.target.value)
                                }
                                className="h-10 min-w-40 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                            >
                                <option value="all">All orders</option>
                                <option value="pos">POS orders</option>
                                <option value="online">Online orders</option>
                            </select>
                        </label>
                        <label className="block space-y-1.5 text-sm font-medium">
                            Date range
                            <select
                                aria-label="Filter dashboard by date"
                                value={datePreset}
                                onChange={(event) => {
                                    const preset = event.target.value;
                                    setDatePreset(preset);
                                    if (preset === 'custom') {
                                        setDateFrom(
                                            dateFrom ||
                                                salesChart[0]?.date ||
                                                '',
                                        );
                                        setDateTo(
                                            dateTo ||
                                                salesChart[
                                                    salesChart.length - 1
                                                ]?.date ||
                                                '',
                                        );
                                    } else {
                                        setDateFrom('');
                                        setDateTo('');
                                    }
                                }}
                                className="h-10 min-w-40 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                            >
                                <option value="last_7_days">Last 7 days</option>
                                <option value="today">Today</option>
                                <option value="custom">Custom range</option>
                            </select>
                        </label>
                        {datePreset === 'custom' && (
                            <>
                                <label className="block space-y-1.5 text-sm font-medium">
                                    From
                                    <input
                                        type="date"
                                        aria-label="Dashboard from date"
                                        value={dateFrom}
                                        onChange={(event) =>
                                            setDateFrom(event.target.value)
                                        }
                                        className="block h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                                    />
                                </label>
                                <label className="block space-y-1.5 text-sm font-medium">
                                    To
                                    <input
                                        type="date"
                                        aria-label="Dashboard to date"
                                        value={dateTo}
                                        min={dateFrom || undefined}
                                        onChange={(event) =>
                                            setDateTo(event.target.value)
                                        }
                                        className="block h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                                    />
                                </label>
                            </>
                        )}
                        {canFilterBranches && (
                            <label className="block space-y-1.5 text-sm font-medium">
                                Branch
                                <select
                                    aria-label="Filter dashboard by branch"
                                    value={branchId}
                                    onChange={(event) =>
                                        setBranchId(event.target.value)
                                    }
                                    className="h-10 min-w-44 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                                >
                                    <option value="">All branches</option>
                                    {branches.map((branch) => (
                                        <option
                                            key={branch.id}
                                            value={branch.id}
                                        >
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                        <button
                            type="button"
                            onClick={clearFilters}
                            disabled={!hasActiveFilters}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                        >
                            <RotateCcw className="size-4" />
                            Clear filters
                        </button>
                    </div>
                </Panel>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map(({ label, value, icon: Icon }) => (
                        <Panel key={label}>
                            <div className="flex items-center justify-between p-5">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {label}
                                    </p>
                                    <p className="mt-2 text-2xl font-bold">
                                        {value}
                                    </p>
                                </div>
                                <span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    <Icon className="size-5" />
                                </span>
                            </div>
                        </Panel>
                    ))}
                </div>
                <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                    <Panel>
                        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                            <h2 className="font-semibold">
                                Sales · {periodLabel}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {orderType === 'all'
                                    ? 'Revenue from all order types.'
                                    : `Revenue from ${orderType} orders.`}
                                {selectedBranchName
                                    ? ` ${selectedBranchName} branch.`
                                    : ' All branches.'}
                            </p>
                        </div>
                        <div className="flex h-64 items-end gap-3 overflow-x-auto p-5 sm:gap-5">
                            {salesChart.map((point) => (
                                <div
                                    key={point.date}
                                    className="flex h-full min-w-8 flex-1 flex-col items-center justify-end gap-2"
                                    title={`${point.date} · ৳${point.sales.toLocaleString('en-BD')} · ${point.orders} orders`}
                                >
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {point.sales > 0
                                            ? `৳${Math.round(point.sales).toLocaleString('en-BD')}`
                                            : ''}
                                    </span>
                                    <div
                                        className="w-full max-w-12 rounded-t-lg bg-emerald-500 transition-all dark:bg-emerald-400"
                                        style={{
                                            height: `${Math.max((point.sales / maxSales) * 70, point.sales > 0 ? 8 : 2)}%`,
                                        }}
                                    />
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {new Date(
                                            `${point.date}T00:00:00`,
                                        ).toLocaleDateString(
                                            undefined,
                                            datePreset === 'custom'
                                                ? {
                                                      month: 'numeric',
                                                      day: 'numeric',
                                                  }
                                                : { weekday: 'short' },
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Panel>
                    <Panel>
                        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                            <h2 className="font-semibold">Low stock</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Variants with five or fewer units remaining.
                            </p>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {lowStock.map((stock) => (
                                <div
                                    key={stock.id}
                                    className="flex items-center justify-between gap-3 px-5 py-4"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {stock.variant.product.name}
                                        </p>
                                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                            {stock.variant.sku} ·{' '}
                                            {stock.variant.color ?? '—'} ·{' '}
                                            {stock.branch.name}
                                        </p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                        {stock.quantity} left
                                    </span>
                                </div>
                            ))}
                            {lowStock.length === 0 && (
                                <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
                                    No low-stock variants.
                                </p>
                            )}
                        </div>
                    </Panel>
                </div>
            </AdminPage>
        </>
    );
}
