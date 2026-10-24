import { Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    Facebook,
    Instagram,
    Linkedin,
    Music2,
    ShoppingBag,
    Twitter,
    Youtube,
} from 'lucide-react';

const socialIcons = {
    facebook: Facebook,
    instagram: Instagram,
    youtube: Youtube,
    x: Twitter,
    linkedin: Linkedin,
    tiktok: Music2,
} as const;

export default function Footer() {
    const defaultFooterContent = {
        description:
            'A little something for every part of life. Discover considered finds from independent stores near you.',
        explore_links: [
            { label: 'Shop all', url: '/shop' },
            { label: 'New arrivals', url: '/shop?sort=newest' },
            { label: 'My account', url: '/customer/account/profile' },
        ],
        about_heading: 'About',
        about_links: [
            { label: 'About us', url: '/about' },
            { label: 'Contact', url: '/contact' },
            { label: 'Frequently asked questions', url: '/faq' },
            { label: 'Terms of Use', url: '/terms-of-use' },
            { label: 'Privacy Policy', url: '/privacy-policy' },
            { label: 'Refund Policy', url: '/refund-policy' },
        ],
        cta_title: 'A better way to discover',
        cta_description:
            'Shop unique collections from neighborhood stores, all in one place.',
        cta_label: 'Find your next favorite',
        cta_url: '/shop',
        tagline: 'Thoughtfully selected, locally delivered.',
    };
    const { storefrontSettings } = usePage<{
        storefrontSettings?: {
            name: string;
            logo: string | null;
            footerContent?: typeof defaultFooterContent;
            socialLinks?: Array<{
                platform: keyof typeof socialIcons;
                url: string;
            }>;
        };
    }>().props;
    const marketName = storefrontSettings?.name ?? 'Marketplace';
    const socialLinks = storefrontSettings?.socialLinks ?? [];
    const footerContent =
        storefrontSettings?.footerContent ?? defaultFooterContent;

    const footerLink = ({ label, url }: { label: string; url: string }) =>
        url.startsWith('/') && !url.startsWith('//') ? (
            <Link
                href={url}
                className="transition-colors hover:text-white"
                key={`${label}-${url}`}
            >
                {label}
            </Link>
        ) : (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
                key={`${label}-${url}`}
            >
                {label}
            </a>
        );

    return (
        <footer className="relative isolate mt-20 overflow-hidden bg-[#17191f] text-white">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_35%,rgba(239,68,68,0.23),transparent_38%),radial-gradient(ellipse_at_10%_100%,rgba(59,130,246,0.13),transparent_38%),linear-gradient(135deg,#17191f,#252a34)]" />
            <div className="absolute -top-20 -right-20 -z-10 size-72 rounded-full border border-white/10 sm:size-96" />
            <div className="absolute right-10 -bottom-32 -z-10 size-72 rounded-full bg-red-500/10 blur-3xl" />
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-12 lg:px-8">
                <div className="max-w-sm">
                    <Link href="/" className="inline-flex items-center gap-2.5">
                        {storefrontSettings?.logo ? (
                            <img
                                src={storefrontSettings.logo}
                                alt=""
                                className="size-9 rounded-xl object-contain"
                            />
                        ) : (
                            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                                <ShoppingBag className="size-4" />
                            </span>
                        )}
                        <span className="font-semibold tracking-tight text-white">
                            {marketName}
                        </span>
                    </Link>
                    <p className="mt-4 text-sm leading-6 text-white/70">
                        {footerContent.description}
                    </p>
                    {socialLinks.length > 0 && (
                        <nav
                            aria-label="Marketplace social media"
                            className="mt-5 flex flex-wrap gap-2"
                        >
                            {socialLinks.map(({ platform, url }) => {
                                const Icon = socialIcons[platform];

                                return (
                                    <a
                                        key={platform}
                                        href={url}
                                        aria-label={`${platform} profile`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-grid size-9 place-items-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10 hover:text-white"
                                    >
                                        <Icon
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </a>
                                );
                            })}
                        </nav>
                    )}
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-white">
                        Explore
                    </h2>
                    <div className="mt-4 grid gap-3 text-sm text-white/70 [&_a]:transition-colors [&_a:hover]:text-white">
                        {footerContent.explore_links.map(footerLink)}
                    </div>
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-white">
                        {footerContent.about_heading}
                    </h2>
                    <div className="mt-4 grid gap-3 text-sm text-white/70 [&_a]:transition-colors [&_a:hover]:text-white">
                        {footerContent.about_links.map(footerLink)}
                    </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
                    <h2 className="font-semibold text-white">
                        {footerContent.cta_title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                        {footerContent.cta_description}
                    </p>
                    {footerContent.cta_url.startsWith('/') &&
                    !footerContent.cta_url.startsWith('//') ? (
                        <Link
                            href={footerContent.cta_url}
                            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-300 transition hover:text-red-200"
                        >
                            {footerContent.cta_label}
                            <ArrowUpRight className="size-4" />
                        </Link>
                    ) : (
                        <a
                            href={footerContent.cta_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-300 transition hover:text-red-200"
                        >
                            {footerContent.cta_label}
                            <ArrowUpRight className="size-4" />
                        </a>
                    )}
                </div>
            </div>
            <div className="border-t border-white/10">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <span>
                        © {new Date().getFullYear()} {marketName}. All rights
                        reserved.
                    </span>
                    <span>{footerContent.tagline}</span>
                </div>
            </div>
        </footer>
    );
}
