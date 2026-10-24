import { Head, router, useForm } from '@inertiajs/react';
import { ImagePlus, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    AdminPage,
    FormModal,
    Pagination,
    Panel,
    SearchForm,
    SelectField,
    StatusBadge,
    TextField,
} from '@/components/super-admin/admin-page';

type VariantRow = {
    id: number;
    sku: string;
    size: string | null;
    color: string | null;
    price: string | null;
};
type AttributeValue = {
    id: number;
    attribute_id: number;
    value: string;
    attribute: { id: number; name: string };
};
type ProductRow = {
    id: number;
    name: string;
    slug: string;
    description: string;
    category_id: number;
    category: { name: string };
    brand_id: number | null;
    brand: { name: string } | null;
    gender: string | null;
    base_price: string;
    sale_price: string | null;
    is_active: boolean;
    variants: VariantRow[];
    images: Array<{ id: number; path: string; is_primary: boolean }>;
    attribute_values: AttributeValue[];
};
type Option = { id: number; name: string };
type Paginated<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    meta: { total: number };
};
type VariantForm = {
    id?: number;
    sku: string;
    size: string;
    color: string;
    price: string;
};
type AttributeForm = { attribute_id: string; value: string };

const emptyForm = {
    name: '',
    slug: '',
    description: '',
    category_id: '',
    brand_id: '',
    gender: '',
    base_price: '',
    sale_price: '',
    is_active: true,
    variants: [{ sku: '', size: '', color: '', price: '' }] as VariantForm[],
    attributes: [] as AttributeForm[],
    images: [] as File[],
};

