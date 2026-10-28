import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Banknote,
    Bell,
    ChevronRight,
    Heart,
    House,
    LogIn,
    LogOut,
    MapPin,
    Menu,
    Moon,
    PackageCheck,
    Search,
    Shapes,
    ShoppingBag,
    ShoppingCart,
    Sun,
    Truck,
    UserRound,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import CartDrawer, { type CartPayload } from './CartDrawer';

type Category = {
    id: number;
    name: string;
    slug: string;
    children?: Category[];
};

type Customer = {
    name: string;
    email: string;
} | null;

type PageProps = {
    auth: { customer: Customer };
    storefrontSettings?: {
        name: string;
        logo: string | null;
        currency: string;
        timezone: string;
    };
    storefront: {
        cartCount: number;
        favoritesCount: number;
        cart: CartPayload;
    };
    categories?: Category[];
    options?: { categories?: Category[] };
    storefrontCategories?: Category[];
};

const categoryUrl = (slug: string) =>
    `/shop?category=${encodeURIComponent(slug)}`;

const countLabel = (count: number) => (count > 99 ? '99+' : count);

const currencySymbols: Record<string, string> = {
    AED: 'د.إ',
    BDT: '৳',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    PKR: '₨',
    USD: '$',
};

function Brand({ className = '' }: { className?: string }) {
    const { props } = usePage<PageProps>();
    const settings = props.storefrontSettings;

    return (
        <Link
            href="/"
            className={`flex shrink-0 items-center gap-2.5 ${className}`}
        >
            {settings?.logo ? (
                <img
                    src={settings.logo}
                    alt=""
                    className="size-9 rounded-xl object-contain"
                />
            ) : (
                <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <ShoppingBag className="size-4" aria-hidden="true" />
                </span>
            )}
            <span className="font-semibold tracking-tight">
                {settings?.name ?? 'Marketplace'}
            </span>
        </Link>
    );
}

function MobileBottomNavigation({
    customer,
    cartCount,
    favoritesCount,
    pathname,
}: {
    customer: Customer;
    cartCount: number;
    favoritesCount: number;
    pathname: string;
}) {
    const accountUrl = customer
        ? '/customer/account/profile'
        : '/customer/login';
    const links = [
        {
            label: 'Home',
            href: '/',
            icon: House,
            active: pathname === '/',
        },
        {
            label: 'Wishlist',
            href: customer ? '/customer/wishlist' : '/customer/login',
            icon: Heart,
            active: pathname === '/customer/wishlist',
            count: favoritesCount,
        },
        {
            label: 'Cart',
            href: '/cart',
            icon: ShoppingCart,
            active: pathname === '/cart',
            count: cartCount,
        },
        {
            label: 'Account',
            href: accountUrl,
            icon: UserRound,
            active: pathname.startsWith('/customer/account'),
        },
    ];

    return (
        <nav
            aria-label="Mobile bottom navigation"
            className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-background/95 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-[0_-8px_24px_-16px_rgb(0_0_0/0.35)] backdrop-blur-xl lg:hidden"
        >
            {links
                .slice(0, 2)
                .map(({ label, href, icon: Icon, active, count }) => (
                    <Link
                        key={label}
                        href={href}
                        aria-label={label}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-medium transition ${
                            active ? 'text-primary' : 'text-muted-foreground'
                        }`}
                    >
                        <span className="relative">
                            <Icon className="size-5" aria-hidden="true" />
                            {count !== undefined && count > 0 && (
                                <span className="absolute -top-2 -right-2 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] leading-4 text-primary-foreground">
                                    {countLabel(count)}
                                </span>
                            )}
                        </span>
                        <span>{label}</span>
                    </Link>
                ))}

            <Link
                href="/shop"
                aria-label="Shop"
                aria-current={pathname.startsWith('/shop') ? 'page' : undefined}
                className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-primary"
            >
                <span className="-mt-5 grid size-12 place-items-center rounded-2xl border-4 border-background bg-primary text-primary-foreground shadow-md">
                    <ShoppingBag className="size-5" aria-hidden="true" />
                </span>
                <span>Shop</span>
            </Link>

            {links
                .slice(2)
                .map(({ label, href, icon: Icon, active, count }) => (
                    <Link
                        key={label}
                        href={href}
                        aria-label={label}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-medium transition ${
                            active ? 'text-primary' : 'text-muted-foreground'
                        }`}
                    >
                        <span className="relative">
                            <Icon className="size-5" aria-hidden="true" />
                            {count !== undefined && count > 0 && (
                                <span className="absolute -top-2 -right-2 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] leading-4 text-primary-foreground">
                                    {countLabel(count)}
                                </span>
                            )}
                        </span>
                        <span>{label}</span>
                    </Link>
                ))}
        </nav>
    );
}

