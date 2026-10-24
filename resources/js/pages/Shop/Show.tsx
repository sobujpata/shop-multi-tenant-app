import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    Heart,
    Minus,
    Plus,
    ShieldCheck,
    ShoppingCart,
    Truck,
} from 'lucide-react';
import { useState } from 'react';
import BranchSelector from '@/components/storefront/BranchSelector';
import type { AvailableBranch } from '@/components/storefront/BranchSelector';
import ProductCard from '@/components/storefront/ProductCard';
import RatingStars from '@/components/storefront/RatingStars';
import ReviewList from '@/components/storefront/ReviewList';
import ReviewForm from '@/components/storefront/ReviewForm';
import VariantPicker from '@/components/storefront/VariantPicker';
import type { ProductVariant } from '@/components/storefront/VariantPicker';
import { imageUrl, money } from '@/components/storefront/types';
import { toast } from 'sonner';
import type {
    Paginated,
    StorefrontProduct,
} from '@/components/storefront/types';

type ProductDetail = StorefrontProduct & {
    description: string;
    variants: ProductVariant[];
    images: Array<{ id: number; path: string; is_primary: boolean }>;
    category: { name: string; slug: string };
    brand: { name: string; slug: string; logo: string | null } | null;
};

type Review = {
    id: number;
    rating: number;
    comment: string | null;
    created_at: string;
    customer: { name: string };
    images: Array<{ id: number; path: string }>;
};

const productDetailsTabs = [
    { id: 'description', label: 'Description' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'reviews', label: 'Reviews' },
] as const;

type ProductDetailsTab = (typeof productDetailsTabs)[number]['id'];

