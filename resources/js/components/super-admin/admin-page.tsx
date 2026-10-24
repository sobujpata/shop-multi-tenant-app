import { Link } from '@inertiajs/react';
import type { PropsWithChildren, ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function AdminPage({
    title,
    description,
    action,
    children,
}: PropsWithChildren<{
    title: string;
    description: string;
    action?: ReactNode;
}>) {
    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {title}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

export function Panel({ children }: PropsWithChildren) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {children}
        </section>
    );
}

export function TextField({
    label,
    error,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
}) {
    return (
        <label className="block space-y-1.5 text-sm font-medium">
            {label}
            <input
                {...props}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
            />
            {error && (
                <span className="block text-xs text-red-600 dark:text-red-400">
                    {error}
                </span>
            )}
        </label>
    );
}

export function SelectField({
    label,
    error,
    children,
    ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    error?: string;
}) {
    return (
        <label className="block space-y-1.5 text-sm font-medium">
            {label}
            <select
                {...props}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
            >
                {children}
            </select>
            {error && (
                <span className="block text-xs text-red-600 dark:text-red-400">
                    {error}
                </span>
            )}
        </label>
    );
}

export function FormModal({
    open,
    onClose,
    title,
    fullScreen = false,
    children,
}: PropsWithChildren<{
    open: boolean;
    onClose: () => void;
    title: string;
    fullScreen?: boolean;
}>) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent
                className={cn(
                    fullScreen
                        ? 'inset-0 top-0 left-0 h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-none'
                        : 'max-h-[90vh] max-w-xl overflow-y-auto',
                )}
            >
                <DialogHeader
                    className={cn(
                        fullScreen &&
                            'border-b border-slate-200 px-5 py-4 pr-14 sm:px-8 dark:border-slate-800',
                    )}
                >
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}

export function Pagination({
    links,
}: {
    links: Array<{ url: string | null; label: string; active: boolean }>;
}) {
    return (
        <nav
            aria-label="Pagination"
            className="flex flex-wrap items-center justify-end gap-1 border-t border-slate-200 p-4 dark:border-slate-800"
        >
            {links.map((link, index) => {
                const label = link.label
                    .replace(/<[^>]*>/g, '')
                    .replace('&laquo;', '‹')
                    .replace('&raquo;', '›');
                if (!link.url) {
                    return (
                        <span
                            key={`${label}-${index}`}
                            aria-disabled="true"
                            className="rounded-md px-3 py-1.5 text-sm text-slate-400"
                        >
                            {label}
                        </span>
                    );
                }
                return (
                    <Link
                        key={`${label}-${index}`}
                        href={link.url}
                        className={`rounded-md px-3 py-1.5 text-sm ${
                            link.active
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-600 hover:bg-slate-100 aria-disabled:pointer-events-none aria-disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                        preserveScroll
                    >
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}

export function StatusBadge({ children }: PropsWithChildren) {
    const active = children === 'active' || children === 'paid';
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                active
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
        >
            {children}
        </span>
    );
}

export function SearchForm({
    value,
    onChange,
    placeholder = 'Search…',
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    return (
        <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="h-10 w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
        />
    );
}
