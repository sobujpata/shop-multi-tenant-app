import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Plus, Search, UserRound, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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

type StaffUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    roles: string[];
    branch: { id: number; name: string } | null;
    tenant: { id: number; name: string } | null;
    permissions: string[];
};

type Paginated<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
};

type UserForm = {
    name: string;
    email: string;
    phone: string;
    role?: string;
    tenant_id?: string;
    branch_id?: string;
    permissions?: string[];
    password: string;
    password_confirmation: string;
};

const emptyUser: UserForm = {
    name: '',
    email: '',
    phone: '',
    role: '',
    tenant_id: '',
    branch_id: '',
    permissions: [],
    password: '',
    password_confirmation: '',
};

export default function UsersIndex({
    users,
    branches,
    tenants,
    roles,
    permissions,
    isSuperAdmin,
    filters,
}: {
    users: Paginated<StaffUser>;
    branches: Array<{ id: number; tenant_id: number; name: string }>;
    tenants: Array<{ id: number; name: string }>;
    roles: string[];
    permissions: string[];
    isSuperAdmin: boolean;
    filters: { search: string };
}) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<StaffUser | null>(null);
    const initialSearch = useRef(true);
    const baseUrl = isSuperAdmin ? '/super-admin/users' : '/tenant/users';
    const defaultRole = isSuperAdmin
        ? (roles.find((role) => role === 'tenant-admin') ?? roles[0] ?? '')
        : 'branch-manager';
    const form = useForm<UserForm>({
        ...emptyUser,
        role: defaultRole,
    });
    const availableBranches = isSuperAdmin
        ? branches.filter(
              (branch) => String(branch.tenant_id) === form.data.tenant_id,
          )
        : branches;

    useEffect(() => {
        if (initialSearch.current) {
            initialSearch.current = false;
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                baseUrl,
                { search: search || undefined },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [baseUrl, search]);

    const openModal = (user?: StaffUser) => {
        const selectedUser = user ?? null;
        setEditing(selectedUser);
        form.clearErrors();
        form.setData(
            selectedUser
                ? {
                      ...emptyUser,
                      name: selectedUser.name,
                      email: selectedUser.email,
                      phone: selectedUser.phone ?? '',
                      role: selectedUser.roles[0] ?? defaultRole,
                      tenant_id: selectedUser.tenant
                          ? String(selectedUser.tenant.id)
                          : '',
                      branch_id: selectedUser.branch
                          ? String(selectedUser.branch.id)
                          : '',
                      permissions: selectedUser.permissions,
                  }
                : { ...emptyUser, role: defaultRole },
        );
        setOpen(true);
    };

    const isEditingSelf = editing?.id === auth.user.id;
    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const options = { onSuccess: () => setOpen(false) };
        if (editing) {
            form.transform((data): UserForm => {
                if (!isEditingSelf) return data;
                const {
                    role: _role,
                    branch_id: _branchId,
                    tenant_id: _tenantId,
                    permissions: _permissions,
                    ...profile
                } = data;
                return profile;
            });
            form.put(`${baseUrl}/${editing.id}`, options);
        } else {
            form.transform((data): UserForm => {
                if (isSuperAdmin) return data;
                const {
                    tenant_id: _tenantId,
                    permissions: _permissions,
                    ...tenantData
                } = data;
                return tenantData;
            });
            form.post(baseUrl, options);
        }
    };

    return (
        <>
            <Head title="Users" />
            <AdminPage
                title="Users"
                description={
                    isSuperAdmin
                        ? 'Manage staff accounts, roles, and direct permissions across the marketplace.'
                        : 'Manage staff accounts and their tenant roles.'
                }
                action={
                    <button
                        type="button"
                        onClick={() => openModal()}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        Add user
                    </button>
                }
            >
                <Panel>
                    <div className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
                        <Search
                            className="size-4 text-slate-400"
                            aria-hidden="true"
                        />
                        <SearchForm
                            value={search}
                            onChange={setSearch}
                            placeholder="Search users"
                        />
                        <span className="ml-auto text-sm whitespace-nowrap text-slate-500 dark:text-slate-400">
                            {users.total} {users.total === 1 ? 'user' : 'users'}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">User</th>
                                    <th className="px-5 py-3">Role</th>
                                    {isSuperAdmin && (
                                        <>
                                            <th className="px-5 py-3">
                                                Tenant
                                            </th>
                                            <th className="px-5 py-3">
                                                Direct permissions
                                            </th>
                                        </>
                                    )}
                                    <th className="px-5 py-3">
                                        Assigned branch
                                    </th>
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {users.data.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                                                    <UserRound
                                                        className="size-4"
                                                        aria-hidden="true"
                                                    />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold">
                                                        {user.name}
                                                        {user.id ===
                                                            auth.user.id && (
                                                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                                You
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {user.email}
                                                        {user.phone
                                                            ? ` · ${user.phone}`
                                                            : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge>
                                                {user.roles[0] ===
                                                'tenant-admin'
                                                    ? 'Tenant admin'
                                                    : (user.roles[0]
                                                          ?.replaceAll('-', ' ')
                                                          .replace(
                                                              /\b\w/g,
                                                              (letter) =>
                                                                  letter.toUpperCase(),
                                                          ) ?? 'No role')}
                                            </StatusBadge>
                                        </td>
                                        {isSuperAdmin && (
                                            <>
                                                <td className="px-5 py-4 text-muted-foreground">
                                                    {user.tenant?.name ??
                                                        'Platform'}
                                                </td>
                                                <td className="px-5 py-4 text-muted-foreground">
                                                    {user.permissions.length
                                                        ? user.permissions.join(
                                                              ', ',
                                                          )
                                                        : 'None'}
                                                </td>
                                            </>
                                        )}
                                        <td className="px-5 py-4 text-muted-foreground">
                                            {user.branch?.name ??
                                                'All branches'}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => openModal(user)}
                                                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {users.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={isSuperAdmin ? 6 : 4}
                                            className="px-5 py-12 text-center text-muted-foreground"
                                        >
                                            <Users
                                                className="mx-auto mb-2 size-5"
                                                aria-hidden="true"
                                            />
                                            No staff users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={users.links} />
                </Panel>
            </AdminPage>

            <FormModal
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? 'Edit staff user' : 'Create staff user'}
            >
                <form onSubmit={submit} className="space-y-4">
                    <TextField
                        label="Full name"
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        error={form.errors.name}
                        required
                    />
                    <TextField
                        label="Email address"
                        type="email"
                        value={form.data.email}
                        onChange={(event) =>
                            form.setData('email', event.target.value)
                        }
                        error={form.errors.email}
                        required
                    />
                    <TextField
                        label="Phone (optional)"
                        value={form.data.phone}
                        onChange={(event) =>
                            form.setData('phone', event.target.value)
                        }
                        error={form.errors.phone}
                    />

                    {isEditingSelf ? (
                        <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                            Your own role, tenant, branch assignment, and
                            permissions can’t be changed here.
                        </p>
                    ) : (
                        <>
                            <SelectField
                                label="Role"
                                value={form.data.role ?? ''}
                                onChange={(event) => {
                                    const role = event.target.value;
                                    form.setData((current) => ({
                                        ...current,
                                        role,
                                        tenant_id:
                                            role === 'super-admin'
                                                ? ''
                                                : current.tenant_id,
                                        branch_id: '',
                                    }));
                                }}
                                error={form.errors.role}
                            >
                                {roles.map((role) => (
                                    <option key={role} value={role}>
                                        {role
                                            .replaceAll('-', ' ')
                                            .replace(/\b\w/g, (letter) =>
                                                letter.toUpperCase(),
                                            )}
                                    </option>
                                ))}
                            </SelectField>

                            {isSuperAdmin &&
                                form.data.role !== 'super-admin' && (
                                    <SelectField
                                        label="Tenant"
                                        value={form.data.tenant_id ?? ''}
                                        onChange={(event) =>
                                            form.setData((current) => ({
                                                ...current,
                                                tenant_id: event.target.value,
                                                branch_id: '',
                                            }))
                                        }
                                        error={form.errors.tenant_id}
                                        required
                                    >
                                        <option value="">
                                            Select a tenant
                                        </option>
                                        {tenants.map((tenant) => (
                                            <option
                                                key={tenant.id}
                                                value={tenant.id}
                                            >
                                                {tenant.name}
                                            </option>
                                        ))}
                                    </SelectField>
                                )}

                            {['branch-manager', 'sales-man'].includes(
                                form.data.role ?? '',
                            ) && (
                                <SelectField
                                    label="Assigned branch"
                                    value={form.data.branch_id ?? ''}
                                    onChange={(event) =>
                                        form.setData(
                                            'branch_id',
                                            event.target.value,
                                        )
                                    }
                                    error={form.errors.branch_id}
                                    required
                                >
                                    <option value="">Select a branch</option>
                                    {availableBranches.map((branch) => (
                                        <option
                                            key={branch.id}
                                            value={branch.id}
                                        >
                                            {branch.name}
                                        </option>
                                    ))}
                                </SelectField>
                            )}

                            {isSuperAdmin && (
                                <fieldset className="space-y-3 rounded-lg border border-border p-4">
                                    <legend className="px-1 text-sm font-semibold">
                                        Direct permissions
                                    </legend>
                                    <p className="text-xs text-muted-foreground">
                                        These permissions are added in addition
                                        to the selected role’s permissions.
                                    </p>
                                    <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
                                        {permissions.map((permission) => (
                                            <label
                                                key={permission}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={(
                                                        form.data.permissions ??
                                                        []
                                                    ).includes(permission)}
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'permissions',
                                                            event.target.checked
                                                                ? [
                                                                      ...(form
                                                                          .data
                                                                          .permissions ??
                                                                          []),
                                                                      permission,
                                                                  ]
                                                                : (
                                                                      form.data
                                                                          .permissions ??
                                                                      []
                                                                  ).filter(
                                                                      (item) =>
                                                                          item !==
                                                                          permission,
                                                                  ),
                                                        )
                                                    }
                                                    className="size-4 accent-primary"
                                                />
                                                {permission}
                                            </label>
                                        ))}
                                    </div>
                                    {form.errors.permissions && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.permissions}
                                        </p>
                                    )}
                                </fieldset>
                            )}
                        </>
                    )}

                    <TextField
                        label={
                            editing
                                ? 'New password (leave blank to keep current)'
                                : 'Password'
                        }
                        type="password"
                        autoComplete="new-password"
                        value={form.data.password}
                        onChange={(event) =>
                            form.setData('password', event.target.value)
                        }
                        error={form.errors.password}
                        required={!editing}
                    />
                    <TextField
                        label="Confirm password"
                        type="password"
                        autoComplete="new-password"
                        value={form.data.password_confirmation}
                        onChange={(event) =>
                            form.setData(
                                'password_confirmation',
                                event.target.value,
                            )
                        }
                        required={!editing}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="h-10 rounded-lg border border-border px-4 text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                        >
                            {form.processing
                                ? 'Saving…'
                                : editing
                                  ? 'Save changes'
                                  : 'Create user'}
                        </button>
                    </div>
                </form>
            </FormModal>
        </>
    );
}
