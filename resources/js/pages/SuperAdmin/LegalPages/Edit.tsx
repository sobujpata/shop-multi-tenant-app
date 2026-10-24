import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { AdminPage, Panel } from '@/components/super-admin/admin-page';

type LegalPage = {
    slug: string;
    title: string;
    intro: string;
    content: string;
};

type LegalPages = Record<string, LegalPage>;

const pageDetails = [
    {
        slug: 'terms-of-use',
        label: 'Terms of Use',
        description: 'Terms for using the marketplace and placing orders.',
    },
    {
        slug: 'privacy-policy',
        label: 'Privacy Policy',
        description: 'Explain what information is used and how it is handled.',
    },
    {
        slug: 'refund-policy',
        label: 'Refund Policy',
        description: 'Describe how returns and refund requests are handled.',
    },
] as const;

export default function LegalPagesEdit({ pages }: { pages: LegalPages }) {
    const form = useForm<{ pages: LegalPages }>({ pages });

    function updatePage(
        slug: string,
        key: keyof Omit<LegalPage, 'slug'>,
        value: string,
    ) {
        form.setData('pages', {
            ...form.data.pages,
            [slug]: {
                ...form.data.pages[slug],
                [key]: value,
            },
        });
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put('/super-admin/legal-pages', {
            onSuccess: () => toast.success('Legal pages updated.'),
        });
    }

    return (
        <>
            <Head title="Legal pages" />
            <AdminPage
                title="Legal pages"
                description="Manage the Terms of Use, Privacy Policy, and Refund Policy shown to marketplace visitors."
            >
                <Panel>
                    <form onSubmit={submit} className="space-y-7 p-5 sm:p-7">
                        {pageDetails.map(({ slug, label, description }) => {
                            const page = form.data.pages[slug];

                            return (
                                <section
                                    key={slug}
                                    className="space-y-4 border-b border-slate-200 pb-7 last:border-0 last:pb-0 dark:border-slate-800"
                                >
                                    <div>
                                        <h2 className="font-semibold">
                                            {label}
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            {description} Public URL:{' '}
                                            <a
                                                href={`/${slug}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                            >
                                                /{slug}
                                            </a>
                                        </p>
                                    </div>
                                    <label className="block space-y-1.5 text-sm font-medium">
                                        Page title
                                        <input
                                            value={page.title}
                                            onChange={(event) =>
                                                updatePage(
                                                    slug,
                                                    'title',
                                                    event.target.value,
                                                )
                                            }
                                            maxLength={160}
                                            required
                                            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
                                        />
                                        {form.errors[`pages.${slug}.title`] && (
                                            <span className="block text-xs text-red-600 dark:text-red-400">
                                                {
                                                    form.errors[
                                                        `pages.${slug}.title`
                                                    ]
                                                }
                                            </span>
                                        )}
                                    </label>
                                    <label className="block space-y-1.5 text-sm font-medium">
                                        Introduction
                                        <textarea
                                            value={page.intro}
                                            onChange={(event) =>
                                                updatePage(
                                                    slug,
                                                    'intro',
                                                    event.target.value,
                                                )
                                            }
                                            maxLength={1000}
                                            rows={2}
                                            required
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
                                        />
                                        {form.errors[`pages.${slug}.intro`] && (
                                            <span className="block text-xs text-red-600 dark:text-red-400">
                                                {
                                                    form.errors[
                                                        `pages.${slug}.intro`
                                                    ]
                                                }
                                            </span>
                                        )}
                                    </label>
                                    <label className="block space-y-1.5 text-sm font-medium">
                                        Page content
                                        <textarea
                                            value={page.content}
                                            onChange={(event) =>
                                                updatePage(
                                                    slug,
                                                    'content',
                                                    event.target.value,
                                                )
                                            }
                                            maxLength={30000}
                                            rows={12}
                                            required
                                            aria-describedby={`legal-content-help-${slug}`}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
                                        />
                                        <span
                                            id={`legal-content-help-${slug}`}
                                            className="block text-xs font-normal text-slate-500 dark:text-slate-400"
                                        >
                                            Separate sections with a blank line.
                                            Each section’s first line is used as
                                            its heading.
                                        </span>
                                        {form.errors[
                                            `pages.${slug}.content`
                                        ] && (
                                            <span className="block text-xs text-red-600 dark:text-red-400">
                                                {
                                                    form.errors[
                                                        `pages.${slug}.content`
                                                    ]
                                                }
                                            </span>
                                        )}
                                    </label>
                                </section>
                            );
                        })}
                        <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {form.processing
                                    ? 'Saving…'
                                    : 'Save legal pages'}
                            </button>
                        </div>
                    </form>
                </Panel>
            </AdminPage>
        </>
    );
}
