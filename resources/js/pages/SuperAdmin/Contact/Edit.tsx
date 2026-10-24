import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    AdminPage,
    Panel,
    TextField,
} from '@/components/super-admin/admin-page';

type ContactContent = {
    eyebrow: string;
    title: string;
    intro: string;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    address: string | null;
    business_hours: string | null;
    map_url: string | null;
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
    value: string | null;
    onChange: (value: string) => void;
    rows: number;
    maxLength: number;
    error?: string;
}) {
    return (
        <label className="block space-y-1.5 text-sm font-medium">
            {label}
            <textarea
                value={value ?? ''}
                onChange={(event) => onChange(event.target.value)}
                rows={rows}
                maxLength={maxLength}
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

export default function ContactEdit({ contact }: { contact: ContactContent }) {
    const form = useForm<ContactContent>(contact);

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put('/super-admin/contact', {
            onSuccess: () => toast.success('Contact information updated.'),
        });
    }

    return (
        <>
            <Head title="Contact information" />
            <AdminPage
                title="Contact information"
                description="Manage the public contact details shoppers see on the Contact page."
            >
                <Panel>
                    <form onSubmit={submit} className="space-y-7 p-5 sm:p-7">
                        <section className="space-y-4">
                            <div>
                                <h2 className="font-semibold">
                                    Page introduction
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Set the heading and welcome message for the
                                    public Contact page.
                                </p>
                            </div>
                            <TextField
                                label="Eyebrow"
                                value={form.data.eyebrow}
                                onChange={(event) =>
                                    form.setData('eyebrow', event.target.value)
                                }
                                maxLength={100}
                                required
                                error={form.errors.eyebrow}
                            />
                            <TextField
                                label="Page title"
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
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
                        </section>

                        <section className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
                            <div>
                                <h2 className="font-semibold">
                                    Contact details
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Leave a field blank to hide that contact
                                    method from visitors.
                                </p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextField
                                    label="Email address"
                                    type="email"
                                    value={form.data.email ?? ''}
                                    onChange={(event) =>
                                        form.setData(
                                            'email',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={255}
                                    error={form.errors.email}
                                />
                                <TextField
                                    label="Phone number"
                                    type="tel"
                                    value={form.data.phone ?? ''}
                                    onChange={(event) =>
                                        form.setData(
                                            'phone',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={40}
                                    error={form.errors.phone}
                                />
                                <TextField
                                    label="WhatsApp number"
                                    type="tel"
                                    value={form.data.whatsapp ?? ''}
                                    onChange={(event) =>
                                        form.setData(
                                            'whatsapp',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={40}
                                    error={form.errors.whatsapp}
                                />
                                <TextField
                                    label="Map link (HTTPS)"
                                    type="url"
                                    value={form.data.map_url ?? ''}
                                    onChange={(event) =>
                                        form.setData(
                                            'map_url',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={2048}
                                    placeholder="https://maps.google.com/..."
                                    error={form.errors.map_url}
                                />
                            </div>
                            <TextAreaField
                                label="Address"
                                value={form.data.address}
                                onChange={(value) =>
                                    form.setData('address', value)
                                }
                                rows={2}
                                maxLength={2000}
                                error={form.errors.address}
                            />
                            <TextAreaField
                                label="Business hours"
                                value={form.data.business_hours}
                                onChange={(value) =>
                                    form.setData('business_hours', value)
                                }
                                rows={3}
                                maxLength={1000}
                                error={form.errors.business_hours}
                            />
                        </section>

                        <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {form.processing
                                    ? 'Saving…'
                                    : 'Save contact information'}
                            </button>
                        </div>
                    </form>
                </Panel>
            </AdminPage>
        </>
    );
}
