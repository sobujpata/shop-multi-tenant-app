import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationLink } from './types';

export default function Pagination({
    links,
    align = 'center',
}: {
    links: PaginationLink[];
    align?: 'center' | 'end';
}) {
    if (links.length <= 3) return null;

    return (
        <nav
            aria-label="Pagination"
            className={`flex flex-wrap items-center gap-2 ${
                align === 'end' ? 'justify-end' : 'justify-center'
            }`}
        >
            {links.map((link, index) => {
                const first = index === 0;
                const last = index === links.length - 1;
                const label = link.label
                    .replace(/<[^>]*>/g, '')
                    .replace('&laquo;', '')
                    .replace('&raquo;', '');
                const content = first ? (
                    <ChevronLeft className="size-4" />
                ) : last ? (
                    <ChevronRight className="size-4" />
                ) : (
                    label
                );

                return link.url ? (
                    <Link
                        key={`${label}-${index}`}
                        href={link.url}
                        preserveScroll
                        aria-label={
                            first
                                ? 'Previous page'
                                : last
                                  ? 'Next page'
                                  : `Page ${label}`
                        }
                        aria-current={link.active ? 'page' : undefined}
                        className={`grid size-10 place-items-center rounded-full border text-sm transition ${
                            link.active
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card hover:border-primary/50 hover:bg-muted'
                        }`}
                    >
                        {content}
                    </Link>
                ) : (
                    <span
                        key={`${label}-${index}`}
                        aria-hidden="true"
                        className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground/50"
                    >
                        {content}
                    </span>
                );
            })}
        </nav>
    );
}
