import { Head, Link } from '@inertiajs/react';
import { Package } from 'lucide-react';
import { money } from '@/components/storefront/types';
import type { Paginated } from '@/components/storefront/types';

type SubOrder = { id: number; status: string; branch: string };
type Order = {
    id: number;
    order_no: string;
    created_at: string;
    total: string | number;
    payment_status: string;
    status: string;
    sub_orders: SubOrder[];
};

function StatusBadge({ status }: { status: string }) {
    const style =
        status === 'delivered'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            : status.includes('cancel')
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';

    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${style}`}
        >
            {status.replaceAll('_', ' ')}
        </span>
    );
}

export default function CustomerOrdersIndex({
    orders,
}: {
    orders: Paginated<Order>;
}) {
    return (
        <>
            <Head title="My orders" />
            <div className="mb-7">
                <p className="text-sm font-medium text-primary">Your account</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    My orders
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Review your orders and follow each branch shipment.
                </p>
            </div>
            {orders.data.length ? (
                <div className="space-y-4">
                    {orders.data.map((order) => (
                        <article
                            key={order.id}
                            className="rounded-2xl border border-border p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="font-semibold">
                                        Order {order.order_no}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {new Date(
                                            order.created_at,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                <StatusBadge status={order.status} />
                            </div>
                            <div className="mt-4 space-y-2">
                                {order.sub_orders.map((subOrder) => (
                                    <div
                                        key={subOrder.id}
                                        className="flex justify-between gap-3 text-sm"
                                    >
                                        <span>{subOrder.branch}</span>
                                        <span className="text-muted-foreground capitalize">
                                            {subOrder.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {order.payment_status} · Total
                                    </p>
                                    <p className="font-semibold">
                                        {money(order.total)}
                                    </p>
                                </div>
                                <Link
                                    href={`/customer/account/orders/${order.id}`}
                                    className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                                >
                                    View order
                                </Link>
                            </div>
                        </article>
                    ))}
                    {orders.last_page > 1 && (
                        <nav
                            className="flex justify-between pt-2"
                            aria-label="Order pages"
                        >
                            {orders.links.map((link, index) => (
                                <Link
                                    key={`${index}-${link.label}`}
                                    href={link.url ?? '#'}
                                    preserveScroll
                                    aria-disabled={!link.url}
                                    className={`rounded-lg border px-3 py-2 text-sm ${link.active ? 'border-primary bg-primary text-primary-foreground' : 'border-border'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                >
                                    {link.label
                                        .replace(/<[^>]*>/g, '')
                                        .replace('&laquo;', '')
                                        .replace('&raquo;', '')}
                                </Link>
                            ))}
                        </nav>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
                    <Package className="mx-auto size-9 text-muted-foreground/50" />
                    <p className="mt-4 font-medium">No orders yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Your purchases will appear here once you place an order.
                    </p>
                    <Link
                        href="/shop"
                        className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
                    >
                        Explore the shop
                    </Link>
                </div>
            )}
        </>
    );
}
