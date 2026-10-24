import { Check, Circle } from 'lucide-react';

const steps = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

type Tracking = {
    id: number;
    status: string;
    note: string | null;
    created_at: string;
};

export default function OrderTimeline({
    status,
    trackings,
}: {
    status: string;
    trackings: Tracking[];
}) {
    const currentIndex = steps.indexOf(status);

    return (
        <div>
            {status === 'cancelled' ? (
                <p className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    This sub-order was cancelled.
                </p>
            ) : (
                <ol className="grid gap-3 sm:grid-cols-5">
                    {steps.map((step, index) => {
                        const complete = index <= currentIndex;

                        return (
                            <li
                                key={step}
                                className="flex items-center gap-2 sm:block"
                            >
                                <span
                                    className={`grid size-8 shrink-0 place-items-center rounded-full ${
                                        complete
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {index < currentIndex ? (
                                        <Check className="size-4" />
                                    ) : (
                                        <Circle className="size-3 fill-current" />
                                    )}
                                </span>
                                <span
                                    className={`text-sm capitalize sm:mt-2 sm:block ${
                                        complete
                                            ? 'font-medium'
                                            : 'text-muted-foreground'
                                    }`}
                                >
                                    {step}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            )}

            <ol className="mt-6 space-y-4 border-l border-border pl-4">
                {trackings.map((tracking) => (
                    <li key={tracking.id} className="relative">
                        <span className="absolute top-1 -left-[21px] size-2.5 rounded-full bg-primary ring-4 ring-card" />
                        <p className="text-sm font-medium capitalize">
                            {tracking.status}
                        </p>
                        {tracking.note && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {tracking.note}
                            </p>
                        )}
                        <time className="mt-1 block text-xs text-muted-foreground">
                            {new Date(tracking.created_at).toLocaleString()}
                        </time>
                    </li>
                ))}
            </ol>
        </div>
    );
}
