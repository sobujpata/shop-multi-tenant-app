import { useMemo } from 'react';

export type ProductVariant = {
    id: number;
    sku: string;
    size: string | null;
    color: string | null;
    price: string | number | null;
};

const swatches: Record<string, string> = {
    black: '#171717',
    white: '#ffffff',
    red: '#dc2626',
    blue: '#2563eb',
    navy: '#1e3a8a',
    green: '#16a34a',
    yellow: '#eab308',
    pink: '#ec4899',
    purple: '#9333ea',
    orange: '#ea580c',
    brown: '#854d0e',
    gray: '#9ca3af',
    grey: '#9ca3af',
};

export default function VariantPicker({
    variants,
    selectedId,
    onSelect,
}: {
    variants: ProductVariant[];
    selectedId: number | null;
    onSelect: (variant: ProductVariant) => void;
}) {
    const selected =
        variants.find((variant) => variant.id === selectedId) ?? variants[0];
    const colors = useMemo(
        () =>
            [
                ...new Set(
                    variants.map((variant) => variant.color).filter(Boolean),
                ),
            ] as string[],
        [variants],
    );
    const sizes = useMemo(
        () =>
            [
                ...new Set(
                    variants.map((variant) => variant.size).filter(Boolean),
                ),
            ] as string[],
        [variants],
    );

    return (
        <div className="space-y-5">
            {colors.length > 0 && (
                <fieldset>
                    <legend className="mb-3 text-sm font-semibold">
                        Color{' '}
                        <span className="font-normal text-muted-foreground">
                            {selected?.color}
                        </span>
                    </legend>
                    <div className="flex flex-wrap gap-2.5">
                        {colors.map((color) => (
                            <button
                                key={color}
                                type="button"
                                title={color}
                                aria-label={`Select ${color} color`}
                                aria-pressed={selected?.color === color}
                                onClick={() => {
                                    const matching = variants.find(
                                        (variant) => variant.color === color,
                                    );
                                    if (matching) onSelect(matching);
                                }}
                                className={`grid size-9 place-items-center rounded-full border-2 transition ${
                                    selected?.color === color
                                        ? 'border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background'
                                        : 'border-border hover:border-foreground/50'
                                }`}
                            >
                                <span
                                    className="size-6 rounded-full border border-black/10 dark:border-white/10"
                                    style={{
                                        backgroundColor:
                                            swatches[color.toLowerCase()] ??
                                            color,
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </fieldset>
            )}
            {sizes.length > 0 && (
                <fieldset>
                    <legend className="mb-3 text-sm font-semibold">
                        Size{' '}
                        <span className="font-normal text-muted-foreground">
                            {selected?.size}
                        </span>
                    </legend>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => {
                            const active = selected?.size === size;
                            const availableVariant = variants.find(
                                (variant) =>
                                    variant.size === size &&
                                    (!selected?.color ||
                                        variant.color === selected.color),
                            );

                            return (
                                <button
                                    key={size}
                                    type="button"
                                    disabled={!availableVariant}
                                    aria-pressed={active}
                                    onClick={() =>
                                        availableVariant &&
                                        onSelect(availableVariant)
                                    }
                                    className={`min-w-12 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-30 ${
                                        active
                                            ? 'border-foreground bg-foreground text-background'
                                            : 'border-border hover:border-foreground'
                                    }`}
                                >
                                    {size}
                                </button>
                            );
                        })}
                    </div>
                </fieldset>
            )}
            {!variants.length && (
                <p className="text-sm text-muted-foreground">
                    No options are available for this product.
                </p>
            )}
        </div>
    );
}
