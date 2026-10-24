import { Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { BookHeart, MapPin, Package, UserRound } from 'lucide-react';

const navigation = [
    { label: 'Profile', href: '/customer/account/profile', icon: UserRound },
    { label: 'Addresses', href: '/customer/account/addresses', icon: MapPin },
    { label: 'Orders', href: '/customer/account/orders', icon: Package },
    { label: 'Wishlist', href: '/customer/wishlist', icon: BookHeart },
];

type AccountPageProps = {
    auth: {
        customer: {
            name: string;
            email: string;
        };
    };
};

export default function CustomerAccountLayout({ children }: PropsWithChildren) {
    const { url, props } = usePage<AccountPageProps>();
    const customer = props.auth.customer;

    return (
        <main className="flex-1 bg-muted/30 px-4 py-8 sm:px-6 lg:px-8 dark:bg-background">
            <div className="mx-auto max-w-6xl">
                <header className="mb-8">
                    <Link
                        href="/"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Continue shopping
                    </Link>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                        My account
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Manage your personal details and shopping preferences.
                    </p>
                </header>

                <div className="grid gap-6 md:grid-cols-[230px_minmax(0,1fr)]">
                    <aside className="h-fit rounded-2xl border bg-card p-4 shadow-sm">
                        <div className="mb-4 border-b px-2 pb-4">
                            <p className="truncate font-medium">
                                {customer.name}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">
                                {customer.email}
                            </p>
                        </div>
                        <nav
                            aria-label="Account navigation"
                            className="space-y-1"
                        >
                            {navigation.map(({ label, href, icon: Icon }) => {
                                const active = url.split('?')[0] === href;

                                return (
                                    <Link
                                        key={label}
                                        href={href}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                            active
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                    >
                                        <Icon
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        {label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>

                    <section className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
                        {children}
                    </section>
                </div>
            </div>
        </main>
    );
}
