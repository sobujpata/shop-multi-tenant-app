import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    ArrowRight,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    Loader2,
    ShieldCheck,
    ShoppingBag,
    Truck,
    Wallet,
    Zap,
} from 'lucide-react';
import ProductCard from '@/components/storefront/ProductCard';
import Pagination from '@/components/storefront/Pagination';
import { imageUrl, money } from '@/components/storefront/types';
import type {
    Paginated,
    StorefrontProduct,
} from '@/components/storefront/types';

type Category = {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    products_count: number;
};
type Brand = { id: number; name: string; slug: string; logo: string | null };
type Store = { id: number; name: string; slug: string; logo: string | null };

export default function Home({
    categories,
    featuredProducts,
    newArrivals,
    flashSaleProducts,
    allProducts,
    brands,
    stores,
}: {
    categories: Category[];
    featuredProducts: StorefrontProduct[];
    newArrivals: StorefrontProduct[];
    flashSaleProducts: StorefrontProduct[];
    allProducts: Paginated<StorefrontProduct>;
    brands: Brand[];
    stores: Store[];
}) {
    const homeRef = useRef<HTMLDivElement>(null);
    const [heroSlide, setHeroSlide] = useState(0);
    const [busy, setBusy] = useState<{
        id: number;
        kind: 'cart' | 'buy-now';
    } | null>(null);

    const heroSlides = [
        ...new Map(
            [...featuredProducts, ...newArrivals, ...flashSaleProducts]
                .filter((product) =>
                    product.images?.some((image) => image.path),
                )
                .map((product) => [product.id, product] as const),
        ).values(),
    ];
    const activeHeroSlide =
        heroSlides[heroSlide % Math.max(heroSlides.length, 1)];

    useEffect(() => {
        const root = homeRef.current;
        if (!root || !('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver(
            (entries, currentObserver) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    entry.target.classList.add('home-revealed');
                    currentObserver.unobserve(entry.target);
                });
            },
            { threshold: 0.08, rootMargin: '0px 0px -5% 0px' },
        );

        root.classList.add('home-animations-ready');
        root.querySelectorAll('[data-home-reveal]').forEach((element) => {
            observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (
            heroSlides.length < 2 ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            return;
        }

        const interval = window.setInterval(() => {
            setHeroSlide((current) => (current + 1) % heroSlides.length);
        }, 5000);

        return () => window.clearInterval(interval);
    }, [heroSlides.length]);

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
            reveal: true,
            onAddToCart: purchasable
                ? () => void purchase(product, 'cart')
                : undefined,
            onBuyNow: purchasable
                ? () => void purchase(product, 'buy-now')
                : undefined,
            busy: busy?.id === product.id ? busy.kind : null,
        };
    }

    const highestDiscount = Math.max(
        0,
        ...flashSaleProducts.map((product) =>
            Math.round(
                ((Number(product.base_price) - Number(product.sale_price)) /
                    Number(product.base_price)) *
                    100,
            ),
        ),
    );

    return (
        <>
            <Head title="Discover something different" />
            <div
                id="home-page"
                ref={homeRef}
                className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8"
            >
                <section
                    data-home-reveal
                    className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12"
                >
                    {/* Main hero banner */}
                    <div className="relative isolate grid min-h-[560px] grid-cols-1 gap-8 overflow-hidden rounded-[2rem] bg-[#17191f] p-6 text-white shadow-[0_24px_60px_rgba(18,24,35,0.18)] sm:p-10 lg:col-span-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-x-10 lg:gap-y-8 lg:p-10 xl:p-12">
                        {/* Background decoration */}
                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_35%,rgba(239,68,68,0.23),transparent_38%),radial-gradient(ellipse_at_10%_100%,rgba(59,130,246,0.13),transparent_38%),linear-gradient(135deg,#17191f,#252a34)]" />

                        <div className="absolute -top-20 -right-20 -z-10 h-72 w-72 rounded-full border border-white/10 sm:h-96 sm:w-96" />

                        <div className="absolute right-10 -bottom-32 -z-10 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />

                        {/* Top label */}
                        <div className="home-hero-copy relative z-10 min-w-0">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[0.68rem] font-semibold tracking-[0.16em] text-white/90">
                                <span className="h-2 w-2 rounded-full bg-red-400" />
                                BANGLADESH&apos;S MARKETPLACE
                            </span>

                            <h1 className="mt-7 max-w-full text-[1.7rem] leading-[0.96] font-black tracking-[-0.065em] sm:text-6xl xl:text-[2.4rem]">
                                Online Shopping
                                <span className="mt-1 block text-red-400">
                                    {' '}
                                    in Bangladesh,
                                </span>
                                <span className="block">All in One Place</span>
                            </h1>

                            <p className="mt-5 max-w-md text-base leading-7 text-white/70 sm:text-lg">
                                Buy everything — pay Cash on Delivery
                            </p>

                            {/* CTA buttons */}
                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link
                                    href="/shop"
                                    className="home-button inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 font-bold text-[#17191f] transition hover:bg-red-50"
                                >
                                    Shop now
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                </Link>

                                <Link
                                    href="#categories"
                                    className="home-button inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
                                >
                                    Browse categories
                                    <ArrowUpRight className="h-5 w-5" />
                                </Link>
                            </div>
                        </div>

                        <div className="group/hero relative z-10 min-w-0">
                            {activeHeroSlide ? (
                                <div
                                    className="hero-carousel-scene relative h-[300px] sm:h-[380px] lg:h-[420px]"
                                    aria-roledescription="carousel"
                                    aria-label="Featured products"
                                >
                                    {heroSlides.map((slide, index) => {
                                        const rawOffset = index - heroSlide;
                                        const offset =
                                            heroSlides.length < 2
                                                ? 0
                                                : ((((rawOffset +
                                                      heroSlides.length / 2) %
                                                      heroSlides.length) +
                                                      heroSlides.length) %
                                                      heroSlides.length) -
                                                  heroSlides.length / 2;
                                        const distance = Math.abs(offset);
                                        const isVisible = distance <= 2;
                                        const imagePath =
                                            slide.images.find(
                                                (image) => image.is_primary,
                                            )?.path ?? slide.images[0]?.path;

                                        if (!isVisible) return null;

                                        return (
                                            <Link
                                                key={slide.id}
                                                href={`/shop/${slide.slug}`}
                                                aria-label={`View ${slide.name}`}
                                                aria-hidden={offset !== 0}
                                                tabIndex={offset === 0 ? 0 : -1}
                                                className="hero-carousel-card absolute inset-0 overflow-hidden rounded-[1.7rem] border border-white/15 bg-slate-900 shadow-[0_24px_45px_rgba(0,0,0,0.32)]"
                                                data-active={offset === 0}
                                                style={{
                                                    transform: `translateX(${offset * 34}%) translateZ(${-distance * 90}px) rotateY(${offset * -30}deg) scale(${1 - distance * 0.14})`,
                                                    opacity:
                                                        1 - distance * 0.22,
                                                    zIndex: 10 - distance,
                                                    pointerEvents:
                                                        offset === 0
                                                            ? 'auto'
                                                            : 'none',
                                                }}
                                            >
                                                {imageUrl(imagePath) && (
                                                    <img
                                                        src={
                                                            imageUrl(
                                                                imagePath,
                                                            ) ?? undefined
                                                        }
                                                        alt={slide.name}
                                                        className="size-full object-cover"
                                                    />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/20" />
                                                <span className="hero-carousel-content absolute top-4 left-4 rounded-full border border-white/20 bg-black/35 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-white uppercase backdrop-blur-md">
                                                    Featured finds
                                                </span>
                                                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
                                                    <div className="hero-carousel-content hero-carousel-product-info min-w-0">
                                                        <p className="truncate text-xs font-medium text-white/75">
                                                            {slide.tenant
                                                                ?.name ??
                                                                slide.category
                                                                    ?.name ??
                                                                'Marketplace pick'}
                                                        </p>
                                                        <h2 className="mt-2 line-clamp-2 max-w-xl text-xl font-bold tracking-tight sm:text-3xl">
                                                            {slide.name}
                                                        </h2>
                                                        <p className="mt-2 text-lg font-bold sm:text-2xl">
                                                            {money(
                                                                slide.current_price ??
                                                                    slide.sale_price ??
                                                                    slide.base_price,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <span className="hero-carousel-content grid size-11 shrink-0 place-items-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25 transition group-hover/hero:bg-red-600">
                                                        <ArrowRight className="size-5" />
                                                    </span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex h-[300px] items-end rounded-[1.7rem] border border-white/15 bg-gradient-to-br from-rose-950 via-slate-900 to-blue-950 p-6 sm:h-[380px] sm:p-8 lg:h-[420px]">
                                    <div>
                                        <p className="text-xs font-semibold tracking-[0.16em] text-rose-300 uppercase">
                                            Discover the marketplace
                                        </p>
                                        <h2 className="mt-3 max-w-md text-3xl font-bold tracking-tight sm:text-4xl">
                                            Find something made for you.
                                        </h2>
                                        <Link
                                            href="/shop"
                                            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-rose-50"
                                        >
                                            Explore products
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </div>
                                </div>
                            )}
                            {heroSlides.length > 1 && (
                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                    <button
                                        type="button"
                                        aria-label="Previous featured product"
                                        onClick={() =>
                                            setHeroSlide(
                                                (current) =>
                                                    (current -
                                                        1 +
                                                        heroSlides.length) %
                                                    heroSlides.length,
                                            )
                                        }
                                        className="home-button grid size-9 place-items-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur transition hover:bg-black/60"
                                    >
                                        <ChevronLeft className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Next featured product"
                                        onClick={() =>
                                            setHeroSlide(
                                                (current) =>
                                                    (current + 1) %
                                                    heroSlides.length,
                                            )
                                        }
                                        className="home-button grid size-9 place-items-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur transition hover:bg-black/60"
                                    >
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            )}
                            {heroSlides.length > 1 && (
                                <div
                                    className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5"
                                    aria-label="Featured product slides"
                                >
                                    {heroSlides.map((slide, index) => (
                                        <button
                                            key={slide.id}
                                            type="button"
                                            aria-label={`Show featured product ${index + 1}`}
                                            aria-current={
                                                index === heroSlide
                                                    ? 'true'
                                                    : undefined
                                            }
                                            onClick={() => setHeroSlide(index)}
                                            className={`home-button h-1.5 rounded-full transition-all ${
                                                index === heroSlide
                                                    ? 'w-6 bg-white'
                                                    : 'w-1.5 bg-white/55 hover:bg-white/80'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Trust indicators */}
                        <div className="relative z-10 grid grid-cols-1 gap-4 border-t border-white/10 pt-6 sm:grid-cols-3 sm:gap-6 lg:col-span-2 lg:mt-0">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                                    <ShieldCheck className="h-5 w-5 text-red-300" />
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        Trusted Shopping
                                    </p>
                                    <p className="mt-1 text-xs text-white/55">
                                        Shop with confidence
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                                    <Wallet className="h-5 w-5 text-red-300" />
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        Cash on Delivery
                                    </p>
                                    <p className="mt-1 text-xs text-white/55">
                                        Pay when it arrives
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                                    <Truck className="h-5 w-5 text-red-300" />
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        Nationwide Delivery
                                    </p>
                                    <p className="mt-1 text-xs text-white/55">
                                        Across Bangladesh
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    data-home-reveal
                    id="categories"
                    className="scroll-mt-28 pt-20 sm:pt-24"
                >
                    <div className="mb-7 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                                Start somewhere good
                            </p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Browse by category
                            </h2>
                        </div>
                        <Link
                            href="/categories"
                            className="hidden items-center gap-2 text-sm font-medium hover:text-primary sm:inline-flex"
                        >
                            All categories <ArrowRight className="size-4" />
                        </Link>
                    </div>
                    {categories.length ? (
                        <div className="overflow-hidden">
                            <div
                                className="category-marquee-track flex w-max"
                                role="region"
                                aria-label="All product categories, scrolling right to left"
                            >
                                {[0, 1].map((copy) => (
                                    <div
                                        key={copy}
                                        className="flex shrink-0 gap-3 pr-3 sm:gap-5 sm:pr-5"
                                        aria-hidden={copy === 1}
                                    >
                                        {categories.map((category, index) => (
                                            <Link
                                                key={`${copy}-${category.id}`}
                                                href={`/shop?category=${encodeURIComponent(category.slug)}`}
                                                tabIndex={
                                                    copy === 1 ? -1 : undefined
                                                }
                                                className="group relative block h-48 w-56 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted sm:h-56 sm:w-64"
                                            >
                                                {category.image && (
                                                    <img
                                                        src={
                                                            imageUrl(
                                                                category.image,
                                                            ) ?? undefined
                                                        }
                                                        alt=""
                                                        loading="lazy"
                                                        className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
                                                    />
                                                )}
                                                <div
                                                    className={`absolute inset-0 ${category.image ? 'bg-gradient-to-t from-black/70 via-black/10 to-transparent' : index % 2 ? 'bg-gradient-to-br from-amber-200/70 via-orange-100 to-rose-100 dark:from-amber-950 dark:via-orange-950 dark:to-rose-950' : 'bg-gradient-to-br from-emerald-200/70 via-teal-100 to-cyan-100 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950'}`}
                                                />
                                                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 sm:p-5">
                                                    <div
                                                        className={
                                                            category.image
                                                                ? 'text-white'
                                                                : ''
                                                        }
                                                    >
                                                        <h3 className="text-lg font-semibold sm:text-xl">
                                                            {category.name}
                                                        </h3>
                                                        <p
                                                            className={`mt-1 text-xs ${category.image ? 'text-white/75' : 'text-muted-foreground'}`}
                                                        >
                                                            {
                                                                category.products_count
                                                            }{' '}
                                                            items
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`grid size-9 place-items-center rounded-full transition group-hover:translate-x-1 ${category.image ? 'bg-white text-black' : 'bg-background/80 text-foreground'}`}
                                                    >
                                                        <ArrowUpRight className="size-4" />
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                            Categories will appear here as stores add them.
                        </p>
                    )}
                </section>

                <section
                    data-home-reveal
                    aria-labelledby="flash-sale-heading"
                    className="pt-16 sm:pt-20"
                >
                    <div className="mb-5 flex flex-col justify-between gap-4 rounded-[1.75rem] bg-gradient-to-r from-[#20151b] via-[#3b101b] to-[#650b20] px-5 py-5 text-white shadow-[0_18px_45px_rgba(83,8,32,0.18)] sm:flex-row sm:items-center sm:px-7 sm:py-6 lg:px-8">
                        <div className="flex items-center gap-4">
                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-950/30">
                                <Zap className="h-7 w-7 fill-current" />
                            </span>
                            <div>
                                <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-rose-200/75 uppercase">
                                    Limited-time deals
                                    {highestDiscount > 0 &&
                                        ` · Up to ${highestDiscount}% off`}
                                </p>
                                <h2
                                    id="flash-sale-heading"
                                    className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
                                >
                                    Flash Sale
                                </h2>
                            </div>
                        </div>
                        <p className="max-w-sm text-sm leading-6 text-rose-100/75 sm:mx-auto sm:px-5">
                            Great prices on selected finds. Shop your favorites
                            before these deals are gone.
                        </p>
                        <Link
                            href="/shop"
                            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-rose-100 px-5 py-3 text-sm font-semibold text-rose-950 transition hover:bg-white sm:self-auto"
                        >
                            View all deals
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {flashSaleProducts.length ? (
                        <div className="overflow-hidden rounded-2xl">
                            <div
                                className="flash-sale-track flex w-max"
                                role="region"
                                aria-label="Discounted products, scrolling right to left"
                            >
                                {[0, 1].map((copy) => (
                                    <div
                                        key={copy}
                                        className="flex shrink-0 gap-4 pr-4"
                                        aria-hidden={copy === 1}
                                    >
                                        {flashSaleProducts.map(
                                            (product, index) => {
                                                const basePrice = Number(
                                                    product.base_price,
                                                );
                                                const salePrice = Number(
                                                    product.sale_price,
                                                );
                                                const discount = Math.round(
                                                    ((basePrice - salePrice) /
                                                        basePrice) *
                                                        100,
                                                );
                                                const image = imageUrl(
                                                    product.images?.find(
                                                        (item) =>
                                                            item.is_primary,
                                                    )?.path ??
                                                        product.images?.[0]
                                                            ?.path,
                                                );

                                                return (
                                                    <article
                                                        key={`${copy}-${product.id}`}
                                                        className="group w-[248px] shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm sm:w-[270px]"
                                                    >
                                                        <Link
                                                            href={`/shop/${product.slug}`}
                                                            tabIndex={
                                                                copy === 1
                                                                    ? -1
                                                                    : 0
                                                            }
                                                            className="relative block h-[230px] overflow-hidden bg-muted"
                                                        >
                                                            {image ? (
                                                                <img
                                                                    src={image}
                                                                    alt={
                                                                        copy ===
                                                                        1
                                                                            ? ''
                                                                            : product.name
                                                                    }
                                                                    loading={
                                                                        index <
                                                                        4
                                                                            ? 'eager'
                                                                            : 'lazy'
                                                                    }
                                                                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                                                                />
                                                            ) : (
                                                                <div className="grid size-full place-items-center bg-gradient-to-br from-rose-100 to-amber-100 text-5xl font-semibold text-rose-400 dark:from-rose-950 dark:to-amber-950">
                                                                    {product.name.slice(
                                                                        0,
                                                                        1,
                                                                    )}
                                                                </div>
                                                            )}
                                                            <span className="absolute top-3 left-3 rounded-md bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                                                                -{discount}%
                                                            </span>
                                                        </Link>
                                                        <div className="space-y-2 p-4">
                                                            <p className="truncate text-xs font-medium text-muted-foreground">
                                                                {product.brand
                                                                    ?.name ??
                                                                    product
                                                                        .category
                                                                        ?.name ??
                                                                    'Marketplace'}
                                                            </p>
                                                            <Link
                                                                href={`/shop/${product.slug}`}
                                                                tabIndex={
                                                                    copy === 1
                                                                        ? -1
                                                                        : 0
                                                                }
                                                                className="line-clamp-2 block min-h-10 text-sm leading-5 font-medium hover:text-primary"
                                                            >
                                                                {product.name}
                                                            </Link>
                                                            <div className="flex items-center gap-2 pt-1">
                                                                <span className="font-bold">
                                                                    {money(
                                                                        salePrice,
                                                                    )}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground line-through">
                                                                    {money(
                                                                        basePrice,
                                                                    )}
                                                                </span>
                                                                <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[0.65rem] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                                                    -{discount}%
                                                                </span>
                                                            </div>
                                                            {product.default_variant_id &&
                                                                product.default_branch_id && (
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            tabIndex={
                                                                                copy ===
                                                                                1
                                                                                    ? -1
                                                                                    : 0
                                                                            }
                                                                            onClick={() =>
                                                                                void purchase(
                                                                                    product,
                                                                                    'cart',
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                busy?.id ===
                                                                                product.id
                                                                            }
                                                                            aria-label={`Add ${product.name} to cart`}
                                                                            title="Add to cart"
                                                                            className="grid size-10 shrink-0 place-items-center rounded-lg border border-border text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                                                            {busy?.id ===
                                                                                product.id &&
                                                                            busy.kind ===
                                                                                'cart' ? (
                                                                                <Loader2 className="size-4 animate-spin" />
                                                                            ) : (
                                                                                <ShoppingBag className="size-4" />
                                                                            )}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            tabIndex={
                                                                                copy ===
                                                                                1
                                                                                    ? -1
                                                                                    : 0
                                                                            }
                                                                            onClick={() =>
                                                                                void purchase(
                                                                                    product,
                                                                                    'buy-now',
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                busy?.id ===
                                                                                product.id
                                                                            }
                                                                            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                                                            {busy?.id ===
                                                                                product.id &&
                                                                            busy.kind ===
                                                                                'buy-now' ? (
                                                                                <Loader2 className="size-4 animate-spin" />
                                                                            ) : (
                                                                                <Zap className="size-4" />
                                                                            )}
                                                                            Buy
                                                                            Now
                                                                        </button>
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </article>
                                                );
                                            },
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                            No discounted products are available right now.
                            Check back soon for the next Flash Sale.
                        </p>
                    )}
                </section>

                <section data-home-reveal className="pt-16 sm:pt-20">
                    <div className="mb-7 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                                Find your next favorite
                            </p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                All products
                            </h2>
                        </div>
                        <Link
                            href="/shop"
                            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium hover:text-primary"
                        >
                            View all <ArrowRight className="size-4" />
                        </Link>
                    </div>
                    {allProducts.data.length ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-6">
                            {allProducts.data.map((product, index) => (
                                <ProductCard
                                    key={product.id}
                                    {...cardActions(product, index)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                            Products will appear here as stores add them.
                        </p>
                    )}
                    {allProducts.last_page > 1 && (
                        <div className="mt-8">
                            <Pagination links={allProducts.links} align="end" />
                        </div>
                    )}
                </section>

                <section data-home-reveal className="pt-16 sm:pt-20">
                    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                                Shop with confidence
                            </p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Featured stores · Verified sellers
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                                Hand-picked verified stores — every product
                                backed by our 7-day return guarantee.
                            </p>
                        </div>
                        <Link
                            href="/stores"
                            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium hover:text-primary"
                        >
                            Browse all stores <ArrowRight className="size-4" />
                        </Link>
                    </div>
                    {stores.length ? (
                        <div className="grid grid-cols-2 gap-3 rounded-3xl border border-border p-3 sm:grid-cols-4 sm:gap-4 sm:p-4 lg:grid-cols-8">
                            {stores.map((store) => (
                                <Link
                                    key={store.id}
                                    href={`/stores/${store.slug}`}
                                    className="flex min-h-[112px] items-center justify-center rounded-2xl border border-border/70 bg-muted px-4 py-5 text-center transition hover:border-primary/40"
                                    aria-label={`View ${store.name} store`}
                                >
                                    {store.logo ? (
                                        <img
                                            src={imageUrl(store.logo) ?? ''}
                                            alt={`${store.name} logo`}
                                            loading="lazy"
                                            className="max-h-12 max-w-full object-contain"
                                        />
                                    ) : (
                                        <span className="line-clamp-2 text-sm font-semibold">
                                            {store.name}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                            Stores will appear here as sellers join the
                            marketplace.
                        </p>
                    )}
                </section>

                <section data-home-reveal className="pt-20 sm:pt-24">
                    <div className="mb-7 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                                Loved around the marketplace
                            </p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                The good stuff
                            </h2>
                        </div>
                        <Link
                            href="/shop?sort=rating"
                            className="inline-flex items-center gap-2 text-sm font-medium hover:text-primary"
                        >
                            See everything <ArrowRight className="size-4" />
                        </Link>
                    </div>
                    {featuredProducts.length ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-6">
                            {featuredProducts
                                .slice(0, 12)
                                .map((product, index) => (
                                    <ProductCard
                                        key={product.id}
                                        {...cardActions(product, index)}
                                    />
                                ))}
                        </div>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                            New finds are on their way. Check back soon.
                        </p>
                    )}
                </section>

                <section data-home-reveal className="pt-20 sm:pt-24">
                    <div className="relative overflow-hidden rounded-[2rem] bg-muted px-6 py-10 sm:px-10 lg:px-14">
                        <div className="absolute top-[-50%] right-[-8%] size-96 rounded-full bg-primary/10 blur-3xl" />
                        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                            <div>
                                <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                                    Freshly added
                                </p>
                                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                    Just landed
                                </h2>
                            </div>
                            <Link
                                href="/shop?sort=newest"
                                className="inline-flex w-fit items-center gap-2 text-sm font-semibold hover:text-primary"
                            >
                                Browse new arrivals{' '}
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </div>
                    {newArrivals.length ? (
                        <div className="mt-6 overflow-hidden rounded-2xl">
                            <div
                                className="new-arrivals-track flex w-max gap-4 pr-4 sm:gap-5 sm:pr-5"
                                role="region"
                                aria-label="New arrivals, scrolling right to left"
                            >
                                {[0, 1].map((copy) => (
                                    <div
                                        key={copy}
                                        className="flex shrink-0 gap-3 pr-3 sm:gap-5 sm:pr-5"
                                        aria-hidden={copy === 1}
                                    >
                                        {newArrivals
                                            .slice(0, 12)
                                            .map((product, index) => (
                                                <div
                                                    key={`${copy}-${product.id}`}
                                                    className="w-[210px] shrink-0 sm:w-[240px]"
                                                >
                                                    <ProductCard
                                                        {...cardActions(
                                                            product,
                                                            index,
                                                        )}
                                                        buttonTabIndex={
                                                            copy === 1 ? -1 : 0
                                                        }
                                                    />
                                                </div>
                                            ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                            New arrivals will show up here.
                        </p>
                    )}
                </section>

                <section data-home-reveal className="pt-20 pb-4 sm:pt-24">
                    <div className="mb-7 flex items-end justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                                Independent favorites
                            </p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Meet the brands
                            </h2>
                        </div>
                        <Link
                            href="/brands"
                            className="inline-flex items-center gap-2 text-sm font-medium hover:text-primary"
                        >
                            Discover all <ArrowRight className="size-4" />
                        </Link>
                    </div>
                    {brands.length ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                            {brands.map((brand) => (
                                <Link
                                    key={brand.id}
                                    href={`/shop?brand[]=${encodeURIComponent(brand.slug)}`}
                                    className="group flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                                >
                                    {brand.logo ? (
                                        <img
                                            src={
                                                imageUrl(brand.logo) ??
                                                undefined
                                            }
                                            alt=""
                                            loading="lazy"
                                            className="size-10 rounded-full object-contain"
                                        />
                                    ) : (
                                        <span className="grid size-10 place-items-center rounded-full bg-primary/10 font-serif text-lg text-primary">
                                            {brand.name.slice(0, 1)}
                                        </span>
                                    )}
                                    <span className="text-sm font-medium transition group-hover:text-primary">
                                        {brand.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Our featured brands will appear here.
                        </p>
                    )}
                </section>
            </div>
        </>
    );
}
