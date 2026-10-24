import { Head, useForm } from '@inertiajs/react';
import { Boxes, Printer, Search, Sliders } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    AdminPage,
    Pagination,
    Panel,
} from '@/components/super-admin/admin-page';

type Branch = { id: number; name: string };
type Stock = {
    id: number;
    branch_id: number;
    variant_id: number;
    quantity: number;
};
type Variant = {
    id: number;
    sku: string;
    size: string | null;
    color: string | null;
    barcode_code?: string;
    product: { name: string };
    stocks: Stock[];
};
type StockInput = { branch_id: number; variant_id: number; quantity: number };
type PageData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

const LABEL_PAPERS: Array<{ value: string; label: string }> = [
    { value: 'a4', label: 'A4' },
    { value: 'a5', label: 'A5' },
    { value: 'letter', label: 'Letter' },
    { value: 'thermal', label: 'Thermal (label = page)' },
];

const LABEL_SIZES: Array<{ value: string; label: string }> = [
    { value: '50x25', label: '50 × 25 mm' },
    { value: '40x30', label: '40 × 30 mm' },
    { value: '38x21', label: '38 × 21 mm' },
    { value: '38x19', label: '38 × 19 mm' },
    { value: '57x50', label: '57 × 50 mm' },
    { value: '57x40', label: '57 × 40 mm' },
    { value: '56x38', label: '56 × 38 mm' },
    { value: '56x30', label: '56 × 30 mm' },
    { value: 'custom', label: 'Custom size' },
];

const LABEL_CONTENTS: Array<{ key: string; label: string }> = [
    { key: 'branch', label: 'Branch name (top center)' },
    { key: 'name', label: 'Product name with size' },
    { key: 'barcode', label: 'Barcode' },
    { key: 'serial', label: 'Serial number SL-01 (right)' },
    { key: 'price', label: 'Price with discount price' },
];

const LABEL_RIGHT_SLOTS: Array<{ value: 'serial' | 'sku'; label: string }> = [
    { value: 'serial', label: 'Serial number SL-01' },
    { value: 'sku', label: 'SKU' },
];

type LabelSettings = {
    paper: string;
    size: string;
    width: number;
    height: number;
    rightSlot: 'serial' | 'sku';
    show: Record<string, boolean>;
};

const DEFAULT_LABEL_SETTINGS: LabelSettings = {
    paper: 'a4',
    size: '50x25',
    width: 56,
    height: 30,
    rightSlot: 'serial',
    show: Object.fromEntries(LABEL_CONTENTS.map((entry) => [entry.key, true])),
};

const LABEL_SETTINGS_KEY = 'tenant-stock-label-settings';

function boundedNumber(
    value: unknown,
    min: number,
    max: number,
    fallback: number,
): number {
    const parsed = typeof value === 'number' ? value : Number(value);

    return Number.isFinite(parsed)
        ? Math.min(max, Math.max(min, parsed))
        : fallback;
}

function loadSettingsByBranch(): Record<string, LabelSettings> {
    try {
        const raw = localStorage.getItem(LABEL_SETTINGS_KEY);

        if (raw === null) {
            return {};
        }

        const stored = JSON.parse(raw) as Record<
            string,
            Partial<LabelSettings> & { leftSlot?: string; rightSlot?: string }
        > | null;

        if (stored === null || typeof stored !== 'object') {
            return {};
        }

        const normalized: Record<string, LabelSettings> = {};

        for (const [key, value] of Object.entries(stored)) {
            if (value === null || typeof value !== 'object') {
                continue;
            }

            const {
                leftSlot,
                rightSlot,
                paper,
                size,
                show,
                width,
                height,
                ...rest
            } = value;

            normalized[key] = {
                ...DEFAULT_LABEL_SETTINGS,
                ...rest,
                paper: LABEL_PAPERS.some((entry) => entry.value === paper)
                    ? (paper as string)
                    : DEFAULT_LABEL_SETTINGS.paper,
                size:
                    size !== undefined &&
                    LABEL_SIZES.some((entry) => entry.value === size)
                        ? size
                        : DEFAULT_LABEL_SETTINGS.size,
                width: boundedNumber(
                    width,
                    10,
                    250,
                    DEFAULT_LABEL_SETTINGS.width,
                ),
                height: boundedNumber(
                    height,
                    10,
                    180,
                    DEFAULT_LABEL_SETTINGS.height,
                ),
                rightSlot:
                    rightSlot === 'sku'
                        ? 'sku'
                        : leftSlot === 'sku'
                          ? 'sku'
                          : 'serial',
                show: show ?? DEFAULT_LABEL_SETTINGS.show,
            };
        }

        return normalized;
    } catch {
        return {};
    }
}

