import { usePage } from '@inertiajs/react';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { tenantReadOnly } = usePage<{ tenantReadOnly?: boolean }>().props;

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            {tenantReadOnly && (
                <div
                    role="status"
                    className="mx-4 mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 sm:mx-6 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                >
                    Your subscription has expired. You can view your seller
                    panel, but changes are disabled until the subscription is
                    renewed.
                </div>
            )}
            {children}
        </AppLayoutTemplate>
    );
}
