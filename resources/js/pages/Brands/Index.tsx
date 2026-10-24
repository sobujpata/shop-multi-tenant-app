import { Head, router, useForm } from '@inertiajs/react';
import { Badge, ImagePlus, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    AdminPage,
    FormModal,
    Pagination,
    Panel,
    SearchForm,
    TextField,
} from '@/components/super-admin/admin-page';

type BrandRow = {
    id: number;
    name: string;
    slug: string;
    products_count?: number;
    logo_url: string | null;
};

type Paginated<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
};

const emptyBrand = {
    name: '',
    slug: '',
    logo: null as File | null,
};

export default function BrandsIndex({
    brands,
    filters,
    baseUrl,
    canCreateBrand,
    canEditBrand,
    canDeleteBrand,
    canViewBrandProducts,
}: {
    brands: Paginated<BrandRow>;
    filters: { search: string };
    baseUrl: string;
    canCreateBrand: boolean;
    canEditBrand: boolean;
    canDeleteBrand: boolean;
    canViewBrandProducts: boolean;
}) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<BrandRow | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const form = useForm(emptyBrand);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(
                baseUrl,
                { search },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [baseUrl, search]);

    const openModal = (brand?: BrandRow) => {
        setEditing(brand ?? null);
        form.clearErrors();
        form.setData(
            brand
                ? { name: brand.name, slug: brand.slug, logo: null }
                : emptyBrand,
        );
        setOpen(true);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const options = {
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        };

        if (editing) {
            form.put(`${baseUrl}/${editing.id}`, options);
        } else {
            form.post(baseUrl, options);
        }
    };

    const deleteBrand = (brand: BrandRow) => {
        if (
            window.confirm(
                `Delete "${brand.name}"? A brand with products cannot be deleted.`,
            )
        ) {
            setDeleteError(null);
            router.delete(`${baseUrl}/${brand.id}`, {
                preserveScroll: true,
                onError: (errors) =>
                    setDeleteError(Object.values(errors).join(' ')),
            });
        }
    };

    return (
        <>
            <Head title="Brands" />
            <AdminPage
                title="Brands"
                description="Manage the shared product brand catalog."
                action={
                    canCreateBrand ? (
                        <button
                            type="button"
                            onClick={() => openModal()}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                            <Plus className="size-4" /> New brand
                        </button>
                    ) : undefined
                }
            >
                <Panel>
                    {deleteError && (
                        <p
                            role="alert"
                            className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                        >
                            {deleteError}
                        </p>
                    )}
                    <div className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
                        <Search className="size-4 text-slate-400" />
                        <SearchForm
                            value={search}
                            onChange={setSearch}
                            placeholder="Search brands"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">Brand</th>
                                    <th className="px-5 py-3">Slug</th>
                                    {canViewBrandProducts && (
                                        <th className="px-5 py-3">Products</th>
                                    )}
                                    {canEditBrand || canDeleteBrand ? (
                                        <th className="px-5 py-3 text-right">
                                            Actions
                                        </th>
                                    ) : null}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {brands.data.map((brand) => (
                                    <tr key={brand.id}>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {brand.logo_url ? (
                                                    <img
                                                        src={brand.logo_url}
                                                        alt=""
                                                        className="size-10 rounded-lg object-contain"
                                                    />
                                                ) : (
                                                    <span className="grid size-10 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                                        <Badge className="size-4" />
                                                    </span>
                                                )}
                                                <span className="font-semibold">
                                                    {brand.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                                            {brand.slug}
                                        </td>
                                        {canViewBrandProducts && (
                                            <td className="px-5 py-4">
                                                {brand.products_count}
                                            </td>
                                        )}
                                        {canEditBrand || canDeleteBrand ? (
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {canEditBrand && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openModal(brand)
                                                            }
                                                            className="rounded-md px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    {canDeleteBrand && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteBrand(
                                                                    brand,
                                                                )
                                                            }
                                                            className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                                                            aria-label={`Delete ${brand.name}`}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        ) : null}
                                    </tr>
                                ))}
                                {brands.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={
                                                2 +
                                                Number(canViewBrandProducts) +
                                                Number(
                                                    canEditBrand ||
                                                        canDeleteBrand,
                                                )
                                            }
                                            className="px-5 py-10 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No brands found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={brands.links} />
                </Panel>
            </AdminPage>

            <FormModal
                open={open && (editing ? canEditBrand : canCreateBrand)}
                onClose={() => setOpen(false)}
                title={editing ? 'Edit brand' : 'Create brand'}
            >
                <form onSubmit={submit} className="space-y-4">
                    <TextField
                        label="Name"
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        error={form.errors.name}
                        required
                    />
                    <TextField
                        label="Slug"
                        value={form.data.slug}
                        onChange={(event) =>
                            form.setData('slug', event.target.value)
                        }
                        error={form.errors.slug}
                        required
                    />
                    <label className="block space-y-1.5 text-sm font-medium">
                        Brand logo
                        <span className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal dark:border-slate-700 dark:bg-slate-950">
                            <ImagePlus className="size-4 text-slate-500" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                    form.setData(
                                        'logo',
                                        event.currentTarget.files?.[0] ?? null,
                                    )
                                }
                                className="min-w-0 text-xs"
                            />
                        </span>
                        {form.errors.logo && (
                            <span className="block text-xs text-red-600 dark:text-red-400">
                                {form.errors.logo}
                            </span>
                        )}
                    </label>
                    {editing?.logo_url && !form.data.logo && (
                        <img
                            src={editing.logo_url}
                            alt={`${editing.name} logo`}
                            className="size-16 rounded-lg object-contain"
                        />
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium dark:border-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {form.processing
                                ? 'Saving…'
                                : editing
                                  ? 'Save changes'
                                  : 'Create brand'}
                        </button>
                    </div>
                </form>
            </FormModal>
        </>
    );
}
