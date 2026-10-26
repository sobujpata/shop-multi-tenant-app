import { Head, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Footer from '@/components/storefront/Footer';
import Navbar from '@/components/storefront/Navbar';
import { setMarketCurrency } from '@/components/storefront/types';

type StorefrontSeoProps = {
    storefrontSettings?: { currency?: string; name?: string };
    product?: { name?: string };
    store?: { name?: string };
    legalPage?: { title?: string };
    name?: string;
};

const pageDescriptions: Record<string, string> = {
    Home: 'Discover clothing, electronics, beauty, and more from trusted stores in our online marketplace.',
    About: 'Learn about our marketplace and how we connect shoppers with trusted stores and products.',
    Contact:
        'Get in touch with our team for help with your shopping, orders, or marketplace questions.',
    Faq: 'Find answers to common questions about shopping, orders, payments, and deliveries.',
    'Categories/Browse':
        'Explore product categories and find clothing, electronics, beauty, and more.',
    'Brands/Browse':
        'Browse popular brands and discover products from stores across our marketplace.',
    'Shop/Index':
        'Browse and filter products from stores across our online marketplace.',
    'Stores/Index':
        'Explore stores in our marketplace and find products from trusted sellers.',
    'Cart/Index':
        'Review the products in your shopping cart before placing your order.',
    'Checkout/Index':
        'Complete your order securely and review your delivery details.',
    'Checkout/Success':
        'Your order has been placed. Review your order details and next steps.',
    'Seller/Onboarding':
        'Create your seller account and get started selling through our marketplace.',
    'Customer/Login':
        'Sign in to your shopper account to manage orders, addresses, and your wishlist.',
    'Customer/Register':
        'Create a shopper account to place orders and manage your marketplace purchases.',
    'Customer/ForgotPassword':
        'Request a password reset link for your shopper account.',
    'Customer/ResetPassword': 'Choose a new password for your shopper account.',
    'Customer/VerifyEmail':
        'Verify your email address to finish setting up your shopper account.',
    'Customer/Account/Addresses':
        'Manage the delivery addresses saved to your shopper account.',
    'Customer/Account/Profile': 'View and update your shopper account profile.',
    'Customer/Account/Orders/Index':
        'View your order history and check the status of recent purchases.',
    'Customer/Account/Orders/Show':
        'Review the items, payment, and delivery information for your order.',
    'Customer/Account/Orders/Tracking':
        'Check the delivery progress of your marketplace order.',
    'Customer/Account/Wishlist':
        'View the products you have saved to your shopper wishlist.',
};

export default function StorefrontLayout({ children }: PropsWithChildren) {
    const { component, props } = usePage<StorefrontSeoProps>();
    const { storefrontSettings } = props;
    setMarketCurrency(storefrontSettings?.currency ?? 'BDT');

    const marketName =
        storefrontSettings?.name ?? props.name ?? 'our marketplace';
    const description =
        component === 'Shop/Show' && props.product?.name
            ? `Shop ${props.product.name} online at ${marketName}. Explore product details and place your order today.`
            : component === 'Stores/Show' && props.store?.name
              ? `Explore products from ${props.store.name} on ${marketName}. Browse the store and find your next favorite item.`
              : component === 'Legal/Show' && props.legalPage?.title
                ? `Read ${props.legalPage.title} for ${marketName}, including important information about using our marketplace.`
                : (pageDescriptions[component] ??
                  `Explore products, stores, and brands at ${marketName}.`);

    return (
        <div className="flex min-h-svh flex-col bg-background pb-20 text-foreground lg:pb-0">
            <Head>
                <meta name="description" content={description} />
            </Head>
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
        </div>
    );
}
