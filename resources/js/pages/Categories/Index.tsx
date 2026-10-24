import { Head, router, useForm } from '@inertiajs/react';
import { ImagePlus, Plus, Search, Tags, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    AdminPage,
    FormModal,
    Pagination,
    Panel,
    SearchForm,
    SelectField,
    TextField,
} from '@/components/super-admin/admin-page';

type CategoryRow = {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
    parent: { id: number; name: string } | null;
    products_count?: number;
    image_url: string | null;
};

type CategoryOption = {
    id: number;
    name: string;
    parent_id: number | null;
};

type Paginated<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
};

const emptyCategory = {
    name: '',
    slug: '',
    parent_id: '',
    image: null as File | null,
};

function descendantsOf(
    categoryId: number,
    categories: CategoryOption[],
): Set<number> {
    const descendants = new Set([categoryId]);
    let changed = true;

    while (changed) {
        changed = false;
        for (const category of categories) {
            if (
                category.parent_id !== null &&
                descendants.has(category.parent_id) &&
                !descendants.has(category.id)
            ) {
                descendants.add(category.id);
                changed = true;
            }
        }
    }

    return descendants;
}

export default function CategoriesIndex({
    categories,
    categoryOptions,
    filters,
    baseUrl,
    canCreateCategory,
    canEditCategory,
    canDeleteCategory,
    canViewCategoryProducts,
}: {
    categories: Paginated<CategoryRow>;
    categoryOptions: CategoryOption[];
    filters: { search: string };
    baseUrl: string;
    canCreateCategory: boolean;
    canEditCategory: boolean;
    canDeleteCategory: boolean;
    canViewCategoryProducts: boolean;
}) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<CategoryRow | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const form = useForm(emptyCategory);

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

    const openModal = (category?: CategoryRow) => {
        setEditing(category ?? null);
        form.clearErrors();
        form.setData(
            category
                ? {
                      name: category.name,
                      slug: category.slug,
                      parent_id:
                          category.parent_id === null
                              ? ''
                              : String(category.parent_id),
                      image: null,
                  }
                : emptyCategory,
        );
        setOpen(true);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            parent_id: data.parent_id === '' ? null : Number(data.parent_id),
        }));

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

    const deleteCategory = (category: CategoryRow) => {
        if (
            window.confirm(
                `Delete "${category.name}"? Categories with products or child categories cannot be deleted.`,
            )
        ) {
            setDeleteError(null);
            router.delete(`${baseUrl}/${category.id}`, {
                preserveScroll: true,
                onError: (errors) =>
                    setDeleteError(Object.values(errors).join(' ')),
            });
        }
    };

    const editingDescendants = editing
        ? descendantsOf(editing.id, categoryOptions)
        : new Set<number>();
    const parentOptions = categoryOptions.filter(
        (category) => !editingDescendants.has(category.id),
    );

    return (
        <>
            <Head title="Categories" />
            <AdminPage
                title="Categories"
                description="Manage the shared product category catalog."
                action={
                    canCreateCategory ? (
                        <button
                            type="button"
                            onClick={() => openModal()}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                            <Plus className="size-4" /> New category
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
                            placeholder="Search categories"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">Category</th>
                                    <th className="px-5 py-3">Slug</th>
                                    <th className="px-5 py-3">Parent</th>
                                    {canViewCategoryProducts && (
                                        <th className="px-5 py-3">Products</th>
                                    )}
                                    {canEditCategory || canDeleteCategory ? (
                                        <th className="px-5 py-3 text-right">
                                            Actions
                                        </th>
                                    ) : null}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {categories.data.map((category) => (
                                    <tr key={category.id}>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {category.image_url ? (
                                                    <img
                                                        src={category.image_url}
                                                        alt=""
                                                        className="size-10 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <span className="grid size-10 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                                        <Tags className="size-4" />
                                                    </span>
                                                )}
                                                <span className="font-semibold">
                                                    {category.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                                            {category.slug}
                                        </td>
                                        <td className="px-5 py-4">
                                            {category.parent?.name ?? '—'}
                                        </td>
                                        {canViewCategoryProducts && (
                                            <td className="px-5 py-4">
                                                {category.products_count}
                                            </td>
                                        )}
                                        {canEditCategory ||
                                        canDeleteCategory ? (
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {canEditCategory && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openModal(
                                                                    category,
                                                                )
                                                            }
                                                            className="rounded-md px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    {canDeleteCategory && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteCategory(
                                                                    category,
                                                                )
                                                            }
                                                            className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                                                            aria-label={`Delete ${category.name}`}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        ) : null}
                                    </tr>
                                ))}
                                {categories.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={
                                                3 +
                                                Number(
                                                    canViewCategoryProducts,
                                                ) +
                                                Number(
                                                    canEditCategory ||
                                                        canDeleteCategory,
                                                )
                                            }
                                            className="px-5 py-10 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No categories found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={categories.links} />
                </Panel>
            </AdminPage>

            <FormModal
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? 'Edit category' : 'Create category'}
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
                    <SelectField
                        label="Parent category"
                        value={form.data.parent_id}
                        onChange={(event) =>
                            form.setData('parent_id', event.target.value)
                        }
                        error={form.errors.parent_id}
                    >
                        <option value="">No parent</option>
                        {parentOptions.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </SelectField>
                    <label className="block space-y-1.5 text-sm font-medium">
                        Category image
                        <span className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal dark:border-slate-700 dark:bg-slate-950">
                            <ImagePlus className="size-4 text-slate-500" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                    form.setData(
                                        'image',
                                        event.currentTarget.files?.[0] ?? null,
                                    )
                                }
                                className="min-w-0 text-xs"
                            />
                        </span>
                        {form.errors.image && (
                            <span className="block text-xs text-red-600 dark:text-red-400">
                                {form.errors.image}
                            </span>
                        )}
                    </label>
                    {editing?.image_url && !form.data.image && (
                        <img
                            src={editing.image_url}
                            alt={`${editing.name} category`}
                            className="size-16 rounded-lg object-cover"
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
                                  : 'Create category'}
                        </button>
                    </div>
                </form>
            </FormModal>
        </>
    );
}
