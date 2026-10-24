import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { CartPayload } from '@/components/storefront/CartDrawer';
import { imageUrl, money } from '@/components/storefront/types';
import { toast } from 'sonner';

export default function CartIndex({ cart }: { cart: CartPayload }) {
    const [items, setItems] = useState(cart.items);
    const [error, setError] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);

    async function removeItem(id: number) {
        setRemovingId(id);
        const token = document.cookie
            .split('; ')
            .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
            ?.slice(11);
        try {
            const response = await fetch(`/cart/items/${id}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': token ? decodeURIComponent(token) : '',
                },
            });

            if (!response.ok) {
                const message =
                    'The item could not be removed. Please try again.';
                setError(message);
                toast.error(message);
                return;
            }

            const payload = await response.json();
            setItems(payload.cart.items);
            setError(null);
            toast.success('Item removed from your cart.');
            window.dispatchEvent(
                new CustomEvent('storefront:cart-updated', {
                    detail: payload.cart,
                }),
            );
        } catch (exception) {
            setError(
                exception instanceof Error
                    ? exception.message
                    : 'The item could not be removed. Check your connection and try again.',
            );
            toast.error('The item could not be removed. Please try again.');
        } finally {
            setRemovingId(null);
        }
    }

    const subtotal = items.reduce((total, item) => total + item.line_total, 0);

    return (
        <>
            <Head title="Your cart" />
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" /> Continue shopping
                </Link>
                <h1 className="mt-5 text-3xl font-semibold tracking-tight">
                    Your cart
                </h1>
                {error && (
                    <p role="alert" className="mt-4 text-sm text-destructive">
                        {error}
                    </p>
                )}
                {items.length ? (
                    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <ul className="divide-y divide-border rounded-2xl border border-border bg-card px-5">
                            {items.map((item) => (
                                <li key={item.id} className="flex gap-4 py-5">
                                    <div className="size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                                        {item.product.image && (
                                            <img
                                                src={
                                                    imageUrl(
                                                        item.product.image,
                                                    ) ?? undefined
                                                }
                                                alt={item.product.name}
                                                className="size-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">
                                            {item.product.name}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {item.branch} ·{' '}
                                            {[
                                                item.variant.color,
                                                item.variant.size,
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                        <p className="mt-2 text-sm">
                                            Qty {item.quantity} ·{' '}
                                            {money(item.price)} each
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">
                                            {money(item.line_total)}
                                        </p>
                                        <button
                                            type="button"
                                            aria-label={`Remove ${item.product.name} from cart`}
                                            disabled={removingId === item.id}
                                            onClick={() =>
                                                void removeItem(item.id)
                                            }
                                            className="mt-3 inline-flex min-h-9 items-center gap-1 rounded-md text-xs text-muted-foreground transition hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
                                        >
                                            <Trash2 className="size-3.5" />{' '}
                                            Remove
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-28">
                            <h2 className="text-lg font-semibold">
                                Order summary
                            </h2>
                            <div className="mt-5 flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Subtotal
                                </span>
                                <span>{money(subtotal)}</span>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Shipping and discounts are calculated at
                                checkout.
                            </p>
                            <Link
                                href="/customer/checkout"
                                className="mt-6 flex h-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                            >
                                Proceed to checkout
                            </Link>
                        </aside>
                    </div>
                ) : (
                    <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
                        <ShoppingBag className="mx-auto size-10 text-muted-foreground/50" />
                        <p className="mt-4 font-medium">Your cart is empty</p>
                        <Link
                            href="/shop"
                            className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
                        >
                            Browse the shop
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
