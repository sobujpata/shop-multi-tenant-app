import { Head, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    AdminPage,
    Panel,
    TextField,
} from '@/components/super-admin/admin-page';

type FooterLink = {
    label: string;
    url: string;
};

type FooterContent = {
    description: string;
    explore_links: FooterLink[];
    about_heading: string;
    about_links: FooterLink[];
    cta_title: string;
    cta_description: string;
    cta_label: string;
    cta_url: string;
    tagline: string;
};

export default function FooterContentEdit({
    footerContent,
}: {
    footerContent: FooterContent;
}) {
    const form = useForm<FooterContent>(footerContent);

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put('/super-admin/footer-content', {
            onSuccess: () => toast.success('Footer content updated.'),
        });
    }

    function updateLink(index: number, key: keyof FooterLink, value: string) {
        form.setData(
            'explore_links',
            form.data.explore_links.map((link, linkIndex) =>
                linkIndex === index ? { ...link, [key]: value } : link,
            ),
        );
    }

    function updateAboutLink(
        index: number,
        key: keyof FooterLink,
        value: string,
    ) {
        form.setData(
            'about_links',
            form.data.about_links.map((link, linkIndex) =>
                linkIndex === index ? { ...link, [key]: value } : link,
            ),
        );
    }

    return (
        <>
            <Head title="Footer content" />
            <AdminPage
                title="Footer content"
                description="Manage the text, navigation links, and call to action shown in the storefront footer."
                action={
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                form.setData('explore_links', [
                                    ...form.data.explore_links,
                                    { label: '', url: '' },
                                ])
                            }
                            disabled={form.data.explore_links.length >= 8}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="size-4" />
                            Add Explore link
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                form.setData('about_links', [
                                    ...form.data.about_links,
                                    { label: '', url: '' },
                                ])
                            }
                            disabled={form.data.about_links.length >= 8}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                            <Plus className="size-4" />
                            Add About link
                        </button>
                    </div>
                }
            >
                <Panel>
                    <form onSubmit={submit} className="space-y-7 p-5 sm:p-7">
                        <section className="space-y-4">
                            <div>
                                <h2 className="font-semibold">
                                    Marketplace introduction
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Displayed below the marketplace logo.
                                </p>
                            </div>
                            <label className="block space-y-1.5 text-sm font-medium">
                                Description
                                <textarea
                                    value={form.data.description}
                                    onChange={(event) =>
                                        form.setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={500}
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
                                />
                                {form.errors.description && (
                                    <span className="block text-xs text-red-600 dark:text-red-400">
                                        {form.errors.description}
                                    </span>
                                )}
                            </label>
                        </section>

                        <section className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
                            <div>
                                <h2 className="font-semibold">Explore links</h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Use a site path such as /shop or an https://
                                    URL. Up to 8 links.
                                </p>
                            </div>
                            {form.data.explore_links.length ? (
                                <div className="space-y-3">
                                    {form.data.explore_links.map(
                                        (link, index) => (
                                            <div
                                                key={`footer-link-${index}`}
                                                className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] sm:items-end dark:border-slate-800"
                                            >
                                                <TextField
                                                    label="Link label"
                                                    value={link.label}
                                                    onChange={(event) =>
                                                        updateLink(
                                                            index,
                                                            'label',
                                                            event.target.value,
                                                        )
                                                    }
                                                    maxLength={60}
                                                    required
                                                    error={
                                                        form.errors[
                                                            `explore_links.${index}.label`
                                                        ]
                                                    }
                                                />
                                                <TextField
                                                    label="Link URL"
                                                    value={link.url}
                                                    onChange={(event) =>
                                                        updateLink(
                                                            index,
                                                            'url',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="/shop"
                                                    maxLength={2048}
                                                    required
                                                    error={
                                                        form.errors[
                                                            `explore_links.${index}.url`
                                                        ]
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    aria-label={`Remove footer link ${index + 1}`}
                                                    onClick={() =>
                                                        form.setData(
                                                            'explore_links',
                                                            form.data.explore_links.filter(
                                                                (
                                                                    _,
                                                                    linkIndex,
                                                                ) =>
                                                                    linkIndex !==
                                                                    index,
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
                                        ),
                                    )}
                                </div>
                            ) : (
                                <p className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                    No footer links. Add one to show a link in
                                    the Explore section.
                                </p>
                            )}
                            {form.errors.explore_links && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {form.errors.explore_links}
                                </p>
                            )}
                        </section>

                        <section className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
                            <div>
                                <h2 className="font-semibold">About column</h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Set the heading and links shown beside
                                    Explore. Use a site path or an https:// URL.
                                </p>
                            </div>
                            <TextField
                                label="Column heading"
                                value={form.data.about_heading}
                                onChange={(event) =>
                                    form.setData(
                                        'about_heading',
                                        event.target.value,
                                    )
                                }
                                maxLength={100}
                                required
                                error={form.errors.about_heading}
                            />
                            {form.data.about_links.length ? (
                                <div className="space-y-3">
                                    {form.data.about_links.map(
                                        (link, index) => (
                                            <div
                                                key={`about-link-${index}`}
                                                className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] sm:items-end dark:border-slate-800"
                                            >
                                                <TextField
                                                    label="Link label"
                                                    value={link.label}
                                                    onChange={(event) =>
                                                        updateAboutLink(
                                                            index,
                                                            'label',
                                                            event.target.value,
                                                        )
                                                    }
                                                    maxLength={60}
                                                    required
                                                    error={
                                                        form.errors[
                                                            `about_links.${index}.label`
                                                        ]
                                                    }
                                                />
                                                <TextField
                                                    label="Link URL"
                                                    value={link.url}
                                                    onChange={(event) =>
                                                        updateAboutLink(
                                                            index,
                                                            'url',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="/about"
                                                    maxLength={2048}
                                                    required
                                                    error={
                                                        form.errors[
                                                            `about_links.${index}.url`
                                                        ]
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    aria-label={`Remove About link ${index + 1}`}
                                                    onClick={() =>
                                                        form.setData(
                                                            'about_links',
                                                            form.data.about_links.filter(
                                                                (
                                                                    _,
                                                                    linkIndex,
                                                                ) =>
                                                                    linkIndex !==
                                                                    index,
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
                                        ),
                                    )}
                                </div>
                            ) : (
                                <p className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                    No About links. Add one to display it in the
                                    footer.
                                </p>
                            )}
                            {form.errors.about_links && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {form.errors.about_links}
                                </p>
                            )}
                        </section>

                        <section className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
                            <div>
                                <h2 className="font-semibold">
                                    Call to action
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Shown in the highlighted footer card.
                                </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <TextField
                                    label="Heading"
                                    value={form.data.cta_title}
                                    onChange={(event) =>
                                        form.setData(
                                            'cta_title',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={100}
                                    required
                                    error={form.errors.cta_title}
                                />
                                <TextField
                                    label="Button label"
                                    value={form.data.cta_label}
                                    onChange={(event) =>
                                        form.setData(
                                            'cta_label',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={60}
                                    required
                                    error={form.errors.cta_label}
                                />
                                <TextField
                                    label="Button URL"
                                    value={form.data.cta_url}
                                    onChange={(event) =>
                                        form.setData(
                                            'cta_url',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="/shop"
                                    maxLength={2048}
                                    required
                                    error={form.errors.cta_url}
                                />
                                <TextField
                                    label="Copyright tagline"
                                    value={form.data.tagline}
                                    onChange={(event) =>
                                        form.setData(
                                            'tagline',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={180}
                                    required
                                    error={form.errors.tagline}
                                />
                            </div>
                            <label className="block space-y-1.5 text-sm font-medium">
                                Description
                                <textarea
                                    value={form.data.cta_description}
                                    onChange={(event) =>
                                        form.setData(
                                            'cta_description',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={300}
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
                                />
                                {form.errors.cta_description && (
                                    <span className="block text-xs text-red-600 dark:text-red-400">
                                        {form.errors.cta_description}
                                    </span>
                                )}
                            </label>
                        </section>

                        <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {form.processing
                                    ? 'Saving…'
                                    : 'Save footer content'}
                            </button>
                        </div>
                    </form>
                </Panel>
            </AdminPage>
        </>
    );
}