export default function ProductsIndex({
    products,
    filters,
    categories,
    brands,
    attributes,
    canManage,
    productLimit,
    productCount,
}: {
    products: Paginated<ProductRow>;
    filters: { search: string };
    categories: Option[];
    brands: Option[];
    attributes: Option[];
    canManage: boolean;
    productLimit: number;
    productCount: number;
}) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ProductRow | null>(null);
    const form = useForm(emptyForm);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(
                '/tenant/products',
                { search },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [search]);

    const openModal = (product?: ProductRow) => {
        setEditing(product ?? null);
        form.clearErrors();
        if (!product) {
            form.setData(emptyForm);
        } else {
            form.setData({
                name: product.name,
                slug: product.slug,
                description: product.description,
                category_id: String(product.category_id),
                brand_id: product.brand_id ? String(product.brand_id) : '',
                gender: product.gender ?? '',
                base_price: product.base_price,
                sale_price: product.sale_price ?? '',
                is_active: product.is_active,
                variants: product.variants.map((variant) => ({
                    id: variant.id,
                    sku: variant.sku,
                    size: variant.size ?? '',
                    color: variant.color ?? '',
                    price: variant.price ?? '',
                })),
                attributes: product.attribute_values.map((value) => ({
                    attribute_id: String(value.attribute_id),
                    value: value.value,
                })),
                images: [],
            });
        }
        setOpen(true);
    };

    const setVariant = (
        index: number,
        key: keyof VariantForm,
        value: string,
    ) => {
        const variants = [...form.data.variants];
        variants[index] = { ...variants[index], [key]: value };
        form.setData('variants', variants);
    };

    const setAttribute = (
        index: number,
        key: keyof AttributeForm,
        value: string,
    ) => {
        const values = [...form.data.attributes];
        values[index] = { ...values[index], [key]: value };
        form.setData('attributes', values);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            category_id: Number(data.category_id),
            brand_id: data.brand_id ? Number(data.brand_id) : null,
            gender: data.gender || null,
            sale_price: data.sale_price || null,
            variants: data.variants.map((variant) => ({
                ...variant,
                price: variant.price || null,
            })),
            attributes: data.attributes
                .filter(
                    (value) => value.attribute_id !== '' && value.value !== '',
                )
                .map((value) => ({
                    attribute_id: Number(value.attribute_id),
                    value: value.value,
                })),
        }));
        const options = {
            forceFormData: true,
            onSuccess: () => setOpen(false),
        };
        if (editing) {
            form.put(`/tenant/products/${editing.id}`, options);
        } else {
            form.post('/tenant/products', options);
        }
    };

    return (
        <>
            <Head title="Products" />
            <AdminPage
                title="Products"
                description={`${productCount} of ${productLimit} products used on your plan.`}
                action={
                    canManage ? (
                        <button
                            type="button"
                            disabled={productCount >= productLimit}
                            title={
                                productCount >= productLimit
                                    ? 'Your current plan product limit has been reached.'
                                    : undefined
                            }
                            onClick={() => openModal()}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            <Plus className="size-4" /> Add product
                        </button>
                    ) : undefined
                }
            >
                <Panel>
                    <div className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
                        <Search className="size-4 text-slate-400" />
                        <SearchForm
                            value={search}
                            onChange={setSearch}
                            placeholder="Search products by name or slug"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">Product</th>
                                    <th className="px-5 py-3">
                                        Category / brand
                                    </th>
                                    <th className="px-5 py-3">Price</th>
                                    <th className="px-5 py-3">Variants</th>
                                    <th className="px-5 py-3">Status</th>
                                    {canManage && (
                                        <th className="px-5 py-3 text-right">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {products.data.map((product) => (
                                    <tr key={product.id}>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold">
                                                {product.name}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {product.slug}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p>{product.category.name}</p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {product.brand?.name ??
                                                    'No brand'}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            ৳
                                            {product.sale_price ??
                                                product.base_price}
                                        </td>
                                        <td className="px-5 py-4">
                                            {product.variants.length}
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge>
                                                {product.is_active
                                                    ? 'active'
                                                    : 'inactive'}
                                            </StatusBadge>
                                        </td>
                                        {canManage && (
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openModal(product)
                                                        }
                                                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label={`Delete ${product.name}`}
                                                        onClick={() => {
                                                            if (
                                                                window.confirm(
                                                                    `Delete ${product.name}?`,
                                                                )
                                                            )
                                                                router.delete(
                                                                    `/tenant/products/${product.id}`,
                                                                );
                                                        }}
                                                        className="rounded-md p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {products.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={canManage ? 6 : 5}
                                            className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No products found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={products.links} />
                </Panel>
            </AdminPage>
            <FormModal
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? 'Edit product' : 'Create product'}
                fullScreen
            >
                <form
                    onSubmit={submit}
                    className="flex min-h-0 flex-col overflow-hidden"
                >
                    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-8">
                        {Object.keys(form.errors).length > 0 && (
                            <div
                                role="alert"
                                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                            >
                                Please review the highlighted fields and correct
                                the form errors before saving.
                            </div>
                        )}
                        {categories.length === 0 && (
                            <div
                                role="status"
                                className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
                            >
                                Add a category before creating a product.
                            </div>
                        )}
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <TextField
                                label="Product name"
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
                                label="Category"
                                value={form.data.category_id}
                                onChange={(event) =>
                                    form.setData(
                                        'category_id',
                                        event.target.value,
                                    )
                                }
                                error={form.errors.category_id}
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </SelectField>
                            <SelectField
                                label="Brand"
                                value={form.data.brand_id}
                                onChange={(event) =>
                                    form.setData('brand_id', event.target.value)
                                }
                                error={form.errors.brand_id}
                            >
                                <option value="">No brand</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </SelectField>
                            <SelectField
                                label="Gender"
                                value={form.data.gender}
                                onChange={(event) =>
                                    form.setData('gender', event.target.value)
                                }
                                error={form.errors.gender}
                            >
                                <option value="">Not specified</option>
                                <option value="men">Men</option>
                                <option value="women">Women</option>
                                <option value="kids">Kids</option>
                                <option value="unisex">Unisex</option>
                            </SelectField>
                            <TextField
                                label="Base price (৳)"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.data.base_price}
                                onChange={(event) =>
                                    form.setData(
                                        'base_price',
                                        event.target.value,
                                    )
                                }
                                error={form.errors.base_price}
                                required
                            />
                            <TextField
                                label="Sale price (৳)"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.data.sale_price}
                                onChange={(event) =>
                                    form.setData(
                                        'sale_price',
                                        event.target.value,
                                    )
                                }
                                error={form.errors.sale_price}
                            />
                            <label className="flex items-center gap-2 self-end pb-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(event) =>
                                        form.setData(
                                            'is_active',
                                            event.target.checked,
                                        )
                                    }
                                />
                                Product is active
                            </label>
                        </div>
                        <label className="block max-w-10xl space-y-1.5 text-sm font-medium">
                            Description
                            <textarea
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                                className="min-h-32 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm font-normal transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
                                required
                            />
                            {form.errors.description && (
                                <span className="block text-xs text-red-600">
                                    {form.errors.description}
                                </span>
                            )}
                        </label>
                        <section className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold">
                                    Variants
                                </h3>
                                <button
                                    type="button"
                                    onClick={() =>
                                        form.setData('variants', [
                                            ...form.data.variants,
                                            {
                                                sku: '',
                                                size: '',
                                                color: '',
                                                price: '',
                                            },
                                        ])
                                    }
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                                >
                                    <Plus className="size-3" /> Add variant
                                </button>
                            </div>
                            {form.data.variants.map((variant, index) => (
                                <div
                                    key={variant.id ?? index}
                                    className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800"
                                >
                                    <TextField
                                        label="SKU"
                                        value={variant.sku}
                                        onChange={(event) =>
                                            setVariant(
                                                index,
                                                'sku',
                                                event.target.value,
                                            )
                                        }
                                        error={
                                            form.errors[`variants.${index}.sku`]
                                        }
                                        required
                                    />
                                    <TextField
                                        label="Size"
                                        value={variant.size}
                                        onChange={(event) =>
                                            setVariant(
                                                index,
                                                'size',
                                                event.target.value,
                                            )
                                        }
                                        error={
                                            form.errors[
                                                `variants.${index}.size`
                                            ]
                                        }
                                    />
                                    <TextField
                                        label="Color"
                                        value={variant.color}
                                        onChange={(event) =>
                                            setVariant(
                                                index,
                                                'color',
                                                event.target.value,
                                            )
                                        }
                                        error={
                                            form.errors[
                                                `variants.${index}.color`
                                            ]
                                        }
                                    />
                                    <TextField
                                        label="Variant price (optional)"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={variant.price}
                                        onChange={(event) =>
                                            setVariant(
                                                index,
                                                'price',
                                                event.target.value,
                                            )
                                        }
                                        error={
                                            form.errors[
                                                `variants.${index}.price`
                                            ]
                                        }
                                    />
                                    {form.data.variants.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                form.setData(
                                                    'variants',
                                                    form.data.variants.filter(
                                                        (_, itemIndex) =>
                                                            itemIndex !== index,
                                                    ),
                                                )
                                            }
                                            className="text-left text-xs text-red-600"
                                        >
                                            Remove this variant
                                        </button>
                                    )}
                                </div>
                            ))}
                        </section>
                        <section className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold">
                                    Extra attributes
                                </h3>
                                <button
                                    type="button"
                                    onClick={() =>
                                        form.setData('attributes', [
                                            ...form.data.attributes,
                                            { attribute_id: '', value: '' },
                                        ])
                                    }
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                                >
                                    <Plus className="size-3" /> Add attribute
                                </button>
                            </div>
                            {form.data.attributes.map((attribute, index) => (
                                <div
                                    key={index}
                                    className="grid gap-3 sm:grid-cols-2"
                                >
                                    <SelectField
                                        label="Attribute"
                                        value={attribute.attribute_id}
                                        onChange={(event) =>
                                            setAttribute(
                                                index,
                                                'attribute_id',
                                                event.target.value,
                                            )
                                        }
                                        error={
                                            form.errors[
                                                `attributes.${index}.attribute_id`
                                            ]
                                        }
                                    >
                                        <option value="">
                                            Choose attribute
                                        </option>
                                        {attributes.map((option) => (
                                            <option
                                                key={option.id}
                                                value={option.id}
                                            >
                                                {option.name}
                                            </option>
                                        ))}
                                    </SelectField>
                                    <TextField
                                        label="Value"
                                        value={attribute.value}
                                        onChange={(event) =>
                                            setAttribute(
                                                index,
                                                'value',
                                                event.target.value,
                                            )
                                        }
                                        error={
                                            form.errors[
                                                `attributes.${index}.value`
                                            ]
                                        }
                                    />
                                </div>
                            ))}
                        </section>
                        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm dark:border-slate-700">
                            <ImagePlus className="size-5 text-slate-500 dark:text-slate-400" />
                            <span className="font-medium">
                                Upload product images
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                JPG, PNG or WebP · up to 5 MB each
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="max-w-full text-xs"
                                onChange={(event) =>
                                    form.setData(
                                        'images',
                                        Array.from(event.target.files ?? []),
                                    )
                                }
                            />
                            {form.data.images.length > 0 && (
                                <span className="text-xs text-emerald-700">
                                    {form.data.images.length} image(s) selected
                                </span>
                            )}
                            {form.errors.images && (
                                <span className="text-xs text-red-600">
                                    {form.errors.images}
                                </span>
                            )}
                        </label>
                    </div>
                    <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:px-8 dark:border-slate-800 dark:bg-slate-900">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="h-10 rounded-lg border border-slate-300 px-4 text-sm dark:border-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                form.processing ||
                                (!editing && productCount >= productLimit) ||
                                categories.length === 0
                            }
                            className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {form.processing
                                ? 'Saving…'
                                : editing
                                  ? 'Save changes'
                                  : 'Create product'}
                        </button>
                    </div>
                </form>
            </FormModal>
        </>
    );
}
