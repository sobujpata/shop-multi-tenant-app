import { Head, Link, router } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    AdminPage,
    Pagination,
    Panel,
    SearchForm,
} from '@/components/super-admin/admin-page';

type InvoiceRow = {
    id: number;
    items_count: number;
    branch: { id: number; name: string };
    order: {
        order_no: string;
        created_at: string;
        total: string | number;
        payment_method: string;
        customer: { name: string; email: string } | null;
    };
};

type Branch = { id: number; name: string };

type Paginated<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

function currency(value: string | number): string {
    return `Tk ${Number(value).toFixed(2)}`;
}

export default function PosInvoices({
    invoices,
    branches,
    filters,
}: {
    invoices: Paginated<InvoiceRow>;
    branches: Branch[];
    filters: { search: string; branch_id: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const [branchId, setBranchId] = useState(filters.branch_id);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(
                '/tenant/pos/invoices',
                { search, branch_id: branchId },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search, branchId]);

    return (
        <>
            <Head title="POS invoices" />
            <AdminPage
                title="POS invoices"
                description="View and print invoices for in-store sales."
                action={
                    <Link
                        href="/tenant/pos"
                        className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Open POS
                    </Link>
                }
            >
                <Panel>
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
                        <Search className="size-4 text-slate-400" />
                        <SearchForm
                            value={search}
                            onChange={setSearch}
                            placeholder="Search invoice or customer"
                        />
                        {branches.length > 1 && (
                            <select
                                aria-label="Filter POS invoices by branch"
                                value={branchId}
                                onChange={(event) =>
                                    setBranchId(event.target.value)
                                }
                                className="h-10 min-w-40 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                            >
                                <option value="">All branches</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-slate-950">
                                <tr>
                                    <th className="px-5 py-3">Invoice</th>
                                    <th className="px-5 py-3">Customer</th>
                                    {branches.length > 1 && (
                                        <th className="px-5 py-3">Branch</th>
                                    )}
                                    <th className="px-5 py-3 text-right">
                                        Items
                                    </th>
                                    <th className="px-5 py-3 text-right">
                                        Total
                                    </th>
                                    <th className="px-5 py-3">Payment</th>
                                    <th className="px-5 py-3 text-right">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {invoices.data.map((invoice) => (
                                    <tr key={invoice.id}>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold">
                                                {invoice.order.order_no}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {invoice.order.created_at.slice(
                                                    0,
                                                    10,
                                                )}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-medium">
                                                {invoice.order.customer?.name ??
                                                    'Walk-in Customer'}
                                            </p>
                                            {invoice.order.customer?.email && (
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {
                                                        invoice.order.customer
                                                            .email
                                                    }
                                                </p>
                                            )}
                                        </td>
                                        {branches.length > 1 && (
                                            <td className="px-5 py-4">
                                                {invoice.branch.name}
                                            </td>
                                        )}
                                        <td className="px-5 py-4 text-right">
                                            {invoice.items_count}
                                        </td>
                                        <td className="px-5 py-4 text-right font-semibold">
                                            {currency(invoice.order.total)}
                                        </td>
                                        <td className="px-5 py-4 capitalize">
                                            {invoice.order.payment_method ===
                                            'cod'
                                                ? 'Cash'
                                                : invoice.order.payment_method}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Link
                                                href={`/tenant/pos/${invoice.id}/invoice`}
                                                aria-label={`View invoice ${invoice.order.order_no}`}
                                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"
                                            >
                                                <Eye className="size-4" />
                                                View invoice
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {invoices.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={
                                                branches.length > 1 ? 7 : 6
                                            }
                                            className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No POS invoices found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={invoices.links} />
                </Panel>
            </AdminPage>
        </>
    );
}
