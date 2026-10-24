import { Head, router, useForm } from '@inertiajs/react';
import {
    Building2,
    Hash,
    Mail,
    Map,
    MapPin,
    Plus,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    AdminPage,
    FormModal,
    Pagination,
    Panel,
    SearchForm,
    TextField,
} from '@/components/super-admin/admin-page';

type DivisionToUnionRow = {
    id: number;
    divisions: string;
    districts: string;
    upazilas: string;
    unions: string;
    postoffices: string;
    postcodes: string;
};

type ColumnFilters = Pick<
    DivisionToUnionRow,
    | 'divisions'
    | 'districts'
    | 'upazilas'
    | 'unions'
    | 'postoffices'
    | 'postcodes'
>;

type PageData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

const filterColumns: Array<{ key: keyof ColumnFilters; label: string }> = [
    { key: 'divisions', label: 'Division' },
    { key: 'districts', label: 'District' },
    { key: 'upazilas', label: 'Upazila' },
    { key: 'unions', label: 'Union' },
    { key: 'postoffices', label: 'Post office' },
    { key: 'postcodes', label: 'Postcode' },
];

const summaryColumns: Array<{
    key: keyof ColumnFilters;
    label: string;
    icon: typeof MapPin;
}> = [
    { key: 'divisions', label: 'Divisions', icon: Map },
    { key: 'districts', label: 'Districts', icon: MapPin },
    { key: 'upazilas', label: 'Upazilas', icon: Building2 },
    { key: 'unions', label: 'Unions', icon: Map },
    { key: 'postoffices', label: 'Post offices', icon: Mail },
    { key: 'postcodes', label: 'Post codes', icon: Hash },
];

const emptyRecord = {
    divisions: '',
    districts: '',
    upazilas: '',
    unions: '',
    postoffices: '',
    postcodes: '',
};

