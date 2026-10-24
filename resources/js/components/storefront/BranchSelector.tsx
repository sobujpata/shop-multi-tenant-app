import { MapPin, PackageCheck } from 'lucide-react';
import type { ProductVariant } from './VariantPicker';

export type AvailableBranch = {
    id: number;
    name: string;
    city: string;
    address: string;
    stocks: Array<{
        id: number;
        quantity: number;
        variant: ProductVariant;
    }>;
};

export default function BranchSelector({
    branches,
    selectedVariant,
}: {
    branches: AvailableBranch[];
    selectedVariant: ProductVariant | null;
}) {
    const available = branches
        .map((branch) => ({
            ...branch,
            quantity:
                branch.stocks.find(
                    (stock) => stock.variant.id === selectedVariant?.id,
                )?.quantity ?? 0,
        }))
        .filter((branch) => branch.quantity > 0);

    return (
        <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <h2 className="font-semibold">Available near you</h2>
            </div>
            {available.length ? (
                <ul className="mt-4 divide-y divide-border">
                    {available.map((branch) => (
                        <li
                            key={branch.id}
                            className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                        >
                            <div>
                                <p className="text-sm font-medium">
                                    {branch.name}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {branch.city} · {branch.address}
                                </p>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                <PackageCheck className="size-3.5" />
                                {branch.quantity} in stock
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                    {selectedVariant
                        ? 'This option is currently out of stock at nearby stores.'
                        : 'Choose an option to check branch availability.'}
                </p>
            )}
        </section>
    );
}
