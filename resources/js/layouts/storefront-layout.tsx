import { usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Footer from '@/components/storefront/Footer';
import Navbar from '@/components/storefront/Navbar';
import { setMarketCurrency } from '@/components/storefront/types';

export default function StorefrontLayout({ children }: PropsWithChildren) {
    const { storefrontSettings } = usePage<{
        storefrontSettings?: { currency?: string };
    }>().props;
    setMarketCurrency(storefrontSettings?.currency ?? 'BDT');

    return (
        <div className="flex min-h-svh flex-col bg-background pb-20 text-foreground lg:pb-0">
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
        </div>
    );
}