export default function StockIndex({
    branches,
    variants,
    canManage,
}: {
    branches: Branch[];
    variants: PageData<Variant>;
    canManage: boolean;
}) {
    const form = useForm<{ stocks: StockInput[] }>({ stocks: [] });
    const [settingsByBranch, setSettingsByBranch] =
        useState(loadSettingsByBranch);
    const [setupBranchId, setSetupBranchId] = useState<number | null>(
        branches[0]?.id ?? null,
    );
    const [setupOpen, setSetupOpen] = useState(false);
    const [search, setSearch] = useState('');

    const settingsFor = (branchId: number): LabelSettings =>
        settingsByBranch[String(branchId)] ?? DEFAULT_LABEL_SETTINGS;

    const patchLabelSettings = (patch: Partial<LabelSettings>): void => {
        if (setupBranchId === null) {
            return;
        }

        setSettingsByBranch((previous) => {
            const key = String(setupBranchId);
            const next = {
                ...(previous[key] ?? DEFAULT_LABEL_SETTINGS),
                ...patch,
            };

            try {
                localStorage.setItem(
                    LABEL_SETTINGS_KEY,
                    JSON.stringify({ ...previous, [key]: next }),
                );
            } catch {
                // Storage unavailable; settings apply for this view only.
            }

            return { ...previous, [key]: next };
        });
    };

    const labelHref = (branchId: number, variantId?: number): string => {
        const settings = settingsFor(branchId);
        const params = new URLSearchParams();
        params.set('branch_id', String(branchId));
        params.set('paper', settings.paper);
        params.set('size', settings.size);

        if (settings.size === 'custom') {
            params.set(
                'width',
                String(boundedNumber(settings.width, 10, 250, 56)),
            );
            params.set(
                'height',
                String(boundedNumber(settings.height, 10, 180, 30)),
            );
        }

        for (const entry of LABEL_CONTENTS) {
            if (settings.show[entry.key] !== false) {
                params.append('show[]', entry.key);
            }
        }

        params.append('show[]', 'code');
        params.append('show[]', settings.rightSlot);

        if (variantId !== undefined) {
            params.append('variant_ids[]', String(variantId));
        }

        return `/tenant/stock/labels?${params.toString()}`;
    };

    const setupBranch =
        branches.find((branch) => branch.id === setupBranchId) ??
        branches[0] ??
        null;
    const setupSettings =
        setupBranch !== null
            ? settingsFor(setupBranch.id)
            : DEFAULT_LABEL_SETTINGS;

    const searchNeedle = search.trim().toLowerCase();
    const visibleVariants = searchNeedle
        ? variants.data.filter(
              (variant) =>
                  variant.product.name.toLowerCase().includes(searchNeedle) ||
                  variant.sku.toLowerCase().includes(searchNeedle) ||
                  (variant.barcode_code ?? '')
                      .toLowerCase()
                      .includes(searchNeedle) ||
                  (variant.color ?? '').toLowerCase().includes(searchNeedle) ||
                  (variant.size ?? '').toLowerCase().includes(searchNeedle),
          )
        : variants.data;

    useEffect(() => {
        form.setData(
            'stocks',
            variants.data.flatMap((variant) =>
                branches.map((branch) => ({
                    branch_id: branch.id,
                    variant_id: variant.id,
                    quantity:
                        variant.stocks.find(
                            (stock) => stock.branch_id === branch.id,
                        )?.quantity ?? 0,
                })),
            ),
        );
    }, [branches, variants.data]);

    const updateQuantity = (
        variantId: number,
        branchId: number,
        quantity: number,
    ) => {
        form.setData(
            'stocks',
            form.data.stocks.map((stock) =>
                stock.variant_id === variantId && stock.branch_id === branchId
                    ? { ...stock, quantity }
                    : stock,
            ),
        );
    };

    const save = (event: React.FormEvent) => {
        event.preventDefault();
        form.put('/tenant/stock', { preserveScroll: true });
    };

    return (
        <>
            <Head title="Branch stock" />
            <AdminPage
                title="Branch stock"
                description="Review inventory by product variant and branch."
                action={
                    canManage ? (
                        <button
                            type="submit"
                            form="tenant-stock-form"
                            disabled={form.processing}
                            className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {form.processing ? 'Saving…' : 'Save quantities'}
                        </button>
                    ) : undefined
                }
            >
                <Panel>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3 dark:border-slate-800">
                        <div className="relative w-full max-w-xs sm:w-auto sm:max-w-sm">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search product, SKU, size, color, or code"
                                aria-label="Search product variants"
                                className="h-9 w-full rounded-lg border border-slate-300 bg-white pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-950"
                            />
                        </div>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setSetupOpen((open) => !open)}
                                className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                            >
                                <Sliders className="size-3.5" />
                                Label setup
                            </button>
                            {setupOpen && (
                                <>
                                    <button
                                        type="button"
                                        aria-label="Close label setup"
                                        onClick={() => setSetupOpen(false)}
                                        className="fixed inset-0 z-10 cursor-default"
                                    />
                                    <div className="absolute top-11 right-0 z-20 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-950">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase dark:text-slate-400">
                                            Per-branch settings
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {branches.map((branch) => (
                                                <button
                                                    key={branch.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setSetupBranchId(
                                                            branch.id,
                                                        )
                                                    }
                                                    className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                                                        setupBranchId ===
                                                        branch.id
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                                >
                                                    {branch.name}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                                            Editing:{' '}
                                            <strong className="text-slate-600 dark:text-slate-300">
                                                {setupBranch?.name ?? ''}
                                            </strong>
                                        </p>
                                        <label className="mt-2 block space-y-1 text-sm">
                                            <span className="text-xs font-medium text-slate-600">
                                                Paper size
                                            </span>
                                            <select
                                                value={setupSettings.paper}
                                                onChange={(event) =>
                                                    patchLabelSettings({
                                                        paper: event.target
                                                            .value,
                                                    })
                                                }
                                                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                                            >
                                                {LABEL_PAPERS.map((paper) => (
                                                    <option
                                                        key={paper.value}
                                                        value={paper.value}
                                                    >
                                                        {paper.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <span className="block text-[10px] font-normal text-slate-400 dark:text-slate-500">
                                                Individual print loops to fill
                                                the page for the selected label
                                                size; thermal prints one sticker
                                                per page.
                                            </span>
                                        </label>
                                        <label className="mt-2 block space-y-1 text-sm">
                                            <span className="text-xs font-medium text-slate-600">
                                                Label size
                                            </span>
                                            <select
                                                value={setupSettings.size}
                                                onChange={(event) =>
                                                    patchLabelSettings({
                                                        size: event.target
                                                            .value,
                                                    })
                                                }
                                                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                                            >
                                                {LABEL_SIZES.map((size) => (
                                                    <option
                                                        key={size.value}
                                                        value={size.value}
                                                    >
                                                        {size.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        {setupSettings.size === 'custom' && (
                                            <span className="mt-2 flex items-center gap-2 text-sm">
                                                <label className="flex-1 space-y-1">
                                                    <span className="text-xs font-medium text-slate-600">
                                                        Width (mm)
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min="10"
                                                        max="250"
                                                        value={
                                                            setupSettings.width
                                                        }
                                                        onChange={(event) =>
                                                            patchLabelSettings({
                                                                width:
                                                                    Number(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    ) || 0,
                                                            })
                                                        }
                                                        className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                                                    />
                                                </label>
                                                <span className="pt-4 text-xs text-slate-400">
                                                    ×
                                                </span>
                                                <label className="flex-1 space-y-1">
                                                    <span className="text-xs font-medium text-slate-600">
                                                        Height (mm)
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min="10"
                                                        max="180"
                                                        value={
                                                            setupSettings.height
                                                        }
                                                        onChange={(event) =>
                                                            patchLabelSettings({
                                                                height:
                                                                    Number(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    ) || 0,
                                                            })
                                                        }
                                                        className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                                                    />
                                                </label>
                                            </span>
                                        )}
                                        <label className="mt-2 block space-y-1 text-sm">
                                            <span className="text-xs font-medium text-slate-600">
                                                Right slot (SL spot)
                                            </span>
                                            <select
                                                value={setupSettings.rightSlot}
                                                onChange={(event) =>
                                                    patchLabelSettings({
                                                        rightSlot:
                                                            event.target
                                                                .value === 'sku'
                                                                ? 'sku'
                                                                : 'serial',
                                                    })
                                                }
                                                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                                            >
                                                {LABEL_RIGHT_SLOTS.map(
                                                    (slot) => (
                                                        <option
                                                            key={slot.value}
                                                            value={slot.value}
                                                        >
                                                            {slot.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </label>
                                        <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                                            Label content
                                        </p>
                                        <div className="mt-1 space-y-1">
                                            {LABEL_CONTENTS.map((entry) => (
                                                <label
                                                    key={entry.key}
                                                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            setupSettings.show[
                                                                entry.key
                                                            ] !== false
                                                        }
                                                        onChange={(event) =>
                                                            patchLabelSettings({
                                                                show: {
                                                                    ...setupSettings.show,
                                                                    [entry.key]:
                                                                        event
                                                                            .target
                                                                            .checked,
                                                                },
                                                            })
                                                        }
                                                        className="size-4 rounded border-slate-300"
                                                    />
                                                    {entry.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <form id="tenant-stock-form" onSubmit={save}>
                        {form.errors.stocks && (
                            <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                                {form.errors.stocks}
                            </p>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[650px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                                    <tr>
                                        <th className="sticky left-0 min-w-64 bg-slate-50 px-5 py-3 dark:bg-slate-950">
                                            Variant
                                        </th>
                                        {branches.map((branch) => (
                                            <th
                                                key={branch.id}
                                                className="min-w-36 px-5 py-3"
                                            >
                                                {branch.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {visibleVariants.map((variant) => (
                                        <tr key={variant.id}>
                                            <td className="sticky left-0 bg-white px-5 py-4 dark:bg-slate-900">
                                                <div className="flex items-center gap-3">
                                                    <span className="grid size-9 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                                        <Boxes className="size-4" />
                                                    </span>
                                                    <div>
                                                        <p className="font-medium">
                                                            {
                                                                variant.product
                                                                    .name
                                                            }
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            {variant.sku} ·{' '}
                                                            {variant.color ??
                                                                '—'}{' '}
                                                            ·{' '}
                                                            {variant.size ??
                                                                '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            {branches.map((branch) => {
                                                const value =
                                                    form.data.stocks.find(
                                                        (stock) =>
                                                            stock.variant_id ===
                                                                variant.id &&
                                                            stock.branch_id ===
                                                                branch.id,
                                                    )?.quantity ?? 0;
                                                return (
                                                    <td
                                                        key={branch.id}
                                                        className="px-5 py-4"
                                                    >
                                                        <span className="flex items-center gap-1.5">
                                                            {canManage ? (
                                                                <input
                                                                    aria-label={`${variant.sku} quantity at ${branch.name}`}
                                                                    type="number"
                                                                    min="0"
                                                                    value={
                                                                        value
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateQuantity(
                                                                            variant.id,
                                                                            branch.id,
                                                                            Number(
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        )
                                                                    }
                                                                    className="h-9 w-24 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                                                                />
                                                            ) : (
                                                                <span
                                                                    className={
                                                                        value <=
                                                                        5
                                                                            ? 'font-semibold text-amber-700 dark:text-amber-300'
                                                                            : ''
                                                                    }
                                                                >
                                                                    {value}
                                                                </span>
                                                            )}
                                                            <a
                                                                href={labelHref(
                                                                    branch.id,
                                                                    variant.id,
                                                                )}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title={`Print label for ${variant.sku} at ${branch.name}`}
                                                                aria-label={`Print barcode label for ${variant.sku} at ${branch.name}`}
                                                                className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-indigo-400"
                                                            >
                                                                <Printer className="size-3.5" />
                                                            </a>
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                    {visibleVariants.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={branches.length + 1}
                                                className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                                            >
                                                {searchNeedle
                                                    ? 'No product variants match your search.'
                                                    : 'No product variants are available.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </form>
                    <Pagination links={variants.links} />
                </Panel>
            </AdminPage>
        </>
    );
}
