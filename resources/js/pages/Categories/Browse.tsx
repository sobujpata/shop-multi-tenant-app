import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    BadgeCheck,
    Boxes,
    Search,
    Shapes,
} from 'lucide-react';
import Pagination from '@/components/storefront/Pagination';
import { imageUrl } from '@/components/storefront/types';
import type { PaginationLink } from '@/components/storefront/types';

type Category = {
    id: number;
    name: string;
    slug: string;
    parent: string | null;
    products_count: number;
    image: string | null;
};

type PaginatedCategories = {
    data: Category[];
    links: PaginationLink[];
    total: number;
};

const bannerColors = [
    'from-rose-100 to-orange-100 dark:from-rose-950/50 dark:to-orange-950/50',
    'from-violet-100 to-purple-200 dark:from-violet-950/50 dark:to-purple-950/50',
    'from-fuchsia-100 to-pink-200 dark:from-fuchsia-950/50 dark:to-pink-950/50',
    'from-blue-100 to-indigo-200 dark:from-blue-950/50 dark:to-indigo-950/50',
    'from-amber-100 to-orange-200 dark:from-amber-950/50 dark:to-orange-950/50',
];

export default function CategoryBrowse({
    categories,
    filters,
}: {
    categories: PaginatedCategories;
    filters: { search: string };
}) {
    return (
        <>
            <Head title="All categories" />
            <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8 lg:px-8">
                <nav
                    aria-label="Breadcrumb"
                    className="mb-5 flex items-center gap-2 text-sm text-muted-foreground"
                >
                    <Link href="/" className="transition hover:text-foreground">
                        Home
                    </Link>
                    <span aria-hidden="true">›</span>
                    <span className="font-medium text-foreground">
                        Categories
                    </span>
                </nav>

                <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#17191f] px-6 py-10 text-white shadow-[0_24px_60px_rgba(18,24,35,0.18)] sm:px-10 sm:py-12">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_35%,rgba(239,68,68,0.18),transparent_38%),radial-gradient(ellipse_at_10%_100%,rgba(59,130,246,0.13),transparent_38%),linear-gradient(135deg,#17191f,#252a34)]" />
                    <div className="absolute -top-20 right-[-5rem] size-72 rounded-full border border-white/10" />
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-xs font-semibold tracking-[0.12em] text-white/90 uppercase">
                        <BadgeCheck className="size-4 text-rose-400" />
                        Find what you need
                    </span>
                    <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                        All Categories
                    </h1>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                        Explore every department and discover products from
                        trusted marketplace stores.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
                        <div className="min-w-24 border-r border-white/15 pr-8">
                            <p className="text-3xl font-bold">
                                {categories.total}
                            </p>
                            <p className="mt-1 text-sm text-white/65">
                                Categories
                            </p>
                        </div>
                        <div className="min-w-32 border-r border-white/15 pr-8">
                            <p className="text-3xl font-bold">
                                {categories.data.length}
                            </p>
                            <p className="mt-1 text-sm text-white/65">
                                Shown on this page
                            </p>
                        </div>
                        <div>
                            <p className="flex items-center gap-2 text-3xl font-bold">
                                <Boxes className="size-7 text-rose-300" />
                                Shop
                            </p>
                            <p className="mt-1 text-sm text-white/65">
                                By department
                            </p>
                        </div>
                    </div>
                </section>

                <form
                    action="/categories"
                    method="get"
                    role="search"
                    className="mt-8 flex max-w-2xl items-center gap-3 rounded-full border border-border bg-background p-2 pl-4 shadow-sm focus-within:ring-2 focus-within:ring-primary/20"
                >
                    <Search className="size-5 shrink-0 text-muted-foreground" />
                    <input
                        type="search"
                        name="search"
                        defaultValue={filters.search}
                        placeholder="Search categories..."
                        aria-label="Search categories"
                        className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <button
                        type="submit"
                        className="h-10 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                        Search
                    </button>
                </form>

                {categories.data.length ? (
                    <>
                        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            {categories.data.map((category, index) => (
                                <Link
                                    key={category.id}
                                    href={`/shop?category=${encodeURIComponent(category.slug)}`}
                                    className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                    aria-label={`Browse ${category.name} products`}
                                >
                                    <div
                                        className={`relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br ${bannerColors[index % bannerColors.length]}`}
                                    >
                                        {category.image ? (
                                            <img
                                                src={
                                                    imageUrl(category.image) ??
                                                    ''
                                                }
                                                alt=""
                                                loading="lazy"
                                                className="size-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <Shapes
                                                aria-hidden="true"
                                                className="size-12 text-primary/35 transition duration-300 group-hover:scale-110"
                                            />
                                        )}
                                    </div>
                                    <div className="relative px-4 py-4">
                                        <span
                                            aria-hidden="true"
                                            className="absolute top-3 right-4 grid size-9 place-items-center rounded-full bg-muted text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary"
                                        >
                                            <ArrowUpRight className="size-4" />
                                        </span>
                                        <p className="pr-12 text-xs font-medium text-muted-foreground">
                                            {category.parent ??
                                                'Marketplace category'}
                                        </p>
                                        <h2 className="mt-1 line-clamp-1 pr-12 font-semibold">
                                            {category.name}
                                        </h2>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {category.products_count}{' '}
                                            {category.products_count === 1
                                                ? 'product'
                                                : 'products'}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="mt-8">
                            <Pagination links={categories.links} />
                        </div>
                    </>
                ) : (
                    <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
                        <p className="text-lg font-semibold">
                            No categories found
                        </p>
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
