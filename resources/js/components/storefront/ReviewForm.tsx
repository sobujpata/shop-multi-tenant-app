import { useForm } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';

type Props = {
    productId: number;
    orderItemId: number;
    orderLabel?: string;
};

export default function ReviewForm({
    productId,
    orderItemId,
    orderLabel,
}: Props) {
    const [rating, setRating] = useState(5);
    const form = useForm({
        order_item_id: orderItemId,
        rating,
        comment: '',
        images: [] as File[],
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post(`/customer/products/${productId}/reviews`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset('comment', 'images'),
        });
    }

    return (
        <form
            onSubmit={submit}
            className="rounded-2xl border border-border bg-card p-5"
        >
            <h3 className="font-semibold">Share your review</h3>
            {orderLabel && (
                <p className="mt-1 text-xs text-muted-foreground">
                    Verified purchase · Order {orderLabel}
                </p>
            )}
            <fieldset className="mt-4">
                <legend className="text-sm font-medium">Your rating</legend>
                <div
                    className="mt-2 flex gap-1"
                    role="group"
                    aria-label="Rating"
                >
                    {Array.from({ length: 5 }, (_, index) => {
                        const value = index + 1;
                        const selected = value <= rating;

                        return (
                            <button
                                key={value}
                                type="button"
                                aria-label={`${value} star${value === 1 ? '' : 's'}`}
                                aria-pressed={rating === value}
                                onClick={() => {
                                    setRating(value);
                                    form.setData('rating', value);
                                }}
                                className="rounded p-1 focus-visible:outline-2 focus-visible:outline-primary"
                            >
                                <Star
                                    className={`size-5 ${selected ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground'}`}
                                />
                            </button>
                        );
                    })}
                </div>
            </fieldset>
            <InputError message={form.errors.rating} />
            <label
                className="mt-4 block text-sm font-medium"
                htmlFor={`review-comment-${productId}-${orderItemId}`}
            >
                Comment
            </label>
            <textarea
                id={`review-comment-${productId}-${orderItemId}`}
                value={form.data.comment}
                onChange={(event) =>
                    form.setData('comment', event.target.value)
                }
                rows={4}
                maxLength={3000}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                placeholder="What did you think of this product?"
            />
            <InputError message={form.errors.comment} />
            <label
                className="mt-4 block text-sm font-medium"
                htmlFor={`review-images-${productId}-${orderItemId}`}
            >
                Photos (optional, up to 5)
            </label>
            <input
                id={`review-images-${productId}-${orderItemId}`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) =>
                    form.setData('images', Array.from(event.target.files ?? []))
                }
                className="mt-2 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-foreground"
            />
            <InputError
                message={
                    form.errors.images ??
                    form.errors['images.0'] ??
                    form.errors['images.1'] ??
                    form.errors['images.2'] ??
                    form.errors['images.3'] ??
                    form.errors['images.4']
                }
            />
            <button
                type="submit"
                disabled={form.processing}
                className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
                {form.processing ? 'Submitting…' : 'Submit review'}
            </button>
        </form>
    );
}
