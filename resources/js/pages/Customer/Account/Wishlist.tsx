import { Head, Link, router } from '@inertiajs/react';
import { Heart, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ProductCard from '@/components/storefront/ProductCard';
import ProductGridSkeleton from '@/components/storefront/ProductGridSkeleton';
import type { StorefrontProduct } from '@/components/storefront/types';
import { toast } from 'sonner';

export default function CustomerWishlist({
    products,
}: {
    products: StorefrontProduct[];
}) {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const removeStartListener = router.on('start', () => setLoading(true));
        const removeFinishListener = router.on('finish', () =>
            setLoading(false),
        );

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    return (
        <>
            <Head title="My wishlist" />
            <div className="mb-8">
                <p className="text-sm font-medium text-primary">Your account</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    My wishlist
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Products you’ve saved for later.
                </p>
            </div>
            {loading ? (
                <ProductGridSkeleton count={6} />
            ) : products.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
                    {products.map((product, index) => (
                        <div key={product.id} className="relative">
                            <ProductCard product={product} index={index} />
                            <button
                                type="button"
                                aria-label={`Remove ${product.name} from wishlist`}
                                onClick={() =>
                                    router.post(
                                        '/customer/wishlist/toggle',
                                        { product_id: product.id },
                                        {
                                            onSuccess: () =>
                                                toast.success(
                                                    'Removed from your wishlist.',
                                                ),
                                            onError: () =>
                                                toast.error(
                                                    'Unable to update your wishlist.',
                                                ),
                                        },
                                    )
                                }
                                className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full border border-border bg-background/95 text-rose-600 shadow-card transition hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
                    <Heart className="mx-auto size-9 text-muted-foreground/50" />
                    <p className="mt-4 font-medium">Your wishlist is empty</p>
                    <Link
                        href="/shop"
                        className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
                    >
                        Discover products
                    </Link>
                </div>
            )}
        </>
    );
}
