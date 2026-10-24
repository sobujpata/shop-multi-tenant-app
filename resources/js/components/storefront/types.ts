export type StorefrontImage = {
    id: number;
    path: string;
    is_primary?: boolean;
};

export type StorefrontProduct = {
    id: number;
    name: string;
    slug: string;
    description?: string;
    base_price: string | number;
    sale_price: string | number | null;
    current_price?: string | number;
    rating_avg: string | number;
    rating_count: number;
    sold_count?: string | number | null;
    created_at?: string | null;
    reviews_avg_rating?: string | number | null;
    reviews_count?: number;
    tenant?: { name: string; slug: string } | null;
    images: StorefrontImage[];
    brand?: { name: string; slug: string } | null;
    category?: { name: string; slug: string } | null;
    default_variant_id?: number | null;
    default_branch_id?: number | null;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    total: number;
};

let marketCurrency = 'BDT';

export function setMarketCurrency(currencyCode: string): void {
    marketCurrency = currencyCode;
}

export function imageUrl(path?: string | null): string | null {
    if (!path) return null;
    if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path;

    return `/storage/${path.replace(/^\/?storage\//, '')}`;
}

export function money(value: string | number | null | undefined): string {
    const symbols: Record<string, string> = {
        AED: 'د.إ ',
        BDT: '৳',
        EUR: '€',
        GBP: '£',
        INR: '₹',
        JPY: '¥',
        PKR: '₨',
        USD: '$',
    };
    const locale = marketCurrency === 'BDT' ? 'en-BD' : 'en-US';

    return `${symbols[marketCurrency] ?? `${marketCurrency} `}${Number(
        value ?? 0,
    ).toLocaleString(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: marketCurrency === 'JPY' ? 0 : 2,
    })}`;
}
