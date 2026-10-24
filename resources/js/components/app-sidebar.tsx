import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Badge,
    Boxes,
    ClipboardList,
    CreditCard,
    MapPin,
    FileText,
    Info,
    LayoutGrid,
    KeyRound,
    Scale,
    Package,
    Phone,
    Settings2,
    Share2,
    Shield,
    ShoppingCart,
    Store,
    Tags,
    Users,
    Warehouse,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const dashboardNavItem: NavItem = {
    title: 'Dashboard',
    href: dashboard(),
    icon: LayoutGrid,
};

const superAdminNavItems: NavItem[] = [
    // {
    //     title: 'Overview',
    //     href: '/super-admin',
    //     icon: LayoutGrid,
    // },
    {
        title: 'Tenants',
        href: '/super-admin/tenants',
        icon: Store,
    },
    {
        title: 'Market settings',
        href: '/super-admin/market-settings',
        icon: Settings2,
    },
    {
        title: 'Social media',
        href: '/super-admin/social-media',
        icon: Share2,
    },
    {
        title: 'Footer content',
        href: '/super-admin/footer-content',
        icon: FileText,
    },
    {
        title: 'About page',
        href: '/super-admin/about',
        icon: Info,
    },
    {
        title: 'Contact information',
        href: '/super-admin/contact',
        icon: Phone,
    },
    {
        title: 'Legal pages',
        href: '/super-admin/legal-pages',
        icon: Scale,
    },
    {
        title: 'Plans',
        href: '/super-admin/plans',
        icon: CreditCard,
    },
    {
        title: 'Division to union',
        href: '/super-admin/divisiontounions',
        icon: MapPin,
    },
    {
        title: 'Subscriptions',
        href: '/super-admin/subscriptions',
        icon: CreditCard,
    },
    {
        title: 'Users',
        href: '/super-admin/users',
        icon: Users,
    },
    {
        title: 'Categories',
        href: '/super-admin/categories',
        icon: Tags,
    },
    {
        title: 'Brands',
        href: '/super-admin/brands',
        icon: Badge,
    },
    {
        title: 'Roles',
        href: '/super-admin/roles',
        icon: Shield,
    },
    {
        title: 'Permissions',
        href: '/super-admin/permissions',
        icon: KeyRound,
    },
    {
        title: 'Activity logs',
        href: '/super-admin/activity-logs',
        icon: Activity,
    },
];

const tenantNavItems: NavItem[] = [
    // {
    //     title: 'Overview',
    //     href: '/tenant',
    //     icon: LayoutGrid,
    // },
    {
        title: 'Branches',
        href: '/tenant/branches',
        icon: Warehouse,
    },
    {
        title: 'Products',
        href: '/tenant/products',
        icon: Package,
    },
    {
        title: 'Categories',
        href: '/tenant/categories',
        icon: Tags,
    },
    {
        title: 'Brands',
        href: '/tenant/brands',
        icon: Badge,
    },
    {
        title: 'Branch stock',
        href: '/tenant/stock',
        icon: Boxes,
    },
    {
        title: 'POS',
        href: '/tenant/pos',
        icon: ShoppingCart,
    },
    {
        title: 'POS invoices',
        href: '/tenant/pos/invoices',
        icon: FileText,
    },
    {
        title: 'Orders',
        href: '/tenant/orders',
        icon: ClipboardList,
    },
];

const tenantAdminUserNavItem: NavItem = {
    title: 'Users',
    href: '/tenant/users',
    icon: Users,
};

export function AppSidebar() {
    const { auth } = usePage().props;
    const mainNavItems = auth.roles.includes('super-admin')
        ? [dashboardNavItem, ...superAdminNavItems]
        : auth.roles.some((role) =>
                ['tenant-admin', 'branch-manager', 'sales-man'].includes(role),
            )
          ? [
                dashboardNavItem,
                ...tenantNavItems,
                ...(auth.roles.includes('tenant-admin')
                    ? [tenantAdminUserNavItem]
                    : []),
            ]
          : [dashboardNavItem];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
