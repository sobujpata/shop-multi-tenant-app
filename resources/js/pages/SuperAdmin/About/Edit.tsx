import { Head, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    AdminPage,
    Panel,
    TextField,
} from '@/components/super-admin/admin-page';

type MarketplaceValue = {
    title: string;
    description: string;
};

type AboutContent = {
    eyebrow: string;
    title: string;
    intro: string;
    story_heading: string;
    story_body: string;
    mission_heading: string;
    mission_body: string;
    vision_heading: string;
    vision_body: string;
    values: MarketplaceValue[];
};

function TextAreaField({
    label,
    value,
    onChange,
    rows,
    maxLength,
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    rows: number;
    maxLength: number;
    error?: string;
}) {
    return (
        <label className="block space-y-1.5 text-sm font-medium">
            {label}
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                rows={rows}
                maxLength={maxLength}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
            />
            {error && (
                <span className="block text-xs text-red-600 dark:text-red-400">
                    {error}
                </span>
            )}
        </label>
    );
}

export default function AboutEdit({ about }: { about: AboutContent }) {
    const form = useForm<AboutContent>(about);

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put('/super-admin/about', {
            onSuccess: () => toast.success('About page updated.'),
        });
    }

    function updateValue(
        index: number,
        key: keyof MarketplaceValue,
        value: string,
    ) {
        form.setData(
            'values',
            form.data.values.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [key]: value } : item,
            ),
        );
    }

    return (
        <>
            <Head title="About page" />
            <AdminPage
                title="About page"
                description="Write and update the marketplace story shown to shoppers."
            >
                <Panel>
                    <form onSubmit={submit} className="space-y-7 p-5 sm:p-7">
                        <section className="space-y-4">
                            <div>
                                <h2 className="font-semibold">Page header</h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    The opening message visitors see on the
                                    public About page.
                                </p>
                            </div>
                            <div className="grid gap-4">
                                <TextField
                                    label="Eyebrow"
                                    value={form.data.eyebrow}
                                    onChange={(event) =>
                                        form.setData(
                                            'eyebrow',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={100}
                                    required
                                    error={form.errors.eyebrow}
                                />
                                <TextField
                                    label="Page title"
                                    value={form.data.title}
                                    onChange={(event) =>
                                        form.setData(
                                            'title',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={160}
                                    required
                                    error={form.errors.title}
                                />
                                <TextAreaField
                                    label="Introduction"
                                    value={form.data.intro}
                                    onChange={(value) =>
                                        form.setData('intro', value)
                                    }
                                    rows={3}
                                    maxLength={1000}
                                    error={form.errors.intro}
                                />
                            </div>
                        </section>

                        <section className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
                            <div>
                                <h2 className="font-semibold">Our story</h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Explain why the marketplace was created and
                                    who it serves.
                                </p>
                            </div>
                            <TextField
                                label="Story heading"
                                value={form.data.story_heading}
                                onChange={(event) =>
                                    form.setData(
                                        'story_heading',
                                        event.target.value,
                                    )
                                }
                                maxLength={160}
                                required
                                error={form.errors.story_heading}
                            />
                            <TextAreaField
                                label="Story"
                                value={form.data.story_body}
                                onChange={(value) =>
                                    form.setData('story_body', value)
                                }
                                rows={6}
                                maxLength={10000}
                                error={form.errors.story_body}
                            />
                        </section>

                        <section className="grid gap-6 border-t border-slate-200 pt-6 md:grid-cols-2 dark:border-slate-800">
                            <div className="space-y-4">
                                <h2 className="font-semibold">Our mission</h2>
                                <TextField
                                    label="Mission heading"
                                    value={form.data.mission_heading}
                                    onChange={(event) =>
                                        form.setData(
                                            'mission_heading',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={120}
                                    required
                                    error={form.errors.mission_heading}
                                />
                                <TextAreaField
                                    label="Mission statement"
                                    value={form.data.mission_body}
                                    onChange={(value) =>
                                        form.setData('mission_body', value)
                                    }
                                    rows={4}
                                    maxLength={2000}
                                    error={form.errors.mission_body}
                                />
                            </div>
                            <div className="space-y-4">
                                <h2 className="font-semibold">Our vision</h2>
                                <TextField
                                    label="Vision heading"
                                    value={form.data.vision_heading}
                                    onChange={(event) =>
                                        form.setData(
                                            'vision_heading',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={120}
                                    required
                                    error={form.errors.vision_heading}
                                />
                                <TextAreaField
                                    label="Vision statement"
                                    value={form.data.vision_body}
                                    onChange={(value) =>
                                        form.setData('vision_body', value)
                                    }
                                    rows={4}
                                    maxLength={2000}
                                    error={form.errors.vision_body}
                                />
                            </div>
                        </section>

                        <section className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="font-semibold">
                                        Marketplace values
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Add up to six principles that guide the
                                        marketplace.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        form.setData('values', [
                                            ...form.data.values,
                                            { title: '', description: '' },
                                        ])
                                    }
                                    disabled={form.data.values.length >= 6}
                                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                                >
                                    <Plus className="size-4" />
                                    Add value
                                </button>
                            </div>

                            {form.data.values.map((item, index) => (
                                <div
                                    key={`value-${index}`}
                                    className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)_auto] sm:items-end dark:border-slate-800"
                                >
                                    <TextField
                                        label="Value title"
                                        value={item.title}
                                        onChange={(event) =>
                                            updateValue(
                                                index,
                                                'title',
                                                event.target.value,
                                            )
                                        }
                                        maxLength={80}
                                        required
                                        error={
                                            form.errors[`values.${index}.title`]
                                        }
                                    />
                                    <TextAreaField
                                        label="Description"
                                        value={item.description}
                                        onChange={(value) =>
                                            updateValue(
                                                index,
                                                'description',
                                                value,
                                            )
                                        }
                                        rows={2}
                                        maxLength={300}
                                        error={
                                            form.errors[
                                                `values.${index}.description`
                                            ]
                                        }
                                    />
                                    <button
                                        type="button"
                                        aria-label={`Remove value ${index + 1}`}
                                        onClick={() =>
                                            form.setData(
                                                'values',
                                                form.data.values.filter(
                                                    (_, itemIndex) =>
                                                        itemIndex !== index,
                                                ),
                                            )
                                        }
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-800 dark:hover:text-red-400"
                                    >
                                        <Trash2 className="size-4" />
                                        <span className="sm:hidden">
                                            Remove
                                        </span>
                                    </button>
                                </div>
                            ))}
                            {form.errors.values && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {form.errors.values}
                                </p>
                            )}
                        </section>

                        <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {form.processing
                                    ? 'Saving…'
                                    : 'Save About page'}
                            </button>
                        </div>
                    </form>
                </Panel>
            </AdminPage>
        </>
    );
}
