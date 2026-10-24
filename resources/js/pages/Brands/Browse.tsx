import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    BadgeCheck,
    Search,
    Sparkles,
    Store,
} from 'lucide-react';
import Pagination from '@/components/storefront/Pagination';
import type { PaginationLink } from '@/components/storefront/types';

type Brand = {
    id: number;
    name: string;
    slug: string;
    products_count: number;
    logo: string | null;
};

type PaginatedBrands = {
    data: Brand[];
    links: PaginationLink[];
    total: number;
};

const logoBackgrounds = [
    'from-rose-100 to-orange-100 dark:from-rose-950/50 dark:to-orange-950/50',
    'from-violet-100 to-purple-200 dark:from-violet-950/50 dark:to-purple-950/50',
    'from-fuchsia-100 to-pink-200 dark:from-fuchsia-950/50 dark:to-pink-950/50',
    'from-blue-100 to-indigo-200 dark:from-blue-950/50 dark:to-indigo-950/50',
    'from-amber-100 to-orange-200 dark:from-amber-950/50 dark:to-orange-950/50',
];

export default function BrandBrowse({
    brands,
    filters,
}: {
    brands: PaginatedBrands;
    filters: { search: string };
}) {
    return (
        <>
            <Head title="All brands" />
            <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8 lg:px-8">
                <nav
                    aria-label="Breadcrumb"
                    className="mb-5 flex items-center gap-2 text-sm text-muted-foreground"
                >
                    <Link href="/" className="transition hover:text-foreground">
                        Home
                    </Link>
                    <span aria-hidden="true">›</span>
                    <span className="font-medium text-foreground">Brands</span>
                </nav>

                <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#17191f] px-6 py-10 text-white shadow-[0_24px_60px_rgba(18,24,35,0.18)] sm:px-10 sm:py-12">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_35%,rgba(239,68,68,0.18),transparent_38%),radial-gradient(ellipse_at_10%_100%,rgba(59,130,246,0.13),transparent_38%),linear-gradient(135deg,#17191f,#252a34)]" />
                    <div className="absolute -top-20 right-[-5rem] size-72 rounded-full border border-white/10" />
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-xs font-semibold tracking-[0.12em] text-white/90 uppercase">
                        <BadgeCheck className="size-4 text-rose-400" />
                        Independent favorites
                    </span>
                    <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                        All Brands
                    </h1>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                        Discover the brands behind your favorite finds and
                        explore their products from trusted marketplace stores.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
                        <div className="min-w-24 border-r border-white/15 pr-8">
                            <p className="text-3xl font-bold">{brands.total}</p>
                            <p className="mt-1 text-sm text-white/65">Brands</p>
                        </div>
                        <div className="min-w-32 border-r border-white/15 pr-8">
                            <p className="text-3xl font-bold">
                                {brands.data.length}
                            </p>
                            <p className="mt-1 text-sm text-white/65">
                                Shown on this page
                            </p>
                        </div>
                        <div>
                            <p className="flex items-center gap-2 text-3xl font-bold">
                                <Store className="size-7 text-rose-300" />
                                Shop
                            </p>
                            <p className="mt-1 text-sm text-white/65">
                                By brand
                            </p>
                        </div>
                    </div>
                </section>

                <form
                    action="/brands"
                    method="get"
                    role="search"
                    className="mt-8 flex max-w-2xl items-center gap-3 rounded-full border border-border bg-background p-2 pl-4 shadow-sm focus-within:ring-2 focus-within:ring-primary/20"
                >
                    <Search className="size-5 shrink-0 text-muted-foreground" />
                    <input
                        type="search"
                        name="search"
                        defaultValue={filters.search}
                        placeholder="Search brands..."
                        aria-label="Search brands"
                        className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <button
                        type="submit"
                        className="h-10 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                        Search
                    </button>
                </form>

                {brands.data.length ? (
                    <>
                        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                            {brands.data.map((brand, index) => (
                                <Link
                                    key={brand.id}
                                    href={`/shop?brand[]=${encodeURIComponent(brand.slug)}`}
                                    className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                    aria-label={`Browse ${brand.name} products`}
                                >
                                    <div
                                        className={`relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br ${logoBackgrounds[index % logoBackgrounds.length]}`}
                                    >
                                        {brand.logo ? (
                                            <img
                                                src={brand.logo}
                                                alt=""
                                                loading="lazy"
                                                className="size-20 rounded-full bg-white/80 object-contain p-2 shadow-sm transition duration-500 group-hover:scale-105 dark:bg-slate-900/80"
                                            />
                                        ) : (
                                            <span className="grid size-20 place-items-center rounded-full bg-white/60 font-serif text-3xl font-semibold text-primary shadow-sm transition duration-300 group-hover:scale-105 dark:bg-slate-900/60">
                                                {brand.name.slice(0, 1)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative px-4 py-4">
                                        <span
                                            aria-hidden="true"
                                            className="absolute top-3 right-4 grid size-9 place-items-center rounded-full bg-muted text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary"
                                        >
                                            <ArrowUpRight className="size-4" />
                                        </span>
                                        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                            <Sparkles className="size-3.5 text-primary" />
                                            Marketplace brand
                                        </p>
                                        <h2 className="mt-1 line-clamp-1 pr-10 font-semibold">
                                            {brand.name}
                                        </h2>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {brand.products_count}{' '}
                                            {brand.products_count === 1
                                                ? 'product'
                                                : 'products'}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="mt-8">
                            <Pagination links={brands.links} />
                        </div>
                    </>
                ) : (
                    <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
                        <p className="text-lg font-semibold">No brands found</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Try another search or explore all available
                            products.
                        </p>
                        <Link
                            href="/shop"
                            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                        >
                            Browse products <ArrowRight className="size-4" />
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
