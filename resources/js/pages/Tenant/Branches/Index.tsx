import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, Trash2, Warehouse } from 'lucide-react';
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
import InputError from '@/components/input-error';

type BranchRow = {
    id: number;
    name: string;
    address: string;
    city: string;
    phone: string;
    is_active: boolean;
    delivery_costs: Array<{
        id: number;
        area: string;
        cost: string | number;
    }>;
    stocks_count: number;
};
type Paginated<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
};
const emptyBranch = {
    name: '',
    address: '',
    city: '',
    phone: '',
    is_active: true,
    delivery_costs: [{ area: '', cost: '0' }],
};

export default function BranchesIndex({
    branches,
    filters,
    canManage,
    branchLimit,
}: {
    branches: Paginated<BranchRow>;
    filters: { search: string };
    canManage: boolean;
    branchLimit: number;
}) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<BranchRow | null>(null);
    const form = useForm(emptyBranch);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(
                '/tenant/branches',
                { search },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [search]);

    const openModal = (branch?: BranchRow) => {
        setEditing(branch ?? null);
        form.clearErrors();
        form.setData(
            branch
                ? {
                      name: branch.name,
                      address: branch.address,
                      city: branch.city,
                      phone: branch.phone,
                      is_active: branch.is_active,
                      delivery_costs: branch.delivery_costs.map(
                          ({ area, cost }) => ({
                              area,
                              cost: String(cost),
                          }),
                      ),
                  }
                : emptyBranch,
        );
        setOpen(true);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const options = { onSuccess: () => setOpen(false) };
        if (editing) {
            form.put(`/tenant/branches/${editing.id}`, options);
        } else {
            form.post('/tenant/branches', options);
        }
    };

    return (
        <>
            <Head title="Branches" />
            <AdminPage
                title="Branches"
                description={`Manage store locations. Your plan allows ${branchLimit} branches.`}
                action={
                    canManage ? (
                        <button
                            type="button"
                            onClick={() => openModal()}
                            disabled={branches.total >= branchLimit}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="size-4" /> Add branch
                        </button>
                    ) : undefined
                }
            >
                <Panel>
                    <div className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
                        <Search className="size-4 text-slate-400" />
                        <SearchForm
                            value={search}
                            onChange={setSearch}
                            placeholder="Search branches"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">Branch</th>
                                    <th className="px-5 py-3">Contact</th>
                                    <th className="px-5 py-3">Stock rows</th>
                                    <th className="px-5 py-3">Status</th>
                                    {canManage && (
                                        <th className="px-5 py-3 text-right">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {branches.data.map((branch) => (
                                    <tr key={branch.id}>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="grid size-9 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                                    <Warehouse className="size-4" />
                                                </span>
                                                <div>
                                                    <p className="font-semibold">
                                                        {branch.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        {branch.address},{' '}
                                                        {branch.city}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {branch.phone}
                                        </td>
                                        <td className="px-5 py-4">
                                            {branch.stocks_count}
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge>
                                                {branch.is_active
                                                    ? 'active'
                                                    : 'inactive'}
                                            </StatusBadge>
                                        </td>
                                        {canManage && (
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openModal(branch)
                                                        }
                                                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label={`Delete ${branch.name}`}
                                                        onClick={() => {
                                                            if (
                                                                window.confirm(
                                                                    `Delete branch ${branch.name}?`,
                                                                )
                                                            )
                                                                router.delete(
                                                                    `/tenant/branches/${branch.id}`,
                                                                );
                                                        }}
                                                        className="rounded-md p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {branches.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={canManage ? 5 : 4}
                                            className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No branches found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={branches.links} />
                </Panel>
            </AdminPage>
            <FormModal
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? 'Edit branch' : 'Add branch'}
            >
                <form onSubmit={submit} className="space-y-4">
                    <TextField
                        label="Name"
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        error={form.errors.name}
                        required
                    />
                    <TextField
                        label="Address"
                        value={form.data.address}
                        onChange={(event) =>
                            form.setData('address', event.target.value)
                        }
                        error={form.errors.address}
                        required
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                            label="City"
                            value={form.data.city}
                            onChange={(event) =>
                                form.setData('city', event.target.value)
                            }
                            error={form.errors.city}
                            required
                        />
                        <TextField
                            label="Phone"
                            value={form.data.phone}
                            onChange={(event) =>
                                form.setData('phone', event.target.value)
                            }
                            error={form.errors.phone}
                            required
                        />
                    </div>
                    <fieldset className="space-y-3">
                        <legend className="text-sm font-medium">
                            Delivery areas and costs
                        </legend>
                        {form.data.delivery_costs.map((deliveryCost, index) => (
                            <div
                                key={index}
                                className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto]"
                            >
                                <TextField
                                    label="Area"
                                    value={deliveryCost.area}
                                    onChange={(event) =>
                                        form.setData((data) => ({
                                            ...data,
                                            delivery_costs:
                                                data.delivery_costs.map(
                                                    (cost, costIndex) =>
                                                        costIndex === index
                                                            ? {
                                                                  ...cost,
                                                                  area: event
                                                                      .target
                                                                      .value,
                                                              }
                                                            : cost,
                                                ),
                                        }))
                                    }
                                    error={
                                        form.errors[
                                            `delivery_costs.${index}.area`
                                        ]
                                    }
                                    placeholder="e.g. Mirpur"
                                    required
                                />
                                <TextField
                                    label="Cost (৳)"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={deliveryCost.cost}
                                    onChange={(event) =>
                                        form.setData((data) => ({
                                            ...data,
                                            delivery_costs:
                                                data.delivery_costs.map(
                                                    (cost, costIndex) =>
                                                        costIndex === index
                                                            ? {
                                                                  ...cost,
                                                                  cost: event
                                                                      .target
                                                                      .value,
                                                              }
                                                            : cost,
                                                ),
                                        }))
                                    }
                                    error={
                                        form.errors[
                                            `delivery_costs.${index}.cost`
                                        ]
                                    }
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        form.setData((data) => ({
                                            ...data,
                                            delivery_costs:
                                                data.delivery_costs.filter(
                                                    (_, costIndex) =>
                                                        costIndex !== index,
                                                ),
                                        }))
                                    }
                                    disabled={form.data.delivery_costs.length === 1}
                                    aria-label={`Remove ${deliveryCost.area || 'delivery area'}`}
                                    className="mb-1 rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-950"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        ))}
                        <InputError
                            message={form.errors.delivery_costs}
                        />
                        <button
                            type="button"
                            onClick={() =>
                                form.setData((data) => ({
                                    ...data,
                                    delivery_costs: [
                                        ...data.delivery_costs,
                                        { area: '', cost: '0' },
                                    ],
                                }))
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700"
                        >
                            <Plus className="size-4" />
                            Add delivery area
                        </button>
                    </fieldset>
                    {editing && (
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) =>
                                    form.setData(
                                        'is_active',
                                        event.target.checked,
                                    )
                                }
                            />
                            Branch is active
                        </label>
                    )}
                    <div className="flex justify-end gap-2">
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
                            className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            Save branch
                        </button>
                    </div>
                </form>
            </FormModal>
        </>
    );
}
