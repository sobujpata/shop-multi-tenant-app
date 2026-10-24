import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    AdminPage,
    FormModal,
    Pagination,
    Panel,
    SearchForm,
    SelectField,
    StatusBadge,
    TextField,
} from '@/components/super-admin/admin-page';

type PlanRow = {
    id: number;
    name: string;
    price: string;
    interval: 'monthly' | 'yearly';
    max_branches: number;
    max_products: number;
    is_active: boolean;
    subscriptions_count: number;
};

type PageData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

const emptyPlan = {
    name: '',
    price: '',
    interval: 'monthly' as 'monthly' | 'yearly',
    max_branches: '1',
    max_products: '100',
    is_active: '1',
};

export default function PlansIndex({
    plans,
    filters,
}: {
    plans: PageData<PlanRow>;
    filters: { search: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<PlanRow | null>(null);
    const form = useForm(emptyPlan);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(
                '/super-admin/plans',
                { search },
                { preserveState: true, replace: true, preserveScroll: true },
            );
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [search]);

    const openModal = (plan?: PlanRow) => {
        setEditing(plan ?? null);
        form.clearErrors();
        form.setData(
            plan
                ? {
                      name: plan.name,
                      price: plan.price,
                      interval: plan.interval,
                      max_branches: String(plan.max_branches),
                      max_products: String(plan.max_products),
                      is_active: plan.is_active ? '1' : '0',
                  }
                : emptyPlan,
        );
        setOpen(true);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            max_branches: Number(data.max_branches),
            max_products: Number(data.max_products),
            is_active: data.is_active === '1',
        }));
        const options = {
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        };
        if (editing) {
            form.put(`/super-admin/plans/${editing.id}`, options);
        } else {
            form.post('/super-admin/plans', options);
        }
    };

    return (
        <>
            <Head title="Plans" />
            <AdminPage
                title="Plans"
                description="Configure billing intervals and tenant plan limits."
                action={
                    <button
                        type="button"
                        onClick={() => openModal()}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        <Plus className="size-4" /> New plan
                    </button>
                }
            >
                <Panel>
                    <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                        <SearchForm
                            value={search}
                            onChange={setSearch}
                            placeholder="Search plans"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">Plan</th>
                                    <th className="px-5 py-3">Price</th>
                                    <th className="px-5 py-3">Limits</th>
                                    <th className="px-5 py-3">Tenants</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {plans.data.map((plan) => (
                                    <tr key={plan.id}>
                                        <td className="px-5 py-4 font-semibold">
                                            {plan.name}
                                        </td>
                                        <td className="px-5 py-4">
                                            ৳
                                            {Number(plan.price).toLocaleString(
                                                'en-BD',
                                            )}{' '}
                                            / {plan.interval}
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                                            {plan.max_branches} branches ·{' '}
                                            {plan.max_products} products
                                        </td>
                                        <td className="px-5 py-4">
                                            {plan.subscriptions_count}
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge>
                                                {plan.is_active
                                                    ? 'active'
                                                    : 'inactive'}
                                            </StatusBadge>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openModal(plan)
                                                    }
                                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium dark:border-slate-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`Delete ${plan.name}`}
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                `Delete plan ${plan.name}?`,
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/super-admin/plans/${plan.id}`,
                                                            );
                                                        }
                                                    }}
                                                    className="rounded-md p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {plans.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No plans found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={plans.links} />
                </Panel>
            </AdminPage>
            <FormModal
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? 'Edit plan' : 'Create plan'}
            >
                <form onSubmit={submit} className="space-y-4">
                    <TextField
                        label="Plan name"
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        error={form.errors.name}
                        required
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                            label="Price (৳)"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.data.price}
                            onChange={(event) =>
                                form.setData('price', event.target.value)
                            }
                            error={form.errors.price}
                            required
                        />
                        <SelectField
                            label="Interval"
                            value={form.data.interval}
                            onChange={(event) =>
                                form.setData(
                                    'interval',
                                    event.target.value as 'monthly' | 'yearly',
                                )
                            }
                            error={form.errors.interval}
                        >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </SelectField>
                        <TextField
                            label="Maximum branches"
                            type="number"
                            min="1"
                            value={form.data.max_branches}
                            onChange={(event) =>
                                form.setData('max_branches', event.target.value)
                            }
                            error={form.errors.max_branches}
                            required
                        />
                        <TextField
                            label="Maximum products"
                            type="number"
                            min="1"
                            value={form.data.max_products}
                            onChange={(event) =>
                                form.setData('max_products', event.target.value)
                            }
                            error={form.errors.max_products}
                            required
                        />
                        <SelectField
                            label="Availability"
                            value={form.data.is_active}
                            onChange={(event) =>
                                form.setData('is_active', event.target.value)
                            }
                        >
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </SelectField>
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
                            Save plan
                        </button>
                    </div>
                </form>
            </FormModal>
        </>
    );
}
