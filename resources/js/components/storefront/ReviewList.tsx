import RatingStars from './RatingStars';
import Pagination from './Pagination';
import { imageUrl } from './types';
import type { Paginated } from './types';

type Review = {
    id: number;
    rating: number;
    comment: string | null;
    created_at: string;
    customer: { name: string };
    images: Array<{ id: number; path: string }>;
};

export default function ReviewList({
    reviews,
}: {
    reviews: Paginated<Review>;
}) {
    return (
        <section id="reviews" className="scroll-mt-28">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                        From our customers
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                        Reviews
                    </h2>
                </div>
                <span className="text-sm text-muted-foreground">
                    {reviews.total} verified{' '}
                    {reviews.total === 1 ? 'review' : 'reviews'}
                </span>
            </div>
            {reviews.data.length ? (
                <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card px-5">
                    {reviews.data.map((review) => (
                        <article key={review.id} className="py-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="font-medium">
                                        {review.customer.name}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {new Date(
                                            review.created_at,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                <RatingStars rating={review.rating} compact />
                            </div>
                            {review.comment && (
                                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                                    {review.comment}
                                </p>
                            )}
                            {review.images.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {review.images.map((image) => (
                                        <img
                                            key={image.id}
                                            src={
                                                imageUrl(image.path) ??
                                                undefined
                                            }
                                            alt="Customer review"
                                            className="size-20 rounded-lg object-cover"
                                        />
                                    ))}
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
                    <p className="font-medium">
                        Be the first to share your thoughts
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Customer reviews will appear here.
                    </p>
                </div>
            )}
            {reviews.last_page > 1 && (
                <div className="mt-6">
                    <Pagination links={reviews.links} />
                </div>
            )}
        </section>
    );
}
