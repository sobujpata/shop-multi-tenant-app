import { Star } from 'lucide-react';

export default function RatingStars({
    rating,
    count,
    compact = false,
}: {
    rating: string | number | null | undefined;
    count?: number;
    compact?: boolean;
}) {
    const score = Math.min(5, Math.max(0, Number(rating ?? 0)));

    return (
        <span className="inline-flex items-center gap-1.5 text-sm">
            <span className="inline-flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: 5 }, (_, index) => (
                    <Star
                        key={index}
                        aria-hidden="true"
                        className={`size-3.5 ${index < Math.round(score) ? 'fill-current' : ''}`}
                    />
                ))}
            </span>
            <span className="font-medium text-foreground">
                {score.toFixed(1)}
            </span>
            {!compact && count !== undefined && (
                <span className="text-muted-foreground">({count})</span>
            )}
        </span>
    );
}
