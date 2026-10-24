import { Head } from '@inertiajs/react';
import { Activity, CreditCard, DollarSign, Store } from 'lucide-react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { dashboard } from '@/routes';
import TenantDashboard from './Tenant/Dashboard';

type DashboardMetrics = {
    tenants: number;
    activeSubscriptions: number;
    todaysOrders: number;
    revenue: string | number;
};

type ActivityRow = {
    id: number;
    description: string;
    event: string | null;
    created_at: string;
    causer?: { name?: string } | null;
};

type TenantDashboardData = {
    metrics: {
        sales: number;
        orders: number;
        branches: number;
        products: number;
    };
    salesChart: Array<{ date: string; sales: number; orders: number }>;
    lowStock: Array<{
        id: number;
        quantity: number;
        branch: { name: string };
        variant: {
            sku: string;
            size: string | null;
            color: string | null;
            product: { name: string };
        };
    }>;
    branches: Array<{ id: number; name: string }>;
    canFilterBranches: boolean;
    filters: {
        order_type: string;
        date_preset: string;
        date_from: string;
        date_to: string;
        branch_id: string;
    };
};

export default function Dashboard({
    metrics,
    recentActivity = [],
    tenantDashboard,
}: {
    metrics?: DashboardMetrics;
    recentActivity?: ActivityRow[];
    tenantDashboard?: TenantDashboardData;
}) {
    if (tenantDashboard) {
        return <TenantDashboard {...tenantDashboard} />;
    }

    if (metrics) {
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
                <Head title="Dashboard" />
                <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Marketplace overview
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            A snapshot of marketplace performance and activity.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {cards.map(({ label, value, icon: Icon }) => (
                            <div
                                key={label}
                                className="rounded-xl border border-sidebar-border/70 bg-card p-5 dark:border-sidebar-border"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {label}
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold tracking-tight">
                                            {value}
                                        </p>
                                    </div>
                                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                                        <Icon
                                            className="size-5"
                                            aria-hidden="true"
                                        />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <section className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card dark:border-sidebar-border">
                        <div className="flex items-center gap-2 border-b border-sidebar-border/70 px-5 py-4 dark:border-sidebar-border">
                            <Activity
                                className="size-4 text-primary"
                                aria-hidden="true"
                            />
                            <h2 className="font-semibold">Recent activity</h2>
                        </div>
                        {recentActivity.length === 0 ? (
                            <p className="p-6 text-sm text-muted-foreground">
                                No activity has been recorded yet.
                            </p>
                        ) : (
                            <div className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {recentActivity.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {item.description}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {item.causer?.name ?? 'System'}{' '}
                                                · {item.event ?? 'activity'}
                                            </p>
                                        </div>
                                        <time
                                            dateTime={item.created_at}
                                            className="text-xs text-muted-foreground"
                                        >
                                            {new Date(
                                                item.created_at,
                                            ).toLocaleString()}
                                        </time>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
