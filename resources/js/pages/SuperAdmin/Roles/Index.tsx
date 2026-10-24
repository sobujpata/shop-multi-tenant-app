import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Shield, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    AdminPage,
    FormModal,
    Panel,
    TextField,
} from '@/components/super-admin/admin-page';

type RoleRow = {
    id: number;
    name: string;
    permissions: string[];
    users_count: number;
    is_system: boolean;
};

const emptyRole = { name: '', permissions: [] as string[] };

export default function RolesIndex({
    roles,
    permissions,
}: {
    roles: RoleRow[];
    permissions: string[];
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<RoleRow | null>(null);
    const form = useForm(emptyRole);

    const openModal = (role?: RoleRow) => {
        setEditing(role ?? null);
        form.clearErrors();
        form.setData(
            role
                ? { name: role.name, permissions: role.permissions }
                : emptyRole,
        );
        setOpen(true);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const options = {
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        };

        if (editing) {
            form.put(`/super-admin/roles/${editing.id}`, options);
        } else {
            form.post('/super-admin/roles', options);
        }
    };

    const togglePermission = (permission: string) => {
        form.setData(
            'permissions',
            form.data.permissions.includes(permission)
                ? form.data.permissions.filter((item) => item !== permission)
                : [...form.data.permissions, permission],
        );
    };

    return (
        <>
            <Head title="Roles" />
            <AdminPage
                title="Roles"
                description="Create staff roles and control the permissions granted to each role."
                action={
                    <button
                        type="button"
                        onClick={() => openModal()}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        <Plus className="size-4" /> New role
                    </button>
                }
            >
                <Panel>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">Role</th>
                                    <th className="px-5 py-3">Permissions</th>
                                    <th className="px-5 py-3">Staff</th>
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {roles.map((role) => (
                                    <tr key={role.id}>
                                        <td className="px-5 py-4 font-semibold">
                                            <span className="flex items-center gap-2">
                                                {role.name}
                                                {role.is_system && (
                                                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-indigo-700 uppercase dark:bg-indigo-950 dark:text-indigo-300">
                                                        System
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="max-w-xl px-5 py-4 text-slate-500 dark:text-slate-400">
                                            {role.permissions.length
                                                ? role.permissions.join(', ')
                                                : 'No permissions'}
                                        </td>
                                        <td className="px-5 py-4">
                                            {role.users_count}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openModal(role)
                                                    }
                                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium dark:border-slate-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`Delete ${role.name}`}
                                                    disabled={
                                                        role.is_system ||
                                                        role.users_count > 0
                                                    }
                                                    title={
                                                        role.is_system
                                                            ? 'System roles cannot be deleted'
                                                            : role.users_count >
                                                                0
                                                              ? 'Reassign staff before deleting this role'
                                                              : undefined
                                                    }
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                `Delete role ${role.name}?`,
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/super-admin/roles/${role.id}`,
                                                            );
                                                        }
                                                    }}
                                                    className="rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {roles.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No roles found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            </AdminPage>
            <FormModal
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? 'Edit role' : 'Create role'}
            >
                <form onSubmit={submit} className="space-y-5">
                    <TextField
                        label="Role name"
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        error={form.errors.name}
                        disabled={editing?.is_system}
                        required
                    />
                    {editing?.is_system && (
                        <p className="-mt-3 text-xs text-slate-500 dark:text-slate-400">
                            System role names are reserved to keep staff access
                            working.
                        </p>
                    )}
                    <fieldset className="space-y-2">
                        <legend className="text-sm font-medium">
                            Permissions
                        </legend>
                        {form.errors.permissions && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                                {form.errors.permissions}
                            </p>
                        )}
                        <div className="grid max-h-64 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2 dark:border-slate-800">
                            {permissions.map((permission) => (
                                <label
                                    key={permission}
                                    className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    <input
                                        type="checkbox"
                                        checked={form.data.permissions.includes(
                                            permission,
                                        )}
                                        onChange={() =>
                                            togglePermission(permission)
                                        }
                                        className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700"
                                    />
                                    {permission}
                                </label>
                            ))}
                            {permissions.length === 0 && (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Create permissions before assigning them to
                                    a role.
                                </p>
                            )}
                        </div>
                        {form.errors['permissions.0'] && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                                {form.errors['permissions.0']}
                            </p>
                        )}
                    </fieldset>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium dark:border-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Shield className="size-4" />
                            {form.processing ? 'Saving…' : 'Save role'}
                        </button>
                    </div>
                </form>
            </FormModal>
        </>
    );
}
