import { Head, router, useForm } from '@inertiajs/react';
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    AdminPage,
    FormModal,
    Panel,
    TextField,
} from '@/components/super-admin/admin-page';

type PermissionRow = {
    id: number;
    name: string;
    roles_count: number;
};

export default function PermissionsIndex({
    permissions,
}: {
    permissions: PermissionRow[];
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<PermissionRow | null>(null);
    const form = useForm({ name: '' });

    const openModal = (permission?: PermissionRow) => {
        setEditing(permission ?? null);
        form.clearErrors();
        form.setData('name', permission?.name ?? '');
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
            form.put(`/super-admin/permissions/${editing.id}`, options);
        } else {
            form.post('/super-admin/permissions', options);
        }
    };

    return (
        <>
            <Head title="Permissions" />
            <AdminPage
                title="Permissions"
                description="Define the individual abilities that can be assigned to staff roles."
                action={
                    <button
                        type="button"
                        onClick={() => openModal()}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        <Plus className="size-4" /> New permission
                    </button>
                }
            >
                <Panel>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">Permission</th>
                                    <th className="px-5 py-3">
                                        Assigned roles
                                    </th>
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {permissions.map((permission) => (
                                    <tr key={permission.id}>
                                        <td className="px-5 py-4 font-semibold">
                                            {permission.name}
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                                            {permission.roles_count}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openModal(permission)
                                                    }
                                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium dark:border-slate-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`Delete ${permission.name}`}
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                `Delete ${permission.name}? This removes it from assigned roles and users.`,
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/super-admin/permissions/${permission.id}`,
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
                                {permissions.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No permissions found.
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
                title={editing ? 'Edit permission' : 'Create permission'}
            >
                <form onSubmit={submit} className="space-y-4">
                    <TextField
                        label="Permission name"
                        placeholder="for example, reports.view"
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        error={form.errors.name}
                        required
                    />
                    <p className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Use letters, numbers, periods, underscores, or hyphens.
                        Renaming keeps existing role and user assignments.
                    </p>
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
                            <KeyRound className="size-4" />
                            {form.processing ? 'Saving…' : 'Save permission'}
                        </button>
                    </div>
                </form>
            </FormModal>
        </>
    );
}