export default function ShopShow({
    product,
    branchAvailability,
    reviews,
    relatedProducts,
    isWishlisted,
    reviewableOrderItems,
}: {
    product: ProductDetail;
    branchAvailability: AvailableBranch[];
    reviews: Paginated<Review>;
    relatedProducts: StorefrontProduct[];
    isWishlisted: boolean;
    reviewableOrderItems: Array<{ id: number; order_no: string }>;
}) {
    const [activeDetailsTab, setActiveDetailsTab] =
        useState<ProductDetailsTab>('description');
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
        product.variants[0]?.id ?? null,
    );
    const [activeImage, setActiveImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [buyingNow, setBuyingNow] = useState(false);
    const [cartError, setCartError] = useState<string | null>(null);
    const [saved, setSaved] = useState(isWishlisted);
    const [busy, setBusy] = useState<{
        id: number;
        kind: 'cart' | 'buy-now';
    } | null>(null);
    const selectedVariant =
        product.variants.find((variant) => variant.id === selectedVariantId) ??
        null;
    const gallery = product.images.length ? product.images : [];
    const price =
        selectedVariant?.price ??
        product.current_price ??
        product.sale_price ??
        product.base_price;
    const averageRating = product.reviews_avg_rating ?? product.rating_avg;
    const reviewCount = product.reviews_count ?? product.rating_count;
    const stockCount = branchAvailability.reduce(
        (total, branch) =>
            total +
            (branch.stocks.find(
                (stock) => stock.variant.id === selectedVariant?.id,
            )?.quantity ?? 0),
        0,
    );
    const availableBranches = branchAvailability.filter((branch) =>
        branch.stocks.some(
            (stock) =>
                stock.variant.id === selectedVariant?.id && stock.quantity > 0,
        ),
    );
    const selectedBranch = availableBranches[0];
    const selectedBranchStock =
        selectedBranch?.stocks.find(
            (stock) => stock.variant.id === selectedVariant?.id,
        )?.quantity ?? 0;
    const discount =
        Number(product.base_price) > Number(price)
            ? Math.round((1 - Number(price) / Number(product.base_price)) * 100)
            : 0;

    async function addToCart(buyNow = false) {
        if (!selectedVariant || !selectedBranch) return;

        setAddingToCart(true);
        setBuyingNow(buyNow);
        setCartError(null);
        const token = document.cookie
            .split('; ')
            .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
            ?.slice('XSRF-TOKEN='.length);

        try {
            const response = await fetch('/cart/items', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': token ? decodeURIComponent(token) : '',
                },
                body: JSON.stringify({
                    variant_id: selectedVariant.id,
                    branch_id: selectedBranch.id,
                    quantity,
                }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(
                    payload.errors?.quantity?.[0] ??
                        payload.errors?.branch_id?.[0] ??
                        payload.message ??
                        'This item could not be added to your cart.',
                );
            }

            if (buyNow) {
                router.visit('/customer/checkout');
            } else {
                window.dispatchEvent(
                    new CustomEvent('storefront:cart-updated', {
                        detail: payload.cart,
                    }),
                );
                toast.success(`${product.name} added to your bag.`);
                window.dispatchEvent(new Event('storefront:cart-open'));
            }
        } catch (exception) {
            const message =
                exception instanceof Error
                    ? exception.message
                    : 'This item could not be added to your cart.';
            setCartError(message);
            toast.error(message);
        } finally {
            setAddingToCart(false);
            setBuyingNow(false);
        }
    }

    function toggleWishlist() {
        router.post(
            '/customer/wishlist/toggle',
            { product_id: product.id },
            {
                onSuccess: () => {
                    setSaved((current) => !current);
                    toast.success(
                        saved
                            ? 'Removed from your wishlist.'
                            : 'Added to your wishlist.',
                    );
                },
                onError: () => toast.error('Unable to update your wishlist.'),
            },
        );
    }

    async function purchase(
        related: StorefrontProduct,
        kind: 'cart' | 'buy-now',
    ) {
        const variantId = related.default_variant_id;
        const branchId = related.default_branch_id;
        if (!variantId || !branchId) return;

        setBusy({ id: related.id, kind });
        const token = document.cookie
            .split('; ')
            .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
            ?.slice('XSRF-TOKEN='.length);

        try {
            const response = await fetch('/cart/items', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': token ? decodeURIComponent(token) : '',
                },
                body: JSON.stringify({
                    variant_id: variantId,
                    branch_id: branchId,
                    quantity: 1,
                }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(
                    payload.errors?.quantity?.[0] ??
                        payload.errors?.branch_id?.[0] ??
                        payload.errors?.variant_id?.[0] ??
                        payload.message ??
                        'This item could not be added to your cart.',
                );
            }

            if (kind === 'buy-now') {
                router.visit('/customer/checkout');
                return;
            }

            window.dispatchEvent(
                new CustomEvent('storefront:cart-updated', {
                    detail: payload.cart,
                }),
            );
            toast.success(`${related.name} added to your bag.`);
            window.dispatchEvent(new Event('storefront:cart-open'));
        } catch (exception) {
            toast.error(
                exception instanceof Error
                    ? exception.message
                    : 'This item could not be added to your cart.',
            );
        } finally {
            setBusy(null);
        }
    }

    function cardActions(related: StorefrontProduct, index: number) {
        const purchasable = Boolean(
            related.default_variant_id && related.default_branch_id,
        );

        return {
            index,
            product: related,
            onAddToCart: purchasable
                ? () => void purchase(related, 'cart')
                : undefined,
            onBuyNow: purchasable
                ? () => void purchase(related, 'buy-now')
                : undefined,
            busy: busy?.id === related.id ? busy.kind : null,
        };
    }

    return (
        <>
            <Head title={product.name} />
            <div className="mx-auto max-w-7xl px-4 pt-7 sm:px-6 sm:pt-10 lg:px-8">
                <nav
                    aria-label="Breadcrumb"
                    className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                >
                    <Link href="/shop" className="hover:text-foreground">
                        Home
                    </Link>
                    <span aria-hidden="true">/</span>
                    <Link
                        href={`/shop?category=${encodeURIComponent(product.category.slug)}`}
                        className="hover:text-foreground"
                    >
                        {product.category.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="max-w-64 truncate text-foreground">
                        {product.name}
                    </span>
                </nav>
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(370px,.95fr)] lg:gap-8">
                    <div className="flex flex-col gap-3">
                        {gallery.length > 1 && (
                            <div className="order-2 flex gap-2 overflow-x-auto">
                                {gallery.map((image, index) => (
                                    <button
                                        key={image.id}
                                        type="button"
                                        onClick={() => setActiveImage(index)}
                                        aria-label={`View product image ${index + 1}`}
                                        aria-pressed={index === activeImage}
                                        className={`size-[68px] shrink-0 overflow-hidden rounded-lg border-2 transition ${
                                            index === activeImage
                                                ? 'border-primary'
                                                : 'border-border'
                                        }`}
                                    >
                                        <img
                                            src={
                                                imageUrl(image.path) ??
                                                undefined
                                            }
                                            alt=""
                                            className="size-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="relative order-1 aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                            {discount > 0 && (
                                <span className="absolute top-3 left-3 z-10 rounded-md bg-rose-600 px-2.5 py-1 text-xs font-bold text-white">
                                    -{discount}%
                                </span>
                            )}
                            {gallery[activeImage] ? (
                                <img
                                    src={
                                        imageUrl(gallery[activeImage].path) ??
                                        undefined
                                    }
                                    alt={product.name}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <div className="grid size-full place-items-center bg-gradient-to-br from-primary/10 via-muted to-amber-500/10 text-8xl font-semibold text-primary/30">
                                    {product.name.slice(0, 1)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:sticky lg:top-24 lg:h-fit">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2 text-xs font-medium">
                                <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                                <span className="truncate text-muted-foreground">
                                    {product.brand?.name ??
                                        product.category.name}
                                </span>
                            </div>
                            {product.brand && (
                                <Link
                                    href={`/shop?brand[]=${encodeURIComponent(product.brand.slug)}`}
                                    className="shrink-0 text-xs font-semibold text-rose-600 hover:underline"
                                >
                                    View brand{' '}
                                    <ArrowRight className="ml-1 inline size-3" />
                                </Link>
                            )}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Link
                                href={`/shop?category=${encodeURIComponent(product.category.slug)}`}
                                className="hover:underline"
                            >
                                {product.category.name}
                            </Link>
                        </div>
                        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                            {product.name}
                        </h1>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            <RatingStars
                                rating={averageRating}
                                count={reviewCount}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveDetailsTab('reviews');
                                    document
                                        .getElementById('product-details')
                                        ?.scrollIntoView({
                                            behavior: 'smooth',
                                        });
                                }}
                                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                            >
                                Read {reviewCount} reviews
                            </button>
                        </div>
                        <div className="mt-5 flex flex-wrap items-baseline gap-3">
                            <span className="text-3xl font-bold tracking-tight">
                                {money(price)}
                            </span>
                            {discount > 0 && (
                                <>
                                    <span className="text-sm text-muted-foreground line-through">
                                        {money(product.base_price)}
                                    </span>
                                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                        Save {discount}%
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <ShieldCheck className="size-3.5" />
                            Secure marketplace checkout
                        </div>
                        <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                            {[
                                `Available at ${availableBranches.length} ${availableBranches.length === 1 ? 'branch' : 'branches'}`,
                                'Ships from an available branch',
                                'Delivery options shown at checkout',
                            ].map((item) => (
                                <li
                                    key={item}
                                    className="flex items-center gap-2"
                                >
                                    <Check className="size-3.5 shrink-0 text-emerald-600" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <div className="my-5 border-t border-border" />
                        <VariantPicker
                            variants={product.variants}
                            selectedId={selectedVariantId}
                            onSelect={(variant) => {
                                setSelectedVariantId(variant.id);
                                setQuantity(1);
                            }}
                        />
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                                    Quantity
                                </p>
                                <div className="mt-1 flex h-10 items-center rounded-md border border-border">
                                    <button
                                        type="button"
                                        aria-label="Decrease quantity"
                                        onClick={() =>
                                            setQuantity((current) =>
                                                Math.max(1, current - 1),
                                            )
                                        }
                                        disabled={quantity <= 1}
                                        className="grid size-10 place-items-center text-muted-foreground transition hover:text-foreground disabled:opacity-40"
                                    >
                                        <Minus className="size-3.5" />
                                    </button>
                                    <span
                                        aria-live="polite"
                                        className="min-w-8 text-center text-sm font-medium"
                                    >
                                        {quantity}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label="Increase quantity"
                                        onClick={() =>
                                            setQuantity((current) =>
                                                Math.min(
                                                    selectedBranchStock,
                                                    current + 1,
                                                ),
                                            )
                                        }
                                        disabled={
                                            quantity >= selectedBranchStock
                                        }
                                        className="grid size-10 place-items-center text-muted-foreground transition hover:text-foreground disabled:opacity-40"
                                    >
                                        <Plus className="size-3.5" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                {selectedBranchStock > 0
                                    ? `${selectedBranchStock} available at selected branch`
                                    : 'Select an available branch'}
                            </p>
                        </div>
                        <div className="mt-5 grid grid-cols-[1fr_1fr_auto] gap-2">
                            <button
                                type="button"
                                onClick={() => void addToCart()}
                                disabled={
                                    !selectedVariant ||
                                    !selectedBranch ||
                                    quantity > selectedBranchStock ||
                                    addingToCart
                                }
                                className="flex h-11 items-center justify-center gap-2 rounded-md bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <ShoppingCart className="size-4" />
                                {addingToCart && !buyingNow
                                    ? 'Adding…'
                                    : 'Add to cart'}
                            </button>
                            <button
                                type="button"
                                onClick={() => void addToCart(true)}
                                disabled={
                                    !selectedVariant ||
                                    !selectedBranch ||
                                    quantity > selectedBranchStock ||
                                    addingToCart
                                }
                                className="h-11 rounded-md border border-rose-600 px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-rose-950/30"
                            >
                                {buyingNow ? 'Processing…' : 'Buy Now'}
                            </button>
                            <button
                                type="button"
                                aria-label="Save this product"
                                aria-pressed={saved}
                                onClick={toggleWishlist}
                                className={`grid size-11 place-items-center rounded-md border border-border transition hover:border-rose-400 hover:text-rose-600 ${saved ? 'text-rose-600' : ''}`}
                            >
                                <Heart
                                    className={`size-4 ${saved ? 'fill-current' : ''}`}
                                />
                            </button>
                        </div>
                        {cartError && (
                            <p
                                role="alert"
                                className="mt-3 text-sm text-destructive"
                            >
                                {cartError}
                            </p>
                        )}
                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                            <div className="rounded-lg border border-border p-3 text-center">
                                <Truck className="mx-auto size-4 text-muted-foreground" />
                                <p className="mt-2 text-xs font-semibold">
                                    Store delivery
                                </p>
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                    Options at checkout
                                </p>
                            </div>
                            <div className="rounded-lg border border-border p-3 text-center">
                                <ShieldCheck className="mx-auto size-4 text-muted-foreground" />
                                <p className="mt-2 text-xs font-semibold">
                                    Secure checkout
                                </p>
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                    Protected payment
                                </p>
                            </div>
                            <div className="rounded-lg border border-border p-3 text-center">
                                <Check className="mx-auto size-4 text-muted-foreground" />
                                <p className="mt-2 text-xs font-semibold">
                                    Branch stock
                                </p>
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                    Check availability below
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="product-details" className="mt-14">
                    <div
                        role="tablist"
                        aria-label="Product details"
                        className="flex gap-7 overflow-x-auto border-b border-border text-sm"
                    >
                        {productDetailsTabs.map(({ id: tab, label }) => (
                            <button
                                key={tab}
                                id={`details-tab-${tab}`}
                                type="button"
                                role="tab"
                                aria-selected={activeDetailsTab === tab}
                                aria-controls="details-panel"
                                tabIndex={activeDetailsTab === tab ? 0 : -1}
                                onClick={() => setActiveDetailsTab(tab)}
                                onKeyDown={(event) => {
                                    if (
                                        event.key !== 'ArrowRight' &&
                                        event.key !== 'ArrowLeft'
                                    ) {
                                        return;
                                    }
                                    event.preventDefault();
                                    const direction =
                                        event.key === 'ArrowRight' ? 1 : -1;
                                    const currentIndex =
                                        productDetailsTabs.findIndex(
                                            (item) => item.id === tab,
                                        );
                                    const nextIndex =
                                        (currentIndex +
                                            direction +
                                            productDetailsTabs.length) %
                                        productDetailsTabs.length;
                                    const nextTab =
                                        productDetailsTabs[nextIndex].id;
                                    setActiveDetailsTab(nextTab);
                                    document
                                        .getElementById(
                                            `details-tab-${nextTab}`,
                                        )
                                        ?.focus();
                                }}
                                className={`shrink-0 border-b-2 px-1 py-3 transition ${
                                    activeDetailsTab === tab
                                        ? 'border-foreground font-semibold text-foreground'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab === 'reviews'
                                    ? `${label} (${reviews.total})`
                                    : label}
                            </button>
                        ))}
                    </div>
                    <section
                        id="details-panel"
                        role="tabpanel"
                        aria-labelledby={`details-tab-${activeDetailsTab}`}
                        className="min-h-40 border-b border-border py-8"
                    >
                        {activeDetailsTab === 'description' && (
                            <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(250px,.65fr)]">
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        Description
                                    </h2>
                                    <p className="mt-4 max-w-3xl text-sm leading-7 whitespace-pre-line text-muted-foreground">
                                        {product.description ||
                                            'No description is available for this product yet.'}
                                    </p>
                                </div>
                                <div>
                                    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                                        <h2 className="text-xl font-semibold">
                                            Branch availability
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {stockCount} in stock
                                        </p>
                                    </div>
                                    <BranchSelector
                                        branches={branchAvailability}
                                        selectedVariant={selectedVariant}
                                    />
                                </div>
                            </div>
                        )}
                        {activeDetailsTab === 'specifications' && (
                            <div className="max-w-3xl">
                                <h2 className="text-xl font-semibold">
                                    Specifications
                                </h2>
                                <dl className="mt-4 divide-y divide-border text-sm">
                                    <div className="flex justify-between gap-4 py-3">
                                        <dt className="text-muted-foreground">
                                            Category
                                        </dt>
                                        <dd className="text-right font-medium">
                                            {product.category.name}
                                        </dd>
                                    </div>
                                    {product.brand && (
                                        <div className="flex justify-between gap-4 py-3">
                                            <dt className="text-muted-foreground">
                                                Brand
                                            </dt>
                                            <dd className="text-right font-medium">
                                                {product.brand.name}
                                            </dd>
                                        </div>
                                    )}
                                    {selectedVariant?.sku && (
                                        <div className="flex justify-between gap-4 py-3">
                                            <dt className="text-muted-foreground">
                                                SKU
                                            </dt>
                                            <dd className="text-right font-medium">
                                                {selectedVariant.sku}
                                            </dd>
                                        </div>
                                    )}
                                    {selectedVariant?.color && (
                                        <div className="flex justify-between gap-4 py-3">
                                            <dt className="text-muted-foreground">
                                                Color
                                            </dt>
                                            <dd className="text-right font-medium">
                                                {selectedVariant.color}
                                            </dd>
                                        </div>
                                    )}
                                    {selectedVariant?.size && (
                                        <div className="flex justify-between gap-4 py-3">
                                            <dt className="text-muted-foreground">
                                                Size
                                            </dt>
                                            <dd className="text-right font-medium">
                                                {selectedVariant.size}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                        )}
                        {activeDetailsTab === 'reviews' && (
                            <div>
                                {reviewableOrderItems.length > 0 && (
                                    <div className="mb-8">
                                        <ReviewForm
                                            productId={product.id}
                                            orderItemId={
                                                reviewableOrderItems[0].id
                                            }
                                            orderLabel={
                                                reviewableOrderItems[0].order_no
                                            }
                                        />
                                    </div>
                                )}
                                <ReviewList reviews={reviews} />
                            </div>
                        )}
                    </section>
                </div>

                {relatedProducts.length > 0 && (
                    <section className="py-8">
                        <div className="mb-6 flex items-end justify-between gap-4">
                            <h2 className="text-xl font-semibold">
                                You may also like
                            </h2>
                            <Link
                                href="/shop"
                                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                            >
                                Explore more <ArrowRight className="size-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
                            {relatedProducts.slice(0, 5).map((item, index) => (
                                <ProductCard
                                    key={item.id}
                                    {...cardActions(item, index)}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-popover backdrop-blur-lg md:hidden">
                <div className="mx-auto flex max-w-7xl items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                            {product.name}
                        </p>
                        <p className="text-sm font-semibold">{money(price)}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void addToCart(true)}
                        disabled={
                            !selectedVariant ||
                            !selectedBranch ||
                            quantity > selectedBranchStock ||
                            addingToCart
                        }
                        aria-label={`Buy ${product.name} now`}
                        className="min-h-11 min-w-36 rounded-md bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {buyingNow ? 'Processing…' : 'Buy Now'}
                    </button>
                </div>
            </div>
            <div aria-hidden="true" className="h-20 md:hidden" />
        </>
    );
}
