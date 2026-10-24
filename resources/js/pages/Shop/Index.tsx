import { Head, router } from '@inertiajs/react';
import { ArrowDownWideNarrow, SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import FilterSidebar from '@/components/storefront/FilterSidebar';
import type {
    FilterOptions,
    ShopFilters,
} from '@/components/storefront/FilterSidebar';
import Pagination from '@/components/storefront/Pagination';
import ProductCard from '@/components/storefront/ProductCard';
import ProductGridSkeleton from '@/components/storefront/ProductGridSkeleton';
import type {
    Paginated,
    StorefrontProduct,
} from '@/components/storefront/types';

const blankFilters: ShopFilters = {
    category: null,
    brand: [],
    gender: null,
    min_price: null,
    max_price: null,
    color: [],
    size: [],
    search: '',
    sort: 'newest',
};

function toQuery(
    filters: ShopFilters,
): Record<string, string | number | string[] | undefined> {
    return {
        category: filters.category ?? undefined,
        brand: filters.brand.length ? filters.brand : undefined,
        gender: filters.gender ?? undefined,
        min_price: filters.min_price ?? undefined,
        max_price: filters.max_price ?? undefined,
        color: filters.color.length ? filters.color : undefined,
        size: filters.size.length ? filters.size : undefined,
        search: filters.search || undefined,
        sort: filters.sort === 'newest' ? undefined : filters.sort,
    };
}

export default function ShopIndex({
    products,
    filters,
    options,
}: {
    products: Paginated<StorefrontProduct>;
    filters: ShopFilters;
    options: FilterOptions;
}) {
    const [draftFilters, setDraftFilters] = useState<ShopFilters>({
        ...blankFilters,
        ...filters,
        min_price: filters.min_price ?? null,
        max_price: filters.max_price ?? null,
    });
    const lastSubmittedFilters = useRef(
        JSON.stringify(toQuery({ ...blankFilters, ...filters })),
    );
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState<{
        id: number;
        kind: 'cart' | 'buy-now';
    } | null>(null);

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

    function cardActions(product: StorefrontProduct, index: number) {
        const purchasable = Boolean(
            product.default_variant_id && product.default_branch_id,
        );

        return {
            index,
            product,
            onAddToCart: purchasable
                ? () => void purchase(product, 'cart')
                : undefined,
            onBuyNow: purchasable
                ? () => void purchase(product, 'buy-now')
                : undefined,
            busy: busy?.id === product.id ? busy.kind : null,
        };
    }

    useEffect(() => {
        const removeStartListener = router.on('start', () => setLoading(true));
        const removeFinishListener = router.on('finish', () =>
            setLoading(false),
        );

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    useEffect(() => {
        const query = toQuery(draftFilters);
        const serializedFilters = JSON.stringify(query);

        if (serializedFilters === lastSubmittedFilters.current) return;

        const timeout = window.setTimeout(() => {
            lastSubmittedFilters.current = serializedFilters;
            router.get('/shop', query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [draftFilters]);

    const clearFilters = () => {
        setDraftFilters(blankFilters);
    };

    const updateFilter = <K extends keyof ShopFilters>(
        key: K,
        value: ShopFilters[K],
    ) => {
        setDraftFilters((current) => ({ ...current, [key]: value }));
    };

    return (
        <>
            <Head title="Shop the marketplace" />
            <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8">
                <header className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#17191f] px-6 py-10 text-white shadow-[0_24px_60px_rgba(18,24,35,0.18)] sm:px-10 sm:py-12">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_35%,rgba(239,68,68,0.18),transparent_38%),radial-gradient(ellipse_at_10%_100%,rgba(59,130,246,0.13),transparent_38%),linear-gradient(135deg,#17191f,#252a34)]" />
                    <div className="absolute -top-20 right-[-5rem] -z-10 size-72 rounded-full border border-white/10" />
                    <div className="absolute top-[-110%] right-[-8%] size-[28rem] rounded-full bg-primary/10 blur-3xl" />
                    <div className="relative">
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-xs font-semibold tracking-[0.12em] text-white/90 uppercase">
                            Find a new favorite
                        </p>
                        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                            The marketplace
                        </h1>
                        <p className="mt-3 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                            Good things from independent stores, carefully
                            gathered in one place.
                        </p>
                    </div>
                </header>

                <div className="mt-8 flex items-center justify-between gap-3 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setFiltersOpen(true)}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium"
                    >
                        <SlidersHorizontal className="size-4" /> Filters
                    </button>
                    <p className="text-sm text-muted-foreground">
                        {products.total}{' '}
                        {products.total === 1 ? 'item' : 'items'}
                    </p>
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-[238px_minmax(0,1fr)]">
                    <FilterSidebar
                        filters={draftFilters}
                        options={options}
                        onChange={updateFilter}
                        onClear={clearFilters}
                        open={filtersOpen}
                        onOpenChange={setFiltersOpen}
                    />
                    <section
                        className="min-w-0"
                        aria-label="Product results"
                        aria-busy={loading}
                    >
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <p className="hidden text-sm text-muted-foreground lg:block">
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
                            <label className="ml-auto inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm">
                                <ArrowDownWideNarrow className="size-4 text-muted-foreground" />
                                <span className="sr-only">Sort products</span>
                                <select
                                    value={draftFilters.sort}
                                    onChange={(event) =>
                                        updateFilter('sort', event.target.value)
                                    }
                                    className="max-w-40 bg-transparent outline-none dark:bg-black dark:text-white"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="price_asc">
                                        Price: low to high
                                    </option>
                                    <option value="price_desc">
                                        Price: high to low
                                    </option>
                                    <option value="rating">Top rated</option>
                                </select>
                            </label>
                        </div>

                        {loading ? (
                            <ProductGridSkeleton />
                        ) : products.data.length ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                                {products.data.map((product, index) => (
                                    <ProductCard
                                        key={product.id}
                                        {...cardActions(product, index)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-border px-6 text-center">
                                <div>
                                    <p className="text-lg font-semibold">
                                        No products found
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Try adjusting your search or clearing
                                        some filters.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="mt-4 text-sm font-semibold text-primary hover:underline"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            </div>
                        )}
                        {products.last_page > 1 && (
                            <div className="mt-10">
                                <Pagination links={products.links} />
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
