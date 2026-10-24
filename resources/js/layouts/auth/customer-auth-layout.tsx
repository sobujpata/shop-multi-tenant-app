import type { PropsWithChildren } from 'react';

export default function CustomerAuthLayout({ children }: PropsWithChildren) {
    return (
        <main className="relative flex min-h-[65vh] flex-1 items-center justify-center overflow-hidden bg-muted/40 px-4 py-12 sm:px-6 dark:bg-background">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
            <div className="relative w-full max-w-md">
                <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-xl shadow-black/5 sm:p-8 dark:shadow-black/20">
                    {children}
                </section>
            </div>
        </main>
    );
}
