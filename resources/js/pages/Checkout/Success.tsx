import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, PackageCheck } from 'lucide-react';
import { money } from '@/components/storefront/types';

type Order = {
    id: number;
    order_no: string;
    total: number | string;
    shipping_fee: number | string;
    shipping_address: {
        delivery_areas?: Record<
            string,
            { area: string; cost: number | string }
        >;
    };
    payment_method: string;
    payment_status: string;
    sub_orders: Array<{
        id: number;
        total: number | string;
        status: string;
        branch: { id: number; name: string };
        items: Array<{
            id: number;
            name: string;
            quantity: number;
            price: number | string;
        }>;
    }>;
};

export default function CheckoutSuccess({ order }: { order: Order }) {
    return (
        <>
            <Head title="Order placed" />
            <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
                <div className="rounded-3xl border border-border bg-card p-7 text-center shadow-sm sm:p-12">
                    <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="size-9" />
                    </span>
                    <p className="mt-6 text-sm font-semibold tracking-[0.15em] text-primary uppercase">
                        Order confirmed
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        Thank you for your order
                    </h1>
                    <p className="mt-3 text-muted-foreground">
                        We’ve sent your order confirmation and will keep you
                        updated as it progresses.
                    </p>
                    <div className="mx-auto mt-7 grid max-w-md grid-cols-2 gap-3 rounded-2xl bg-muted/50 p-4 text-left">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Order number
                            </p>
                            <p className="mt-1 font-semibold">
                                {order.order_no}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Order total
                            </p>
                            <p className="mt-1 font-semibold">
                                {money(order.total)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Payment
                            </p>
                            <p className="mt-1 font-semibold capitalize">
                                {order.payment_method}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Payment status
                            </p>
                            <p className="mt-1 font-semibold capitalize">
                                {order.payment_status}
                            </p>
                        </div>
                    </div>
                    <div className="mx-auto mt-7 max-w-md space-y-3 text-left">
                        <div className="rounded-xl border border-border p-4">
                            <p className="text-sm font-semibold">
                                Delivery areas
                            </p>
                            {order.sub_orders.map((subOrder) => {
                                const deliveryArea =
                                    order.shipping_address.delivery_areas?.[
                                        String(subOrder.branch.id)
                                    ];

                                return deliveryArea ? (
                                    <p
                                        key={subOrder.id}
                                        className="mt-2 flex justify-between gap-3 text-sm text-muted-foreground"
                                    >
                                        <span>
                                            {subOrder.branch.name}:{' '}
                                            {deliveryArea.area}
                                        </span>
                                        <span>{money(deliveryArea.cost)}</span>
                                    </p>
                                ) : null;
                            })}
                            <p className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-medium">
                                <span>Delivery total</span>
                                <span>{money(order.shipping_fee)}</span>
                            </p>
                        </div>
                        {order.sub_orders.map((subOrder) => (
                            <div
                                key={subOrder.id}
                                className="rounded-xl border border-border p-4"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="flex items-center gap-2 text-sm font-semibold">
                                        <PackageCheck className="size-4 text-primary" />{' '}
                                        Shipment
                                    </p>
                                    <span className="text-xs text-muted-foreground capitalize">
                                        {subOrder.status}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {subOrder.items
                                        .map(
                                            (item) =>
                                                `${item.name} × ${item.quantity}`,
                                        )
                                        .join(', ')}
                                </p>
                            </div>
                        ))}
                    </div>
                    <Link
                        href="/shop"
                        className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
                    >
                        Continue shopping <ArrowRight className="size-4" />
                    </Link>
                </div>
            </div>
        </>
    );
}
