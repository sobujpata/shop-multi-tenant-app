import { Skeleton } from '@/components/ui/skeleton';

export default function ProductGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div
            role="status"
            aria-label="Loading products"
            aria-live="polite"
            className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3"
        >
            {Array.from({ length: count }, (_, index) => (
                <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-border bg-card p-2.5 shadow-card sm:p-3"
                >
                    <Skeleton className="aspect-[4/5] w-full rounded-xl" />
                    <div className="space-y-2 p-2 pt-4">
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-4 w-4/5" />
                        <div className="flex justify-between pt-1">
                            <Skeleton className="h-3 w-1/4" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    </div>
                </div>
            ))}
            <span className="sr-only">Loading product results</span>
        </div>
    );
}
