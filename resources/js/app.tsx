import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import CustomerAuthLayout from '@/layouts/auth/customer-auth-layout';
import CustomerAccountLayout from '@/layouts/customer-account-layout';
import SettingsLayout from '@/layouts/settings/layout';
import StorefrontLayout from '@/layouts/storefront-layout';

const appName = import.meta.env.VITE_APP_NAME || 'sheradam.shop | Best Price in Bangladesh - Online Shopping in Bangladesh';

void createInertiaApp({
    title: (title) => title || appName,
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name === 'Home':
            case name === 'Seller/Onboarding':
            case name === 'Faq':
            case name === 'About':
            case name === 'Contact':
            case name === 'Categories/Browse':
            case name === 'Brands/Browse':
            case name === 'Legal/Show':
            case name.startsWith('Shop/'):
            case name.startsWith('Stores/'):
            case name.startsWith('Cart/'):
            case name.startsWith('Checkout/'):
                return StorefrontLayout;
            case name.startsWith('Customer/Account/'):
                return [StorefrontLayout, CustomerAccountLayout];
            case name.startsWith('Customer/'):
                return [StorefrontLayout, CustomerAuthLayout];
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            case name.startsWith('SuperAdmin/'):
                return AppLayout;
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
