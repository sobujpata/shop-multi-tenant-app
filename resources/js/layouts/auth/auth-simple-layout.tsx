import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const isFullBleed = !title && !description;

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-0 md:p-0">
            <div className={isFullBleed ? 'w-full' : 'w-full max-w-sm'}>
                <div className={isFullBleed ? 'flex flex-col' : 'flex flex-col gap-8'}>
                    {!isFullBleed && (
                        <div className="flex flex-col items-center gap-4">
                            <Link
                                href={home()}
                                className="flex flex-col items-center gap-2 font-medium"
                            >
                                <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
                                    <AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" />
                                </div>
                                <span className="sr-only">{title}</span>
                            </Link>

                            {(title || description) && (
                                <div className="space-y-2 text-center">
                                    {title && (
                                        <h1 className="text-xl font-medium">
                                            {title}
                                        </h1>
                                    )}
                                    {description && (
                                        <p className="text-center text-sm text-muted-foreground">
                                            {description}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
}
