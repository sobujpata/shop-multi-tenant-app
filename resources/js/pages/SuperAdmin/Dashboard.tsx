import { Head } from '@inertiajs/react';
import { Activity, CreditCard, DollarSign, Store } from 'lucide-react';
import { AdminPage, Panel } from '@/components/super-admin/admin-page';

type ActivityRow = {
    id: number;
    description: string;
    event: string | null;
    created_at: string;
    causer?: { name?: string } | null;
};

export default function SuperAdminDashboard({
    metrics,
    recentActivity,
}: {
    metrics: {
        tenants: number;
        activeSubscriptions: number;
        todaysOrders: number;
        revenue: string | number;
    };
    recentActivity: ActivityRow[];
}) {
    const cards = [
        { label: 'Tenants', value: metrics.tenants, icon: Store },
        {
            label: 'Active subscriptions',
            value: metrics.activeSubscriptions,
            icon: CreditCard,
        },
        {
            label: "Today's orders",
            value: metrics.todaysOrders,
            icon: Activity,
        },
        {
            label: 'Paid revenue',
            value: `৳${Number(metrics.revenue).toLocaleString('en-BD')}`,
            icon: DollarSign,
        },
    ];

    return (
        <>
            <Head title="Super Admin Dashboard" />
            <AdminPage
                title="Overview"
                description="Marketplace performance and recent administrative activity."
            >
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
                                <span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                                    <Icon className="size-5" />
                                </span>
                            </div>
                        </Panel>
                    ))}
                </div>
                <Panel>
                    <div className="flex items-center gap-2 border-b border-slate-200 p-5 dark:border-slate-800">
                        <Activity className="size-4 text-indigo-600" />
                        <h2 className="font-semibold">Recent activity</h2>
                    </div>
                    {recentActivity.length === 0 ? (
                        <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
                            No activity has been recorded yet.
                        </p>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentActivity.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex flex-col justify-between gap-1 px-5 py-4 sm:flex-row sm:items-center"
                                >
                                    <div>
                                        <p className="text-sm font-medium">
                                            {activity.description}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {activity.causer?.name ?? 'System'}{' '}
                                            · {activity.event ?? 'activity'}
                                        </p>
                                    </div>
                                    <time className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(
                                            activity.created_at,
                                        ).toLocaleString()}
                                    </time>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>
            </AdminPage>
        </>
    );
}
