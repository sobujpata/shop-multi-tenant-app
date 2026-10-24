import { Head, router } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import {
    AdminPage,
    Pagination,
    Panel,
    StatusBadge,
} from '@/components/super-admin/admin-page';

type ActivityRow = {
    id: number;
    log_name: string | null;
    description: string;
    event: string | null;
    subject_type: string | null;
    subject_id: number | null;
    created_at: string;
    causer?: { name?: string; email?: string } | null;
    properties?: Record<string, unknown> | null;
};

type PageData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Filters = {
    user_id: string | number;
    subject_type: string;
    from: string;
    to: string;
    search: string;
};

const inputClass =
    'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950';

export default function ActivityLogsIndex({
    activities,
    filters,
    users,
    subjectTypes,
    selectedActivity,
}: {
    activities: PageData<ActivityRow>;
    filters: Filters;
    users: Array<{ id: number; name: string; email: string }>;
    subjectTypes: Array<{ value: string; label: string }>;
    selectedActivity: ActivityRow | null;
}) {
    const [form, setForm] = useState<Filters>(filters);

    const applyFilters = (event: React.FormEvent) => {
        event.preventDefault();
        router.get('/super-admin/activity-logs', form, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };
    const showDetails = (activity: ActivityRow) => {
        router.get(
            '/super-admin/activity-logs',
            { ...filters, detail: activity.id },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };
    const closeDetails = () => {
        router.get('/super-admin/activity-logs', filters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <>
            <Head title="Activity logs" />
            <AdminPage
                title="Activity logs"
                description="Review administrative changes and inspect recorded before-and-after values."
            >
                <Panel>
                    <form
                        onSubmit={applyFilters}
                        className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 xl:grid-cols-6 dark:border-slate-800"
                    >
                        <input
                            value={form.search}
                            onChange={(event) =>
                                setForm({ ...form, search: event.target.value })
                            }
                            placeholder="Search description"
                            className={`${inputClass} sm:col-span-2`}
                        />
                        <select
                            value={form.user_id}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    user_id: event.target.value,
                                })
                            }
                            className={inputClass}
                        >
                            <option value="">All users</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={form.subject_type}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    subject_type: event.target.value,
                                })
                            }
                            className={inputClass}
                        >
                            <option value="">All subjects</option>
                            {subjectTypes.map((subject) => (
                                <option
                                    key={subject.value}
                                    value={subject.value}
                                >
                                    {subject.label}
                                </option>
                            ))}
                        </select>
                        <input
                            type="date"
                            aria-label="From date"
                            value={form.from}
                            onChange={(event) =>
                                setForm({ ...form, from: event.target.value })
                            }
                            className={inputClass}
                        />
                        <input
                            type="date"
                            aria-label="To date"
                            value={form.to}
                            onChange={(event) =>
                                setForm({ ...form, to: event.target.value })
                            }
                            className={inputClass}
                        />
                        <div className="flex gap-2 sm:col-span-2 xl:col-span-6">
                            <button
                                type="submit"
                                className="h-9 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                Apply filters
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const cleared = {
                                        user_id: '',
                                        subject_type: '',
                                        from: '',
                                        to: '',
                                        search: '',
                                    };
                                    setForm(cleared);
                                    router.get('/super-admin/activity-logs');
                                }}
                                className="h-9 rounded-lg border border-slate-300 px-4 text-sm dark:border-slate-700"
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">Activity</th>
                                    <th className="px-5 py-3">User</th>
                                    <th className="px-5 py-3">Subject</th>
                                    <th className="px-5 py-3">Event</th>
                                    <th className="px-5 py-3">When</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {activities.data.map((activity) => (
                                    <tr
                                        key={activity.id}
                                        onClick={() => showDetails(activity)}
                                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                    >
                                        <td className="px-5 py-4 font-medium">
                                            {activity.description}
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                                            {activity.causer?.name ?? 'System'}
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                                            {activity.subject_type
                                                ?.split('\\')
                                                .pop() ?? '—'}
                                            {activity.subject_id
                                                ? ` #${activity.subject_id}`
                                                : ''}
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge>
                                                {activity.event ?? 'action'}
                                            </StatusBadge>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(
                                                activity.created_at,
                                            ).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {activities.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No activity found for these filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={activities.links} />
                </Panel>
            </AdminPage>
            {selectedActivity && (
                <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/40">
                    <button
                        type="button"
                        aria-label="Close activity details"
                        onClick={closeDetails}
                        className="absolute inset-0 cursor-default"
                    />
                    <aside
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="activity-detail-title"
                        className="relative z-10 h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    id="activity-detail-title"
                                    className="text-lg font-semibold"
                                >
                                    Activity details
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {selectedActivity.description}
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close"
                                onClick={closeDetails}
                                className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
                            <div>
                                <dt className="text-xs text-slate-500 dark:text-slate-400">
                                    User
                                </dt>
                                <dd className="mt-1 font-medium">
                                    {selectedActivity.causer?.name ?? 'System'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-slate-500 dark:text-slate-400">
                                    Subject
                                </dt>
                                <dd className="mt-1 font-medium">
                                    {selectedActivity.subject_type
                                        ?.split('\\')
                                        .pop() ?? '—'}{' '}
                                    #{selectedActivity.subject_id ?? ''}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-slate-500 dark:text-slate-400">
                                    Event
                                </dt>
                                <dd className="mt-1 font-medium">
                                    {selectedActivity.event ?? 'Action'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-slate-500 dark:text-slate-400">
                                    Date
                                </dt>
                                <dd className="mt-1 font-medium">
                                    {new Date(
                                        selectedActivity.created_at,
                                    ).toLocaleString()}
                                </dd>
                            </div>
                        </dl>
                        <div className="mt-6 space-y-5">
                            {(['old', 'attributes'] as const).map((key) => {
                                const values =
                                    selectedActivity.properties?.[key];
                                if (
                                    !values ||
                                    typeof values !== 'object' ||
                                    Array.isArray(values)
                                ) {
                                    return null;
                                }
                                const entries = Object.entries(
                                    values as Record<string, unknown>,
                                );

                                return (
                                    <section key={key}>
                                        <h3 className="mb-2 text-sm font-semibold">
                                            {key === 'old'
                                                ? 'Previous values'
                                                : 'New values'}
                                        </h3>
                                        {entries.length === 0 ? (
                                            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
                                                No{' '}
                                                {key === 'old'
                                                    ? 'previous'
                                                    : 'new'}{' '}
                                                values recorded.
                                            </p>
                                        ) : (
                                            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                                                {entries.map(
                                                    ([name, value]) => (
                                                        <div
                                                            key={name}
                                                            className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3 p-3 text-sm"
                                                        >
                                                            <span className="font-medium text-slate-500 dark:text-slate-400">
                                                                {name}
                                                            </span>
                                                            <pre className="overflow-x-auto font-sans break-words whitespace-pre-wrap">
                                                                {typeof value ===
                                                                'string'
                                                                    ? value
                                                                    : JSON.stringify(
                                                                          value,
                                                                          null,
                                                                          2,
                                                                      )}
                                                            </pre>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}
