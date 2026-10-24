import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, MapPin, PackageCheck } from 'lucide-react';
import { useState } from 'react';
import ReviewForm from '@/components/storefront/ReviewForm';
import { imageUrl, money } from '@/components/storefront/types';

type Image = { id: number; path: string; is_primary: boolean };
type Item = {
    id: number;
    product_id: number;
    variant_id: number;
    name: string;
    price: string | number;
    quantity: number;
    product: { id: number; name: string; slug: string; images: Image[] };
    variant: { size: string | null; color: string | null; sku: string };
};
type SubOrder = {
    id: number;
    status: string;
    total: string | number;
    tenant: { id: number; name: string };
    branch: { id: number; name: string; city: string; address: string };
    items: Item[];
};
type Order = {
    id: number;
    order_no: string;
    created_at: string;
    shipping_address: {
        recipient_name: string;
        phone: string;
        address_line: string;
        division?: string;
        city?: string;
        district: string;
        upazila?: string | null;
        postal_code: string | null;
        delivery_areas?: Record<
            string,
            { area: string; cost: string | number }
        >;
    };
    subtotal: string | number;
    shipping_fee: string | number;
    discount: string | number;
    total: string | number;
    payment_method: string;
    payment_status: string;
    sub_orders: SubOrder[];
};

function Status({ status }: { status: string }) {
    const cancelled = status === 'cancelled';
    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                cancelled
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
        >
            {status}
        </span>
    );
}

export default function CustomerOrderShow({
    order,
    reviewedProductIds,
}: {
    order: Order;
    reviewedProductIds: number[];
}) {
    const [cancelling, setCancelling] = useState<number | null>(null);
    const reviewed = new Set(reviewedProductIds);
    const reviewFormsShown = new Set<number>();

    function cancelSubOrder(subOrderId: number) {
        if (cancelling !== null) return;
        setCancelling(subOrderId);
        router.post(
            `/customer/account/orders/${order.id}/sub-orders/${subOrderId}/cancel`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setCancelling(null),
            },
        );
    }

    return (
        <>
            <Head title={`Order ${order.order_no}`} />
            <Link
                href="/customer/account/orders"
                className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" /> Back to orders
            </Link>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-primary">
                        Order details
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">
                        Order {order.order_no}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Placed {new Date(order.created_at).toLocaleString()}
                    </p>
                </div>
                <Link
                    href={`/customer/account/orders/${order.id}/tracking`}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                    <PackageCheck className="size-4" /> Track order
                </Link>
            </div>

            <div className="mt-7 space-y-6">
                {order.sub_orders.map((subOrder) => (
                    <section
                        key={subOrder.id}
                        className="rounded-2xl border border-border p-5"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="font-semibold">
                                    {subOrder.tenant.name}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {subOrder.branch.name} ·{' '}
                                    {subOrder.branch.city}
                                </p>
                            </div>
                            <Status status={subOrder.status} />
                        </div>
                        <div className="mt-4 divide-y divide-border border-y border-border">
                            {subOrder.items.map((item) => {
                                const image = item.product.images[0];
                                const canReview =
                                    subOrder.status === 'delivered' &&
                                    !reviewed.has(item.product_id) &&
                                    !reviewFormsShown.has(item.product_id);

                                if (canReview)
                                    reviewFormsShown.add(item.product_id);

                                return (
                                    <div key={item.id} className="py-4">
                                        <div className="flex gap-4">
                                            <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                                                {image && (
                                                    <img
                                                        src={
                                                            imageUrl(
                                                                image.path,
                                                            ) ?? undefined
                                                        }
                                                        alt=""
                                                        className="size-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <Link
                                                    href={`/shop/${item.product.slug}`}
                                                    className="font-medium hover:text-primary"
                                                >
                                                    {item.name}
                                                </Link>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {[
                                                        item.variant.size,
                                                        item.variant.color,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}{' '}
                                                    {item.variant.sku
                                                        ? `· ${item.variant.sku}`
                                                        : ''}
                                                </p>
                                                <div className="mt-4 space-y-2 border-t border-border pt-4">
                                                    {order.sub_orders.map(
                                                        (subOrder) => {
                                                            const deliveryArea =
                                                                order
                                                                    .shipping_address
                                                                    .delivery_areas?.[
                                                                    String(
                                                                        subOrder
                                                                            .branch
                                                                            .id,
                                                                    )
                                                                ];

                                                            return deliveryArea ? (
                                                                <p
                                                                    key={
                                                                        subOrder.id
                                                                    }
                                                                    className="flex justify-between gap-3 text-sm"
                                                                >
                                                                    <span>
                                                                        {
                                                                            subOrder
                                                                                .branch
                                                                                .name
                                                                        }
                                                                        :{' '}
                                                                        {
                                                                            deliveryArea.area
                                                                        }
                                                                    </span>
                                                                    <span>
                                                                        {money(
                                                                            deliveryArea.cost,
                                                                        )}
                                                                    </span>
                                                                </p>
                                                            ) : null;
                                                        },
                                                    )}
                                                </div>
                                                <p className="mt-1 text-sm">
                                                    {money(item.price)} ×{' '}
                                                    {item.quantity}
                                                </p>
                                            </div>
                                            <p className="font-medium">
                                                {money(
                                                    Number(item.price) *
                                                        item.quantity,
                                                )}
                                            </p>
                                        </div>
                                        {canReview && (
                                            <div className="mt-4">
                                                <ReviewForm
                                                    productId={item.product_id}
                                                    orderItemId={item.id}
                                                    orderLabel={order.order_no}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm">
                                Branch total{' '}
                                <strong>{money(subOrder.total)}</strong>
                            </p>
                            {subOrder.status === 'pending' && (
                                <button
                                    type="button"
                                    disabled={cancelling !== null}
                                    onClick={() => cancelSubOrder(subOrder.id)}
                                    className="rounded-full border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950"
                                >
                                    {cancelling === subOrder.id
                                        ? 'Cancelling…'
                                        : 'Cancel branch order'}
                                </button>
                            )}
                        </div>
                    </section>
                ))}

                <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                    <section className="rounded-2xl border border-border p-5">
                        <h3 className="flex items-center gap-2 font-semibold">
                            <MapPin className="size-4 text-primary" /> Delivery
                            address
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {order.shipping_address.recipient_name}
                            <br />
                            {order.shipping_address.phone}
                            <br />
                            {order.shipping_address.address_line}
                            <br />
                            {order.shipping_address.division ??
                                order.shipping_address.city}
                            , {order.shipping_address.district}
                            {order.shipping_address.upazila
                                ? `, ${order.shipping_address.upazila}`
                                : ''}
                            {order.shipping_address.postal_code
                                ? ` ${order.shipping_address.postal_code}`
                                : ''}
                        </p>
                    </section>
                    <section className="h-fit rounded-2xl border border-border p-5">
                        <h3 className="font-semibold">Payment summary</h3>
                        <dl className="mt-4 space-y-3 text-sm">
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Subtotal
                                </dt>
                                <dd>{money(order.subtotal)}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Shipping
                                </dt>
                                <dd>{money(order.shipping_fee)}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                    Discount
                                </dt>
                                <dd>-{money(order.discount)}</dd>
                            </div>
                            <div className="flex justify-between gap-3 border-t border-border pt-3 font-semibold">
                                <dt>Total</dt>
                                <dd>{money(order.total)}</dd>
                            </div>
                        </dl>
                        <p className="mt-3 text-xs text-muted-foreground capitalize">
                            {order.payment_method} · {order.payment_status}
                        </p>
                    </section>
                </div>
            </div>
        </>
    );
}
