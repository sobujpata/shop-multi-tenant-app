import { Link } from '@inertiajs/react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { imageUrl, money } from './types';

export type CartPayload = {
    subtotal: number;
    count: number;
    items: Array<{
        id: number;
        quantity: number;
        branch_id: number;
        branch: string | null;
        variant: {
            id: number;
            sku: string;
            size: string | null;
            color: string | null;
        };
        product: {
            id: number | null;
            name: string;
            slug: string | null;
            image: string | null;
        };
        price: number;
        line_total: number;
    }>;
};

type Props = {
    initialCart: CartPayload;
};

function csrfToken(): string {
    const value = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
        ?.slice('XSRF-TOKEN='.length);

    return value ? decodeURIComponent(value) : '';
}

export default function CartDrawer({ initialCart }: Props) {
    const [cart, setCart] = useState(initialCart);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    useEffect(() => setCart(initialCart), [initialCart]);

    useEffect(() => {
        const updateCart = (event: Event) => {
            const nextCart = (event as CustomEvent<CartPayload>).detail;
            setCart(nextCart);
        };
        const openCart = () => setOpen(true);

        window.addEventListener('storefront:cart-updated', updateCart);
        window.addEventListener('storefront:cart-open', openCart);

        return () => {
            window.removeEventListener('storefront:cart-updated', updateCart);
            window.removeEventListener('storefront:cart-open', openCart);
        };
    }, []);

    async function mutate(
        url: string,
        method: 'PATCH' | 'DELETE',
        body?: object,
    ) {
        setError(null);
        const response = await fetch(url, {
            method,
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': csrfToken(),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(
                payload.message ??
                    'Your cart could not be updated. Please try again.',
            );
        }

        setCart(payload.cart as CartPayload);
        toast.success(
            method === 'DELETE'
                ? 'Item removed from your bag.'
                : 'Cart updated.',
        );
    }

    async function changeQuantity(itemId: number, quantity: number) {
        setUpdatingId(itemId);

        try {
            if (quantity === 0) {
                await mutate(`/cart/items/${itemId}`, 'DELETE');
            } else {
                await mutate(`/cart/items/${itemId}`, 'PATCH', { quantity });
            }
        } catch (exception) {
            const message =
                exception instanceof Error
                    ? exception.message
                    : 'Cart update failed.';
            setError(message);
            toast.error(message);
        } finally {
            setUpdatingId(null);
        }
    }

    return (
        <>
            <button
                type="button"
                aria-label={`Shopping bag, ${cart.count} items`}
                title="Shopping bag"
                onClick={() => setOpen(true)}
                className="relative grid size-10 place-items-center rounded-full transition hover:bg-muted"
            >
                <ShoppingBag className="size-[18px]" />
                {cart.count > 0 && (
                    <span className="absolute top-1 right-0 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
                        {cart.count > 99 ? '99+' : cart.count}
                    </span>
                )}
            </button>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="w-full gap-0 p-0 sm:max-w-lg">
                    <SheetHeader className="border-b border-border px-6 py-5">
                        <SheetTitle className="flex items-center gap-2 text-lg">
                            <ShoppingBag className="size-5 text-primary" />
                            Your bag{' '}
                            <span className="text-muted-foreground">
                                ({cart.count})
                            </span>
                        </SheetTitle>
                    </SheetHeader>
                    {error && (
                        <p
                            role="alert"
                            className="mx-6 mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
                        >
                            {error}
                        </p>
                    )}
                    <div className="flex-1 overflow-y-auto px-6">
                        {cart.items.length ? (
                            <ul className="divide-y divide-border">
                                {cart.items.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex gap-4 py-5"
                                    >
                                        <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                                            {item.product.image ? (
                                                <img
                                                    src={
                                                        imageUrl(
                                                            item.product.image,
                                                        ) ?? undefined
                                                    }
                                                    alt={item.product.name}
                                                    className="size-full object-cover"
                                                />
                                            ) : (
                                                <div className="grid size-full place-items-center text-xl font-semibold text-primary/50">
                                                    {item.product.name.slice(
                                                        0,
                                                        1,
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-medium">
                                                        {item.product.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {[
                                                            item.variant.color,
                                                            item.variant.size,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' · ')}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {item.branch ??
                                                            'Selected branch'}
                                                    </p>
                                                </div>
                                                <p className="shrink-0 text-sm font-semibold">
                                                    {money(item.line_total)}
                                                </p>
                                            </div>
                                            <div className="mt-3 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    aria-label="Decrease quantity"
                                                    disabled={
                                                        updatingId === item.id
                                                    }
                                                    onClick={() =>
                                                        void changeQuantity(
                                                            item.id,
                                                            item.quantity - 1,
                                                        )
                                                    }
                                                    className="grid size-8 place-items-center rounded-full border border-border hover:bg-muted disabled:opacity-50"
                                                >
                                                    {item.quantity === 1 ? (
                                                        <Trash2 className="size-3.5" />
                                                    ) : (
                                                        <Minus className="size-3.5" />
                                                    )}
                                                </button>
                                                <span className="min-w-6 text-center text-sm">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    aria-label="Increase quantity"
                                                    disabled={
                                                        updatingId === item.id
                                                    }
                                                    onClick={() =>
                                                        void changeQuantity(
                                                            item.id,
                                                            item.quantity + 1,
                                                        )
                                                    }
                                                    className="grid size-8 place-items-center rounded-full border border-border hover:bg-muted disabled:opacity-50"
                                                >
                                                    <Plus className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label="Remove item"
                                                    disabled={
                                                        updatingId === item.id
                                                    }
                                                    onClick={() =>
                                                        void changeQuantity(
                                                            item.id,
                                                            0,
                                                        )
                                                    }
                                                    className="ml-auto grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="grid h-full place-items-center py-16 text-center">
                                <div>
                                    <ShoppingBag className="mx-auto size-10 text-muted-foreground/50" />
                                    <p className="mt-4 font-medium">
                                        Your bag is empty
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Find something you love in the
                                        marketplace.
                                    </p>
                                    <Link
                                        href="/shop"
                                        onClick={() => setOpen(false)}
                                        className="mt-5 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
                                    >
                                        Explore products
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                    {cart.items.length > 0 && (
                        <div className="border-t border-border bg-background px-6 py-5">
                            <div className="flex items-center justify-between text-base font-semibold">
                                <span>Subtotal</span>
                                <span>{money(cart.subtotal)}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Shipping and discounts are calculated at
                                checkout.
                            </p>
                            <Link
                                href="/customer/checkout"
                                onClick={() => setOpen(false)}
                                className="mt-5 flex h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                            >
                                Continue to checkout
                            </Link>
                            <Link
                                href="/cart"
                                onClick={() => setOpen(false)}
                                className="mt-3 block text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                            >
                                View cart
                            </Link>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
