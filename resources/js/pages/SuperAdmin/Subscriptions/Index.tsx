import { Head, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    AdminPage,
    FormModal,
    Pagination,
    Panel,
    SearchForm,
    StatusBadge,
    TextField,
} from '@/components/super-admin/admin-page';

type SubscriptionRow = {
    id: number;
    starts_at: string;
    ends_at: string;
    status: string;
    tenant: { id: number; name: string; slug: string; status: string };
    plan: { id: number; name: string; price: string; interval: string };
};

type Option = { id: number; name: string; status?: string };
type PageData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

const dateToday = () => new Date().toISOString().slice(0, 10);
const dateNextMonth = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 10);
};

export default function SubscriptionsIndex({
    subscriptions,
    tenants,
    plans,
    filters,
}: {
    subscriptions: PageData<SubscriptionRow>;
    tenants: Option[];
    plans: Array<Option & { price: string; interval: string }>;
    filters: { search: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const form = useForm({
        tenant_id: '',
        plan_id: '',
        starts_at: dateToday(),
        ends_at: dateNextMonth(),
    });

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(
                '/super-admin/subscriptions',
                { search },
                { preserveState: true, replace: true, preserveScroll: true },
            );
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [search]);

    const assign = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/super-admin/subscriptions', {
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    };

    return (
        <>
            <Head title="Subscriptions" />
            <AdminPage
                title="Subscriptions"
                description="Assign plans, renew billing periods, and cancel tenant subscriptions."
                action={
                    <button
                        type="button"
                        onClick={() => {
                            form.clearErrors();
                            form.setData({
                                tenant_id: '',
                                plan_id: '',
                                starts_at: dateToday(),
                                ends_at: dateNextMonth(),
                            });
                            setOpen(true);
                        }}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        <Plus className="size-4" /> Assign plan
                    </button>
                }
            >
                <Panel>
                    <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                        <SearchForm
                            value={search}
                            onChange={setSearch}
                            placeholder="Search tenant or plan"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">Tenant</th>
                                    <th className="px-5 py-3">Plan</th>
                                    <th className="px-5 py-3">Period</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {subscriptions.data.map((subscription) => (
                                    <tr key={subscription.id}>
                                        <td className="px-5 py-4 font-semibold">
                                            {subscription.tenant.name}
                                        </td>
                                        <td className="px-5 py-4">
                                            {subscription.plan.name}
                                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                                                ৳{subscription.plan.price} /{' '}
                                                {subscription.plan.interval}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                                            {subscription.starts_at} —{' '}
                                            {subscription.ends_at}
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge>
                                                {subscription.status}
                                            </StatusBadge>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.post(
                                                            `/super-admin/subscriptions/${subscription.id}/renew`,
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium dark:border-slate-700"
                                                >
                                                    Renew
                                                </button>
                                                {subscription.status ===
                                                    'active' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (
                                                                window.confirm(
                                                                    'Cancel this subscription?',
                                                                )
                                                            ) {
                                                                router.post(
                                                                    `/super-admin/subscriptions/${subscription.id}/cancel`,
                                                                    {},
                                                                    {
                                                                        preserveScroll: true,
                                                                    },
                                                                );
                                                            }
                                                        }}
                                                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 dark:border-red-900"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {subscriptions.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No subscriptions match this search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={subscriptions.links} />
                </Panel>
            </AdminPage>
            <FormModal
                open={open}
                onClose={() => setOpen(false)}
                title="Assign subscription"
            >
                <form onSubmit={assign} className="space-y-4">
                    <label className="block space-y-1.5 text-sm font-medium">
                        Tenant
                        <select
                            value={form.data.tenant_id}
                            onChange={(event) =>
                                form.setData('tenant_id', event.target.value)
                            }
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                            required
                        >
                            <option value="">Choose tenant</option>
                            {tenants.map((tenant) => (
                                <option key={tenant.id} value={tenant.id}>
                                    {tenant.name} ({tenant.status})
                                </option>
                            ))}
                        </select>
                        {form.errors.tenant_id && (
                            <span className="block text-xs text-red-600">
                                {form.errors.tenant_id}
                            </span>
                        )}
                    </label>
                    <label className="block space-y-1.5 text-sm font-medium">
                        Plan
                        <select
                            value={form.data.plan_id}
                            onChange={(event) =>
                                form.setData('plan_id', event.target.value)
                            }
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                            required
                        >
                            <option value="">Choose plan</option>
                            {plans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name} · ৳{plan.price} /{' '}
                                    {plan.interval}
                                </option>
                            ))}
                        </select>
                        {form.errors.plan_id && (
                            <span className="block text-xs text-red-600">
                                {form.errors.plan_id}
                            </span>
                        )}
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                            label="Starts at"
                            type="date"
                            value={form.data.starts_at}
                            onChange={(event) =>
                                form.setData('starts_at', event.target.value)
                            }
                            error={form.errors.starts_at}
                            required
                        />
                        <TextField
                            label="Ends at"
                            type="date"
                            value={form.data.ends_at}
                            onChange={(event) =>
                                form.setData('ends_at', event.target.value)
                            }
                            error={form.errors.ends_at}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="h-10 rounded-lg border border-slate-300 px-4 text-sm dark:border-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            Assign plan
                        </button>
                    </div>
                </form>
            </FormModal>
        </>
    );
}
