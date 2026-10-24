import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import PriceRangeSlider from './PriceRangeSlider';

export type ShopFilters = {
    category: string | null;
    brand: string[];
    gender: string | null;
    min_price: number | null;
    max_price: number | null;
    color: string[];
    size: string[];
    search: string;
    sort: string;
};

export type FilterOptions = {
    categories: Array<{ id: number; name: string; slug: string }>;
    brands: Array<{ id: number; name: string; slug: string }>;
    genders: Array<{ value: string; label: string }>;
    colors: string[];
    sizes: string[];
    price: { min: number; max: number };
};

type Props = {
    filters: ShopFilters;
    options: FilterOptions;
    onChange: <K extends keyof ShopFilters>(
        key: K,
        value: ShopFilters[K],
    ) => void;
    onClear: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function FilterContent({
    filters,
    options,
    onChange,
    onClear,
}: Omit<Props, 'open' | 'onOpenChange'>) {
    const [minimum, maximum] = [
        filters.min_price ?? options.price.min,
        filters.max_price ?? options.price.max,
    ];

    const checkList = (
        title: string,
        entries: Array<{ label: string; value: string }>,
        selected: string[],
        onSelect: (value: string[]) => void,
    ) => (
        <fieldset className="border-b border-border/70 py-5">
            <legend className="mb-3 text-sm font-semibold">{title}</legend>
            <div className="max-h-48 space-y-2.5 overflow-y-auto pr-1">
                {entries.map((entry) => (
                    <label
                        key={entry.value}
                        className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                        <input
                            type="checkbox"
                            checked={selected.includes(entry.value)}
                            onChange={(event) =>
                                onSelect(
                                    event.target.checked
                                        ? [...selected, entry.value]
                                        : selected.filter(
                                              (value) => value !== entry.value,
                                          ),
                                )
                            }
                            className="size-4 rounded border-border accent-primary"
                        />
                        <span>{entry.label}</span>
                    </label>
                ))}
            </div>
        </fieldset>
    );

    return (
        <div>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">
                        Refine your search
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Results update automatically
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClear}
                    className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                >
                    Clear
                </button>
            </div>
            <fieldset className="border-b border-border/70 py-5">
                <legend className="mb-3 text-sm font-semibold">Category</legend>
                <div className="space-y-2.5">
                    {options.categories.map((category) => (
                        <label
                            key={category.id}
                            className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <input
                                type="radio"
                                name="category-filter"
                                checked={filters.category === category.slug}
                                onChange={() =>
                                    onChange(
                                        'category',
                                        filters.category === category.slug
                                            ? null
                                            : category.slug,
                                    )
                                }
                                className="size-4 accent-primary"
                            />
                            {category.name}
                        </label>
                    ))}
                </div>
            </fieldset>
            <fieldset className="border-b border-border/70 py-5">
                <legend className="mb-4 text-sm font-semibold">
                    Price range
                </legend>
                <PriceRangeSlider
                    min={options.price.min}
                    max={options.price.max}
                    valueMin={Math.max(options.price.min, minimum)}
                    valueMax={Math.min(
                        Math.max(options.price.max, options.price.min + 1),
                        maximum,
                    )}
                    onChange={(minimumValue, maximumValue) => {
                        onChange('min_price', minimumValue);
                        onChange('max_price', maximumValue);
                    }}
                />
            </fieldset>
            {checkList(
                'Brand',
                options.brands.map((brand) => ({
                    label: brand.name,
                    value: brand.slug,
                })),
                filters.brand,
                (value) => onChange('brand', value),
            )}
            <fieldset className="border-b border-border/70 py-5">
                <legend className="mb-3 text-sm font-semibold">Gender</legend>
                <div className="space-y-2.5">
                    {options.genders.map((gender) => (
                        <label
                            key={gender.value}
                            className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <input
                                type="radio"
                                name="gender-filter"
                                checked={filters.gender === gender.value}
                                onChange={() =>
                                    onChange('gender', gender.value)
                                }
                                className="size-4 accent-primary"
                            />
                            {gender.label}
                        </label>
                    ))}
                </div>
            </fieldset>
            {checkList(
                'Color',
                options.colors.map((color) => ({ label: color, value: color })),
                filters.color,
                (value) => onChange('color', value),
            )}
            {checkList(
                'Size',
                options.sizes.map((size) => ({ label: size, value: size })),
                filters.size,
                (value) => onChange('size', value),
            )}
        </div>
    );
}

export default function FilterSidebar(props: Props) {
    const { open, onOpenChange, ...contentProps } = props;

    return (
        <>
            <aside className="sticky top-24 hidden self-start rounded-2xl border border-border bg-card p-5 shadow-sm lg:block">
                <FilterContent {...contentProps} />
            </aside>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="left" className="overflow-y-auto">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Filter products</SheetTitle>
                    </SheetHeader>
                    <div className="px-5 pb-8">
                        <FilterContent {...contentProps} />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