function SearchForm({
    search,
    onSearchChange,
    className,
    placeholder,
}: {
    search: string;
    onSearchChange: (value: string) => void;
    className: string;
    placeholder: string;
}) {
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        router.get('/shop', { search: search.trim() || undefined });
    }

    return (
        <form onSubmit={handleSubmit} className={className}>
            <Search
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
            />
            <input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={placeholder}
                aria-label="Search products"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
        </form>
    );
}

function MobileNavigation({
    categories,
    onNavigate,
}: {
    categories: Category[];
    onNavigate: () => void;
}) {
    const categoryCards = categories.flatMap((category) => [
        category,
        ...(category.children ?? []),
    ]);

    return (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
            <nav aria-label="Product categories">
                {categoryCards.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                        {categoryCards.map((category) => (
                            <Link
                                key={category.id}
                                href={categoryUrl(category.slug)}
                                onClick={onNavigate}
                                className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-center text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                                <Shapes
                                    className="size-5 text-primary"
                                    aria-hidden="true"
                                />
                                <span className="line-clamp-2">
                                    {category.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                        No categories are available yet.
                    </p>
                )}
            </nav>
        </div>
    );
}

function DesktopNavigation({ categories }: { categories: Category[] }) {
    const { url } = usePage<PageProps>();
    const [menuOpen, setMenuOpen] = useState(false);
    const [pathname, query = ''] = url.split('?');
    const selectedCategory = new URLSearchParams(query).get('category');
    const selectedCategoryParent = categories.find(
        (category) =>
            category.slug === selectedCategory ||
            category.children?.some((child) => child.slug === selectedCategory),
    );
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(
        selectedCategoryParent?.id ?? categories[0]?.id ?? null,
    );
    useEffect(() => {
        if (selectedCategoryParent) {
            setActiveCategoryId(selectedCategoryParent.id);
        }
    }, [selectedCategoryParent?.id]);

    const isHomeActive = pathname === '/';
    const isShopActive = pathname.startsWith('/shop') && !selectedCategory;
    const isCategoryActive = pathname.startsWith('/shop') && !!selectedCategory;
    const isStoresActive = pathname.startsWith('/stores');
    const isAboutActive = pathname === '/about';
    const navigationItemClass = (isActive: boolean) =>
        `relative inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
            isActive
                ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`;
    const activeCategory =
        categories.find((category) => category.id === activeCategoryId) ??
        categories[0];

    return (
        <nav
            aria-label="Main navigation"
            className="relative hidden min-w-0 flex-1 items-center justify-center gap-6 self-stretch lg:flex"
            onMouseLeave={() => setMenuOpen(false)}
            onKeyDown={(event) => {
                if (event.key === 'Escape') setMenuOpen(false);
            }}
        >
            <Link
                href="/"
                aria-current={isHomeActive ? 'page' : undefined}
                className={navigationItemClass(isHomeActive)}
            >
                Home
            </Link>
            <Link
                href="/shop"
                aria-current={isShopActive ? 'page' : undefined}
                className={navigationItemClass(isShopActive)}
            >
                Shop
            </Link>
            <div className="flex-none">
                <button
                    type="button"
                    aria-expanded={menuOpen}
                    aria-controls="desktop-category-menu"
                    aria-current={isCategoryActive ? 'page' : undefined}
                    onClick={() => setMenuOpen((open) => !open)}
                    onMouseEnter={() => setMenuOpen(true)}
                    className={`${navigationItemClass(isCategoryActive || menuOpen)} gap-1.5`}
                >
                    Category
                    <ChevronRight
                        className={`size-3.5 rotate-90 transition-transform duration-200 ${
                            menuOpen ? '-rotate-90' : ''
                        }`}
                        aria-hidden="true"
                    />
                </button>
            </div>
            <Link
                href="/stores"
                aria-current={isStoresActive ? 'page' : undefined}
                className={navigationItemClass(isStoresActive)}
            >
                Stores
            </Link>
            <Link
                href="/about"
                aria-current={isAboutActive ? 'page' : undefined}
                className={navigationItemClass(isAboutActive)}
            >
                About
            </Link>
            {menuOpen && (
                <div
                    id="desktop-category-menu"
                    className="fixed inset-x-0 top-[4.5rem] z-50 w-full origin-top border-y border-border/80 bg-background/95 shadow-2xl backdrop-blur-xl"
                >
                    <div className="mx-auto grid max-h-[min(620px,calc(100dvh-6rem))] max-w-7xl grid-cols-[minmax(200px,260px)_minmax(0,1fr)] gap-0 px-4 py-5 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)_320px] lg:px-8">
                        <div
                            role="group"
                            aria-label="Categories"
                            className="min-h-0 overflow-y-auto border-r border-border pr-3"
                        >
                            {categories.length > 0 ? (
                                <ul className="space-y-1">
                                    {categories.map((category) => {
                                        const isActive =
                                            category.id === activeCategory?.id;

                                        return (
                                            <li key={category.id}>
                                                <button
                                                    type="button"
                                                    onMouseEnter={() =>
                                                        setActiveCategoryId(
                                                            category.id,
                                                        )
                                                    }
                                                    onFocus={() =>
                                                        setActiveCategoryId(
                                                            category.id,
                                                        )
                                                    }
                                                    onClick={() =>
                                                        setActiveCategoryId(
                                                            category.id,
                                                        )
                                                    }
                                                    aria-current={
                                                        isActive
                                                            ? 'true'
                                                            : undefined
                                                    }
                                                    className={`flex min-h-12 w-full items-center justify-between gap-3 border-l-[3px] px-3 text-left text-sm font-medium transition ${
                                                        isActive
                                                            ? 'border-primary bg-muted text-foreground'
                                                            : 'border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                                                    }`}
                                                >
                                                    <span className="line-clamp-2">
                                                        {category.name}
                                                    </span>
                                                    <ChevronRight
                                                        className={`size-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="p-4 text-sm text-muted-foreground">
                                    No categories are available yet.
                                </p>
                            )}
                        </div>

                        <section
                            aria-labelledby="active-category-heading"
                            className="min-w-0 overflow-y-auto px-5 py-2 sm:px-8"
                        >
                            {activeCategory ? (
                                <>
                                    <div className="mb-5 flex items-center justify-between gap-4">
                                        <h2
                                            id="active-category-heading"
                                            className="text-lg font-semibold tracking-tight"
                                        >
                                            {activeCategory.name}
                                        </h2>
                                        <Link
                                            href={categoryUrl(
                                                activeCategory.slug,
                                            )}
                                            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
                                        >
                                            View all
                                            <ArrowRight
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        </Link>
                                    </div>
                                    {activeCategory.children?.length ? (
                                        <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
                                            {activeCategory.children.map(
                                                (child) => (
                                                    <li key={child.id}>
                                                        <Link
                                                            href={categoryUrl(
                                                                child.slug,
                                                            )}
                                                            className="block rounded-md px-2 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                                        >
                                                            {child.name}
                                                        </Link>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    ) : (
                                        <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                                            Browse all products in{' '}
                                            {activeCategory.name}.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Choose a category to explore.
                                </p>
                            )}
                        </section>

                        <aside className="col-span-2 mt-5 flex min-h-64 flex-col rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950 p-6 text-white sm:p-8 lg:col-span-1 lg:mt-0">
                            <p className="text-xs font-semibold tracking-[0.12em] text-rose-400 uppercase">
                                Explore
                            </p>
                            <h2 className="mt-4 text-2xl leading-tight font-medium">
                                {activeCategory?.name ?? 'Our categories'}
                            </h2>
                            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/65">
                                Browse the top picks from verified marketplace
                                sellers.
                            </p>
                            <Link
                                href={
                                    activeCategory
                                        ? categoryUrl(activeCategory.slug)
                                        : '/shop'
                                }
                                className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                            >
                                Shop now
                                <ArrowRight
                                    className="size-4"
                                    aria-hidden="true"
                                />
                            </Link>
                            <div className="mt-5 space-y-2.5 text-sm text-white/75">
                                <p className="flex items-center gap-2">
                                    <Banknote
                                        className="size-4 text-emerald-300"
                                        aria-hidden="true"
                                    />
                                    100% Cash on Delivery
                                </p>
                                <p className="flex items-center gap-2">
                                    <Truck
                                        className="size-4 text-emerald-300"
                                        aria-hidden="true"
                                    />
                                    Fast home delivery
                                </p>
                            </div>
                        </aside>
                    </div>
                </div>
            )}
        </nav>
    );
}

function ThemeToggle({ className = '' }: { className?: string }) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const nextAppearance = resolvedAppearance === 'dark' ? 'light' : 'dark';
    const Icon = resolvedAppearance === 'dark' ? Sun : Moon;

    return (
        <button
            type="button"
            onClick={() => updateAppearance(nextAppearance)}
            aria-label={`Switch to ${nextAppearance} mode`}
            className={`grid size-10 place-items-center rounded-full transition hover:bg-muted ${className}`}
        >
            <Icon className="size-[18px]" aria-hidden="true" />
        </button>
    );
}

function WishlistLink({
    customer,
    count,
}: {
    customer: Customer;
    count: number;
}) {
    return (
        <Link
            href={customer ? '/customer/wishlist' : '/customer/login'}
            aria-label={`Favorites, ${count} items`}
            title="Favorites"
            className="relative grid size-10 place-items-center rounded-full transition hover:bg-muted"
        >
            <Heart className="size-[18px]" aria-hidden="true" />
            {count > 0 && (
                <span className="absolute top-1 right-0 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
                    {countLabel(count)}
                </span>
            )}
        </Link>
    );
}

function CustomerActions({ customer }: { customer: Customer }) {
    if (!customer) {
        return (
            <Link
                href="/customer/login"
                className="hidden h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/85 sm:inline-flex"
            >
                <LogIn className="size-4" aria-hidden="true" />
                Sign in
            </Link>
        );
    }

    return (
        <div className="group relative hidden sm:block">
            <button
                type="button"
                aria-label="Customer menu"
                className="grid size-10 place-items-center rounded-full border border-border transition hover:bg-muted"
            >
                <UserRound className="size-[18px]" aria-hidden="true" />
            </button>
            <div className="invisible absolute top-full right-0 z-50 mt-2 w-52 translate-y-1 rounded-xl border border-border bg-card p-2 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <p className="truncate px-3 py-2 text-xs text-muted-foreground">
                    {customer.name}
                </p>
                <Link
                    href="/customer/account/profile"
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                >
                    My account
                </Link>
                <button
                    type="button"
                    onClick={() => router.post('/customer/logout')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <LogOut className="size-4" aria-hidden="true" />
                    Sign out
                </button>
            </div>
        </div>
    );
}

export default function Navbar() {
    const { props, url } = usePage<PageProps>();
    const [search, setSearch] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const categories =
        props.storefrontCategories ??
        props.categories ??
        props.options?.categories ??
        [];
    const customer = props.auth.customer;
    const currency = props.storefrontSettings?.currency ?? 'BDT';
    const currencySymbol = currencySymbols[currency] ?? currency;
    const ordersUrl = customer ? '/customer/account/orders' : '/customer/login';

    return (
        <>
            <div>
                <div className="bg-[#17191f] text-white">
                    <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 text-xs sm:px-6 lg:px-8">
                        <div className="flex items-center gap-2 text-white/75">
                            <MapPin
                                className="size-3.5 shrink-0"
                                aria-hidden="true"
                            />
                            <span>Deliver to</span>
                            <span className="font-semibold text-white">
                                Dhaka, Bangladesh
                            </span>
                        </div>
                        <span className="font-medium lg:hidden">বাংলা / EN</span>
                        <nav
                            aria-label="Marketplace links"
                            className="hidden items-center gap-5 lg:flex"
                        >
                            <Link
                                href="/seller/onboarding"
                                className="text-white/75 transition hover:text-white"
                            >
                                Sell on Sheradam.shop
                            </Link>
                            <Link
                                href={ordersUrl}
                                className="text-white/75 transition hover:text-white"
                            >
                                Track order
                            </Link>
                            <Link
                                href="/faq"
                                className="text-white/75 transition hover:text-white"
                            >
                                Help center
                            </Link>
                        </nav>
                        <div className="hidden items-center gap-5 lg:flex">
                            <Link
                                href={ordersUrl}
                                className="inline-flex items-center gap-1.5 text-white/75 transition hover:text-white"
                            >
                                <Bell className="size-3.5" aria-hidden="true" />
                                Notifications
                            </Link>
                            <span className="text-white/75">বাংলা / EN</span>
                            <span className="font-medium">
                                {currency} {currencySymbol}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <header className="sticky top-0 z-40 border-b border-border/70 bg-background">
                <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:gap-4 lg:px-8">
                    <Brand />
                    <DesktopNavigation categories={categories} />
                    <SearchForm
                        search={search}
                        onSearchChange={setSearch}
                        placeholder="Search products"
                        className="ml-auto hidden h-10 max-w-64 min-w-40 flex-1 items-center gap-2 rounded-full border border-border bg-muted/50 px-3 lg:ml-0 lg:flex"
                    />

                    <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0">
                        <ThemeToggle className="lg:hidden" />
                        {customer && (
                            <Link
                                href="/customer/account/orders"
                                aria-label="My orders"
                                title="My orders"
                                className="grid size-10 place-items-center rounded-full transition hover:bg-muted lg:hidden"
                            >
                                <PackageCheck
                                    className="size-[18px]"
                                    aria-hidden="true"
                                />
                            </Link>
                        )}
                        <WishlistLink
                            customer={customer}
                            count={props.storefront.favoritesCount}
                        />
                        <CartDrawer initialCart={props.storefront.cart} />
                        <Link
                            href={
                                customer
                                    ? '/customer/account/profile'
                                    : '/customer/login'
                            }
                            aria-label={customer ? 'My account' : 'Sign in'}
                            title={customer ? 'My account' : 'Sign in'}
                            className="grid size-10 place-items-center rounded-full transition hover:bg-muted lg:hidden"
                        >
                            <UserRound
                                className="size-[18px]"
                                aria-hidden="true"
                            />
                        </Link>
                        <div className="hidden items-center gap-1 lg:flex">
                            <ThemeToggle />
                            <CustomerActions customer={customer} />
                        </div>
                    </div>
                </div>

                <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 pb-3 sm:px-6 lg:hidden lg:px-8">
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <button
                                type="button"
                                aria-label="Browse categories"
                                className="grid size-10 shrink-0 place-items-center rounded-full border border-border"
                            >
                                <Menu className="size-4" aria-hidden="true" />
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <SheetHeader>
                                <SheetTitle>Browse categories</SheetTitle>
                            </SheetHeader>
                            <MobileNavigation
                                categories={categories}
                                onNavigate={() => setMobileOpen(false)}
                            />
                        </SheetContent>
                    </Sheet>
                    <SearchForm
                        search={search}
                        onSearchChange={setSearch}
                        placeholder="Search products"
                        className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-muted/50 px-3"
                    />
                </div>
            </header>
            <MobileBottomNavigation
                customer={customer}
                cartCount={props.storefront.cartCount}
                favoritesCount={props.storefront.favoritesCount}
                pathname={url.split('?')[0]}
            />
        </>
    );
}
