import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, Trash2 } from 'lucide-react';
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

type TenantRow = {
    id: number;
    name: string;
    slug: string;
    email: string;
    phone: string | null;
    status: string;
    users: Array<{ name: string; email: string }>;
    active_subscription?: { plan?: { name: string } } | null;
};

type PageData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

const initialTenant = {
    name: '',
    slug: '',
    email: '',
    phone: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirmation: '',
};

export default function TenantsIndex({
    tenants,
    filters,
}: {
    tenants: PageData<TenantRow>;
    filters: { search: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<TenantRow | null>(null);
    const form = useForm(initialTenant);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(
                '/super-admin/tenants',
                { search },
                { preserveState: true, replace: true, preserveScroll: true },
            );
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search]);

    const openCreate = () => {
        setEditing(null);
        form.clearErrors();
        form.setData(initialTenant);
        setDialogOpen(true);
    };

    const openEdit = (tenant: TenantRow) => {
        setEditing(tenant);
        form.clearErrors();
        form.setData({
            ...initialTenant,
            name: tenant.name,
            slug: tenant.slug,
            email: tenant.email,
            phone: tenant.phone ?? '',
        });
        setDialogOpen(true);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const options = {
            onSuccess: () => {
                setDialogOpen(false);
                form.reset();
            },
        };
        if (editing) {
            form.put(`/super-admin/tenants/${editing.id}`, options);
        } else {
            form.post('/super-admin/tenants', options);
        }
    };

    return (
        <>
            <Head title="Tenants" />
            <AdminPage
                title="Tenants"
                description="Create and manage marketplace tenants and their tenant-admin access."
                action={
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        <Plus className="size-4" /> New tenant
                    </button>
                }
            >
                <Panel>
                    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center dark:border-slate-800">
                        <Search className="hidden size-4 text-slate-400 sm:block" />
                        <SearchForm
                            value={search}
                            onChange={setSearch}
                            placeholder="Search tenants by name, slug, or email"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">Tenant</th>
                                    <th className="px-5 py-3">Admin</th>
                                    <th className="px-5 py-3">Plan</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {tenants.data.map((tenant) => (
                                    <tr key={tenant.id}>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold">
                                                {tenant.name}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {tenant.slug} · {tenant.email}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            {tenant.users[0]?.email ?? '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            {tenant.active_subscription?.plan
                                                ?.name ?? '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge>
                                                {tenant.status}
                                            </StatusBadge>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(tenant)
                                                    }
                                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.patch(
                                                            `/super-admin/tenants/${tenant.id}/status`,
                                                            {
                                                                status:
                                                                    tenant.status ===
                                                                    'suspended'
                                                                        ? 'active'
                                                                        : 'suspended',
                                                            },
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                                                >
                                                    {tenant.status ===
                                                    'suspended'
                                                        ? 'Activate'
                                                        : 'Suspend'}
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`Delete ${tenant.name}`}
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                `Delete ${tenant.name} and its tenant data?`,
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/super-admin/tenants/${tenant.id}`,
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
                                {tenants.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No tenants match this search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={tenants.links} />
                </Panel>
            </AdminPage>
            <FormModal
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={editing ? 'Edit tenant' : 'Create tenant'}
            >
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                            label="Tenant name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            error={form.errors.name}
                            required
                        />
                        <TextField
                            label="Slug"
                            value={form.data.slug}
                            onChange={(event) =>
                                form.setData('slug', event.target.value)
                            }
                            error={form.errors.slug}
                            required
                        />
                        <TextField
                            label="Contact email"
                            type="email"
                            value={form.data.email}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                            error={form.errors.email}
                            required
                        />
                        <TextField
                            label="Phone"
                            value={form.data.phone}
                            onChange={(event) =>
                                form.setData('phone', event.target.value)
                            }
                            error={form.errors.phone}
                        />
                    </div>
                    {!editing && (
                        <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                            <h3 className="text-sm font-semibold">
                                Tenant admin access
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextField
                                    label="Admin name"
                                    value={form.data.admin_name}
                                    onChange={(event) =>
                                        form.setData(
                                            'admin_name',
                                            event.target.value,
                                        )
                                    }
                                    error={form.errors.admin_name}
                                    required
                                />
                                <TextField
                                    label="Admin email"
                                    type="email"
                                    value={form.data.admin_email}
                                    onChange={(event) =>
                                        form.setData(
                                            'admin_email',
                                            event.target.value,
                                        )
                                    }
                                    error={form.errors.admin_email}
                                    required
                                />
                                <TextField
                                    label="Temporary password"
                                    type="password"
                                    value={form.data.admin_password}
                                    onChange={(event) =>
                                        form.setData(
                                            'admin_password',
                                            event.target.value,
                                        )
                                    }
                                    error={form.errors.admin_password}
                                    required
                                />
                                <TextField
                                    label="Confirm password"
                                    type="password"
                                    value={
                                        form.data.admin_password_confirmation
                                    }
                                    onChange={(event) =>
                                        form.setData(
                                            'admin_password_confirmation',
                                            event.target.value,
                                        )
                                    }
                                    error={
                                        form.errors.admin_password_confirmation
                                    }
                                    required
                                />
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setDialogOpen(false)}
                            className="h-10 rounded-lg border border-slate-300 px-4 text-sm dark:border-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {form.processing
                                ? 'Saving…'
                                : editing
                                  ? 'Save changes'
                                  : 'Create tenant'}
                        </button>
                    </div>
                </form>
            </FormModal>
        </>
    );
}