export default function DivisionToUnionIndex({
    records,
    filters,
    filterOptions,
    summary,
}: {
    records: PageData<DivisionToUnionRow>;
    filters: { search: string } & ColumnFilters;
    filterOptions: ColumnFilters;
    summary: Record<keyof ColumnFilters, number>;
}) {
    const [search, setSearch] = useState(filters.search);
    const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
        divisions: filters.divisions,
        districts: filters.districts,
        upazilas: filters.upazilas,
        unions: filters.unions,
        postoffices: filters.postoffices,
        postcodes: filters.postcodes,
    });
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<DivisionToUnionRow | null>(null);
    const form = useForm(emptyRecord);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(
                '/super-admin/divisiontounions',
                { search, ...columnFilters },
                { preserveState: true, replace: true, preserveScroll: true },
            );
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [
        search,
        columnFilters.divisions,
        columnFilters.districts,
        columnFilters.upazilas,
        columnFilters.unions,
        columnFilters.postoffices,
        columnFilters.postcodes,
    ]);

    const updateColumnFilter = (column: keyof ColumnFilters, value: string) => {
        setColumnFilters((current) => {
            const next = { ...current, [column]: value };

            if (column === 'divisions') {
                next.districts = '';
                next.upazilas = '';
                next.unions = '';
                next.postoffices = '';
                next.postcodes = '';
            } else if (column === 'districts') {
                next.upazilas = '';
                next.unions = '';
                next.postoffices = '';
                next.postcodes = '';
            } else if (column === 'upazilas') {
                next.unions = '';
                next.postoffices = '';
                next.postcodes = '';
            }

            return next;
        });
    };

    const openModal = (record?: DivisionToUnionRow) => {
        setEditing(record ?? null);
        form.clearErrors();
        form.setData(
            record
                ? {
                      divisions: record.divisions,
                      districts: record.districts,
                      upazilas: record.upazilas,
                      unions: record.unions,
                      postoffices: record.postoffices,
                      postcodes: record.postcodes,
                  }
                : emptyRecord,
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
            form.put(`/super-admin/divisiontounions/${editing.id}`, options);
        } else {
            form.post('/super-admin/divisiontounions', options);
        }
    };

    return (
        <>
            <Head title="Division to union" />
            <AdminPage
                title="Division to union"
                description="Manage divisions, districts, upazilas, unions, post offices, and postcodes."
                action={
                    <button
                        type="button"
                        onClick={() => openModal()}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        <Plus className="size-4" /> Add location
                    </button>
                }
            >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                    {summaryColumns.map(({ key, label, icon: Icon }) => (
                        <Panel key={key}>
                            <div className="flex items-center justify-between p-4">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {label}
                                    </p>
                                    <p className="mt-2 text-2xl font-bold">
                                        {summary[key].toLocaleString('en-BD')}
                                    </p>
                                </div>
                                <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                                    <Icon className="size-5" />
                                </span>
                            </div>
                        </Panel>
                    ))}
                </div>
                <Panel>
                    <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-3">
                            <SearchForm
                                value={search}
                                onChange={setSearch}
                                placeholder="Search locations"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    setColumnFilters({
                                        divisions: '',
                                        districts: '',
                                        upazilas: '',
                                        unions: '',
                                        postoffices: '',
                                        postcodes: '',
                                    });
                                }}
                                disabled={
                                    search === '' &&
                                    Object.values(columnFilters).every(
                                        (value) => value === '',
                                    )
                                }
                                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                                <RotateCcw className="size-4" />
                                Clear filters
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    {filterColumns.map(({ key, label }) => (
                                        <th
                                            key={key}
                                            className="min-w-36 px-3 py-3"
                                        >
                                            <label className="space-y-2">
                                                <span className="block">
                                                    {label}
                                                </span>
                                                <select
                                                    aria-label={`Filter by ${label}`}
                                                    value={columnFilters[key]}
                                                    onChange={(event) =>
                                                        updateColumnFilter(
                                                            key,
                                                            event.target.value,
                                                        )
                                                    }
                                                    disabled={
                                                        [
                                                            'unions',
                                                            'postoffices',
                                                            'postcodes',
                                                        ].includes(key) &&
                                                        columnFilters.upazilas ===
                                                            ''
                                                    }
                                                    className="h-9 w-full min-w-32 rounded-md border border-slate-300 bg-white px-2 text-xs font-normal normal-case dark:border-slate-700 dark:bg-slate-900"
                                                >
                                                    <option value="">
                                                        {[
                                                            'unions',
                                                            'postoffices',
                                                            'postcodes',
                                                        ].includes(key) &&
                                                        columnFilters.upazilas ===
                                                            ''
                                                            ? 'Select upazila first'
                                                            : `All ${label.toLowerCase()}s`}
                                                    </option>
                                                    {filterOptions[key].map(
                                                        (option) => (
                                                            <option
                                                                key={option}
                                                                value={option}
                                                            >
                                                                {option}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </label>
                                        </th>
                                    ))}
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {records.data.map((record) => (
                                    <tr key={record.id}>
                                        <td className="px-5 py-4 font-medium">
                                            {record.divisions}
                                        </td>
                                        <td className="px-5 py-4">
                                            {record.districts}
                                        </td>
                                        <td className="px-5 py-4">
                                            {record.upazilas}
                                        </td>
                                        <td className="px-5 py-4">
                                            {record.unions || '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            {record.postoffices || '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            {record.postcodes || '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openModal(record)
                                                    }
                                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium dark:border-slate-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`Delete location ${record.divisions}, ${record.districts}, ${record.upazilas}`}
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                `Delete ${record.divisions} / ${record.districts} / ${record.upazilas}?`,
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/super-admin/divisiontounions/${record.id}`,
                                                            );
                                                        }
                                                    }}
                                                    className="rounded-md p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {records.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No locations found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={records.links} />
                </Panel>
            </AdminPage>
            <FormModal
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? 'Edit location' : 'Add location'}
            >
                <form onSubmit={submit} className="space-y-4">
                    <TextField
                        label="Division"
                        value={form.data.divisions}
                        onChange={(event) =>
                            form.setData('divisions', event.target.value)
                        }
                        error={form.errors.divisions}
                        required
                    />
                    <TextField
                        label="District"
                        value={form.data.districts}
                        onChange={(event) =>
                            form.setData('districts', event.target.value)
                        }
                        error={form.errors.districts}
                        required
                    />
                    <TextField
                        label="Upazila"
                        value={form.data.upazilas}
                        onChange={(event) =>
                            form.setData('upazilas', event.target.value)
                        }
                        error={form.errors.upazilas}
                        required
                    />
                    <TextField
                        label="Union"
                        value={form.data.unions}
                        onChange={(event) =>
                            form.setData('unions', event.target.value)
                        }
                        error={form.errors.unions}
                    />
                    <TextField
                        label="Post office"
                        value={form.data.postoffices}
                        onChange={(event) =>
                            form.setData('postoffices', event.target.value)
                        }
                        error={form.errors.postoffices}
                    />
                    <TextField
                        label="Postcode"
                        value={form.data.postcodes}
                        onChange={(event) =>
                            form.setData('postcodes', event.target.value)
                        }
                        error={form.errors.postcodes}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="h-10 rounded-lg border border-slate-300 px-4 text-sm dark:border-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            Save location
                        </button>
                    </div>
                </form>
            </FormModal>
        </>
    );
}
