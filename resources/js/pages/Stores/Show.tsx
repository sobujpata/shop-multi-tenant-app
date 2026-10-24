import { Head, Link, router } from '@inertiajs/react';
import { BadgeCheck, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Pagination from '@/components/storefront/Pagination';
import ProductCard from '@/components/storefront/ProductCard';
import ReviewList from '@/components/storefront/ReviewList';
import { imageUrl } from '@/components/storefront/types';
import type {
    Paginated,
    StorefrontProduct,
} from '@/components/storefront/types';

type Store = {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    products_count: number;
    average_rating: number;
    reviews_count: number;
    member_since: number | null;
};

type StoreReview = {
    id: number;
    rating: number;
    comment: string | null;
    created_at: string;
    customer: { name: string };
    images: Array<{ id: number; path: string }>;
};

type StoreFilters = {
    price_range: string | null;
    rating: string | null;
    discounted: boolean;
    sort: string;
};

const priceRanges = [
    { value: 'under_1000', label: 'Under ৳1,000' },
    { value: '1000_5000', label: '৳1,000 – ৳5,000' },
    { value: '5000_20000', label: '৳5,000 – ৳20,000' },
    { value: '20000_50000', label: '৳20,000 – ৳50,000' },
    { value: 'over_50000', label: 'Over ৳50,000' },
];

export default function StoresShow({
    store,
    products,
    reviews,
    filters,
}: {
    store: Store;
    products: Paginated<StorefrontProduct>;
    reviews: Paginated<StoreReview>;
    filters: StoreFilters;
}) {
    const [activeTab, setActiveTab] = useState<
        'products' | 'about' | 'reviews'
    >('products');
    const [busy, setBusy] = useState<{
        id: number;
        kind: 'cart' | 'buy-now';
    } | null>(null);

    function applyFilters(nextFilters: StoreFilters) {
        router.get(
            `/stores/${store.slug}`,
            {
                price_range: nextFilters.price_range ?? undefined,
                rating: nextFilters.rating ?? undefined,
                discounted: nextFilters.discounted ? '1' : undefined,
                sort:
                    nextFilters.sort === 'relevance'
                        ? undefined
                        : nextFilters.sort,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function filterSidebar() {
        return (
            <div className="divide-y divide-border/70">
                <div className="flex items-center justify-between pb-4">
                    <h2 className="text-sm font-semibold">Filters</h2>
                    <button
                        type="button"
                        onClick={() =>
                            applyFilters({
                                price_range: null,
                                rating: null,
                                discounted: false,
                                sort: filters.sort,
                            })
                        }
                        className="text-xs text-muted-foreground transition hover:text-primary"
                    >
                        Clear
                    </button>
                </div>

                <fieldset className="py-4">
                    <legend className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Price
                    </legend>
                    <div className="space-y-2.5">
                        {priceRanges.map((range) => (
                            <label
                                key={range.value}
                                className="flex cursor-pointer items-center gap-2.5 text-xs text-muted-foreground transition hover:text-foreground"
                            >
                                <input
                                    type="checkbox"
                                    checked={
                                        filters.price_range === range.value
                                    }
                                    onChange={() =>
                                        applyFilters({
                                            ...filters,
                                            price_range:
                                                filters.price_range ===
                                                range.value
                                                    ? null
                                                    : range.value,
                                        })
                                    }
                                    className="size-4 rounded border-border accent-primary"
                                />
                                {range.label}
                            </label>
                        ))}
                    </div>
                </fieldset>

                <fieldset className="py-4">
                    <legend className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Seller
                    </legend>
                    <label className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        <input
                            type="checkbox"
                            checked
                            disabled
                            className="size-4 rounded border-border accent-primary"
                        />
                        Verified seller
                    </label>
                </fieldset>

                <fieldset className="py-4">
                    <legend className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Rating
                    </legend>
                    <div className="space-y-2.5">
                        {[
                            { value: '1.5', label: '1.5★ & up' },
                            { value: '2', label: '2★ & up' },
                            { value: '3', label: '3★ & up' },
                        ].map((rating) => (
                            <label
                                key={rating.value}
                                className="flex cursor-pointer items-center gap-2.5 text-xs text-muted-foreground transition hover:text-foreground"
                            >
                                <input
                                    type="radio"
                                    name="store-rating"
                                    checked={filters.rating === rating.value}
                                    onChange={() =>
                                        applyFilters({
                                            ...filters,
                                            rating:
                                                filters.rating === rating.value
                                                    ? null
                                                    : rating.value,
                                        })
                                    }
                                    className="size-4 accent-primary"
                                />
                                {rating.label}
                            </label>
                        ))}
                        <label className="flex cursor-pointer items-center gap-2.5 text-xs text-muted-foreground transition hover:text-foreground">
                            <input
                                type="radio"
                                name="store-rating"
                                checked={filters.rating === null}
                                onChange={() =>
                                    applyFilters({ ...filters, rating: null })
                                }
                                className="size-4 accent-primary"
                            />
                            All ratings
                        </label>
                    </div>
                </fieldset>

                <fieldset className="py-4">
                    <legend className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Offers &amp; delivery
                    </legend>
                    <label className="flex cursor-pointer items-center gap-2.5 text-xs text-muted-foreground transition hover:text-foreground">
                        <input
                            type="checkbox"
                            checked={filters.discounted}
                            onChange={(event) =>
                                applyFilters({
                                    ...filters,
                                    discounted: event.target.checked,
                                })
                            }
                            className="size-4 rounded border-border accent-primary"
                        />
                        20% off or more
                    </label>
                    <p className="mt-3 text-xs text-muted-foreground">
                        Cash on delivery available
                    </p>
                </fieldset>
            </div>
        );
    }

    async function purchase(
        product: StorefrontProduct,
        kind: 'cart' | 'buy-now',
    ) {
        const variantId = product.default_variant_id;
        const branchId = product.default_branch_id;
        if (!variantId || !branchId) return;

        setBusy({ id: product.id, kind });
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
            toast.success(`${product.name} added to your bag.`);
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

    return (
        <>
            <Head title={store.name} />
            <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8 lg:px-8">
                <nav
                    aria-label="Breadcrumb"
                    className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
                >
                    <Link href="/" className="transition hover:text-foreground">
                        Home
                    </Link>
                    <ChevronRight aria-hidden="true" className="size-4" />
                    <Link
                        href="/stores"
                        className="transition hover:text-foreground"
                    >
                        Stores
                    </Link>
                    <ChevronRight aria-hidden="true" className="size-4" />
                    <span className="font-medium text-foreground">
                        {store.name}
                    </span>
                </nav>

                <section className="relative isolate overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-[#21194b] via-[#432363] to-[#742b72] px-6 py-8 text-white shadow-lg sm:px-8 sm:py-9">
                    <div className="absolute -top-28 right-8 -z-10 size-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/30 bg-white text-2xl font-bold text-slate-900 shadow-sm">
                            {store.logo ? (
                                <img
                                    src={imageUrl(store.logo) ?? ''}
                                    alt={`${store.name} logo`}
                                    className="size-full object-contain p-2"
                                />
                            ) : (
                                store.name.slice(0, 1).toUpperCase()
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                    {store.name}
                                </h1>
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-semibold uppercase">
                                    <BadgeCheck className="size-3" />
                                    Official
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-white/75">
                                {store.name} · Verified Store on Marketplace
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/85">
                                <span>
                                    ★ {store.average_rating.toFixed(1)} rating
                                </span>
                                <span>{store.products_count} products</span>
                                <span>{store.reviews_count} reviews</span>
                                <span>Verified seller</span>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mt-7 flex gap-1 border-b border-border">
                    <button
                        type="button"
                        onClick={() => setActiveTab('products')}
                        aria-current={
                            activeTab === 'products' ? 'page' : undefined
                        }
                        className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition ${
                            activeTab === 'products'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        All Products ({store.products_count})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('about')}
                        aria-current={
                            activeTab === 'about' ? 'page' : undefined
                        }
                        className={`border-b-2 px-3 py-3 text-sm font-semibold transition ${
                            activeTab === 'about'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        About
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('reviews')}
                        aria-current={
                            activeTab === 'reviews' ? 'page' : undefined
                        }
                        className={`border-b-2 px-3 py-3 text-sm font-semibold transition ${
                            activeTab === 'reviews'
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Reviews
                    </button>
                </div>

                {activeTab === 'about' && (
                    <section
                        aria-labelledby="store-about-heading"
                        className="mt-6 max-w-3xl rounded-2xl border border-border bg-card p-6 sm:p-7"
                    >
                        <h2
                            id="store-about-heading"
                            className="text-lg font-semibold"
                        >
                            About {store.name}
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {store.name} · Verified Store on Marketplace
                        </p>
                        <div className="mt-7">
                            <h3 className="text-sm font-semibold">
                                Store details
                            </h3>
                            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="text-muted-foreground">
                                        Status
                                    </dt>
                                    <dd className="mt-1 inline-flex items-center gap-1.5 font-medium">
                                        <BadgeCheck className="size-4 text-emerald-600" />
                                        Official store
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        Rating
                                    </dt>
                                    <dd className="mt-1 font-medium">
                                        {store.average_rating.toFixed(2)} (
                                        {store.reviews_count}{' '}
                                        {store.reviews_count === 1
                                            ? 'review'
                                            : 'reviews'}
                                        )
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        Products
                                    </dt>
                                    <dd className="mt-1 font-medium">
                                        {store.products_count}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        Member since
                                    </dt>
                                    <dd className="mt-1 font-medium">
                                        {store.member_since ?? '—'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </section>
                )}

                {activeTab === 'reviews' && (
                    <div className="mt-6 max-w-4xl">
                        <ReviewList reviews={reviews} />
                    </div>
                )}

                {activeTab === 'products' && (
                    <section
                        id="products"
                        className="scroll-mt-6 pt-6"
                        aria-label="Store products"
                    >
                        <details className="mb-4 rounded-xl border border-border bg-card p-4 lg:hidden">
                            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold">
                                <SlidersHorizontal className="size-4" />
                                Filters
                            </summary>
                            <div className="mt-4">{filterSidebar()}</div>
                        </details>

                        <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                            <aside className="sticky top-24 hidden rounded-xl border border-border bg-card p-4 lg:block">
                                {filterSidebar()}
                            </aside>
                            <div className="min-w-0">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm text-muted-foreground">
                                        Showing{' '}
                                        <span className="font-semibold text-foreground">
                                            {products.data.length}
                                        </span>{' '}
                                        of{' '}
                                        <span className="font-semibold text-foreground">
                                            {products.total}
                                        </span>{' '}
                                        products
                                    </p>
                                    <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs">
                                        <span className="text-muted-foreground">
                                            Sort by
                                        </span>
                                        <select
                                            value={filters.sort}
                                            onChange={(event) =>
                                                applyFilters({
                                                    ...filters,
                                                    sort: event.target.value,
                                                })
                                            }
                                            className="max-w-32 bg-transparent font-medium outline-none"
                                        >
                                            <option value="relevance">
                                                Relevance
                                            </option>
                                            <option value="newest">
                                                Newest
                                            </option>
                                            <option value="price_asc">
                                                Price: low to high
                                            </option>
                                            <option value="price_desc">
                                                Price: high to low
                                            </option>
                                            <option value="rating">
                                                Top rated
                                            </option>
                                        </select>
                                    </label>
                                </div>

                                {products.data.length ? (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
                                        {products.data.map((product, index) => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                index={index}
                                                onAddToCart={
                                                    product.default_variant_id &&
                                                    product.default_branch_id
                                                        ? () =>
                                                              void purchase(
                                                                  product,
                                                                  'cart',
                                                              )
                                                        : undefined
                                                }
                                                onBuyNow={
                                                    product.default_variant_id &&
                                                    product.default_branch_id
                                                        ? () =>
                                                              void purchase(
                                                                  product,
                                                                  'buy-now',
                                                              )
                                                        : undefined
                                                }
                                                busy={
                                                    busy?.id === product.id
                                                        ? busy.kind
                                                        : null
                                                }
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border px-6 text-center">
                                        <div>
                                            <p className="text-lg font-semibold">
                                                No products match these filters
                                            </p>
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                Try adjusting or clearing your
                                                filters.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {products.last_page > 1 && (
                                    <div className="mt-8">
                                        <Pagination links={products.links} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}
