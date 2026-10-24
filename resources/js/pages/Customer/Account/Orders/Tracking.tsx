import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import OrderTimeline from '@/components/storefront/OrderTimeline';

type TrackingEntry = {
    id: number;
    status: string;
    note: string | null;
    created_at: string;
};
type SubOrder = {
    id: number;
    status: string;
    tenant: { id: number; name: string };
    branch: { id: number; name: string; city: string };
    trackings: TrackingEntry[];
};
type Order = {
    id: number;
    order_no: string;
    sub_orders: SubOrder[];
};

export default function CustomerOrderTracking({ order }: { order: Order }) {
    return (
        <>
            <Head title={`Track order ${order.order_no}`} />
            <Link
                href={`/customer/account/orders/${order.id}`}
                className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" /> Order details
            </Link>
            <div>
                <p className="text-sm font-medium text-primary">
                    Shipment updates
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                    Track order {order.order_no}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Every branch shipment is tracked separately.
                </p>
            </div>
            <div className="mt-7 space-y-5">
                {order.sub_orders.map((subOrder) => (
                    <section
                        key={subOrder.id}
                        className="rounded-2xl border border-border p-5"
                    >
                        <div className="mb-5">
                            <h3 className="font-semibold">
                                {subOrder.tenant.name}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {subOrder.branch.name} · {subOrder.branch.city}
                            </p>
                        </div>
                        <OrderTimeline
                            status={subOrder.status}
                            trackings={subOrder.trackings}
                        />
                    </section>
                ))}
            </div>
        </>
    );
}
