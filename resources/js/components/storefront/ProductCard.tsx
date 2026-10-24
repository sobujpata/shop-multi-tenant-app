import { Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    Banknote,
    Loader2,
    ShoppingBag,
    Truck,
    Zap,
} from 'lucide-react';
import RatingStars from './RatingStars';
import { imageUrl, money } from './types';
import type { StorefrontProduct } from './types';

export type ProductCardBusy = 'cart' | 'buy-now' | null;

export default function ProductCard({
    product,
    index = 0,
    onAddToCart,
    onBuyNow,
    busy = null,
    buttonTabIndex,
    reveal = false,
}: {
    product: StorefrontProduct;
    index?: number;
    onAddToCart?: () => void;
    onBuyNow?: () => void;
    busy?: ProductCardBusy;
    buttonTabIndex?: 0 | -1;
    reveal?: boolean;
}) {
    const image =
        imageUrl(
            product.images?.find((item) => item.is_primary)?.path ??
                product.images?.[0]?.path,
        ) ?? null;
    const rating = product.reviews_avg_rating ?? product.rating_avg;
    const count = product.reviews_count ?? product.rating_count;
    const price =
        product.current_price ?? product.sale_price ?? product.base_price;
    const basePrice = Number(product.base_price);
    const salePrice = Number(product.sale_price);
    const hasDiscount =
        product.sale_price !== null &&
        product.sale_price !== undefined &&
        salePrice > 0 &&
        salePrice < basePrice;
    const discountPercentage = hasDiscount
        ? Math.round(((basePrice - salePrice) / basePrice) * 100)
        : 0;
    const createdAt = product.created_at
        ? new Date(product.created_at).getTime()
        : Number.NaN;
    const isNew =
        Number.isFinite(createdAt) &&
        createdAt <= Date.now() &&
        Date.now() - createdAt <= 30 * 24 * 60 * 60 * 1000;
    const soldCount = Number(product.sold_count ?? 0);
    const purchasable = onAddToCart !== undefined && onBuyNow !== undefined;

    return (
        <article
            data-home-reveal={reveal ? '' : undefined}
            className={`group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg ${
                reveal
                    ? 'home-reveal-card'
                    : 'animate-in duration-500 fade-in slide-in-from-bottom-2'
            }`}
            style={{
                animationDelay: `${Math.min(index, 7) * 45}ms`,
                transitionDelay: reveal
                    ? `${Math.min(index, 7) * 55}ms`
                    : undefined,
            }}
        >
            <div className="group/image relative aspect-[4/5] overflow-hidden bg-muted">
                <Link
                    href={`/shop/${product.slug}`}
                    aria-label={`View ${product.name}`}
                    className="absolute inset-0"
                >
                    {image ? (
                        <img
                            src={image}
                            alt={product.name}
                            loading="lazy"
                            className="size-full object-cover transition duration-700 group-hover/image:scale-105"
                        />
                    ) : (
                        <div className="grid size-full place-items-center bg-gradient-to-br from-primary/10 via-muted to-amber-500/10 text-5xl font-semibold text-primary/40">
                            {product.name.slice(0, 1)}
                        </div>
                    )}
                    {hasDiscount && (
                        <span className="absolute top-3 left-3 rounded-md bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                            -{discountPercentage}%
                        </span>
                    )}
                    <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-background">
                        <ArrowUpRight className="size-4" />
                    </span>
                </Link>
                {purchasable && (
                    <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-3 pt-12 transition duration-300 md:translate-y-3 md:flex-row md:items-center md:opacity-0 md:group-focus-within/image:translate-y-0 md:group-focus-within/image:opacity-100 md:group-hover/image:translate-y-0 md:group-hover/image:opacity-100">
                        <button
                            type="button"
                            tabIndex={buttonTabIndex}
                            onClick={onAddToCart}
                            disabled={busy !== null}
                            aria-label={`Add ${product.name} to cart`}
                            className="flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-white/30 bg-background/95 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 md:w-10 md:flex-none"
                        >
                            {busy === 'cart' ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <ShoppingBag className="size-4" />
                            )}
                            <span className="md:hidden">Add to cart</span>
                        </button>
                        <button
                            type="button"
                            tabIndex={buttonTabIndex}
                            onClick={onBuyNow}
                            disabled={busy !== null}
                            className="flex h-10 w-full flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {busy === 'buy-now' ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Zap className="size-4" />
                            )}
                            Buy Now
                        </button>
                    </div>
                )}
            </div>
            <div className="space-y-3 p-4">
                {product.tenant?.name && (
                    <Link
                        href={`/stores/${product.tenant.slug}`}
                        className="block truncate text-xs font-medium text-primary hover:underline"
                    >
                        {product.tenant.name}
                    </Link>
                )}
                <Link
                    href={`/shop/${product.slug}`}
                    className="line-clamp-2 min-h-10 leading-5 font-medium transition hover:text-primary"
                >
                    {product.name}
                </Link>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-lg leading-none font-bold">
                        {money(price)}
                    </span>
                    {hasDiscount && (
                        <>
                            <span className="text-sm text-muted-foreground line-through">
                                {money(basePrice)}
                            </span>
                            <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
                                -{discountPercentage}%
                            </span>
                        </>
                    )}
                </div>
                <div className="flex min-h-5 items-center justify-between gap-2 text-xs">
                    {isNew ? (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-700 dark:text-emerald-400">
                            New
                        </span>
                    ) : Number(rating) > 0 ? (
                        <RatingStars rating={rating} count={count} />
                    ) : (
                        <span />
                    )}
                    <span className="shrink-0 font-medium text-foreground">
                        {soldCount.toLocaleString()} sold
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                        <Banknote className="size-4" aria-hidden="true" />
                        Cash on Delivery
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground">
                        <Truck className="size-3.5" aria-hidden="true" />
                        In 2–3 days
                    </span>
                </div>
            </div>
        </article>
    );
}
