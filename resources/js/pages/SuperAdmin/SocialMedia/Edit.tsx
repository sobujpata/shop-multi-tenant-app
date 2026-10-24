import { Head, useForm } from '@inertiajs/react';
import {
    Facebook,
    Instagram,
    Linkedin,
    Music2,
    Plus,
    Trash2,
    Twitter,
    Youtube,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    AdminPage,
    Panel,
    SelectField,
    TextField,
} from '@/components/super-admin/admin-page';

type SocialPlatform =
    | 'facebook'
    | 'instagram'
    | 'youtube'
    | 'x'
    | 'linkedin'
    | 'tiktok';

type SocialLink = {
    platform: SocialPlatform;
    url: string;
};

const platformIcons = {
    facebook: Facebook,
    instagram: Instagram,
    youtube: Youtube,
    x: Twitter,
    linkedin: Linkedin,
    tiktok: Music2,
};

export default function SocialMediaEdit({
    socialLinks,
    platforms,
}: {
    socialLinks: SocialLink[];
    platforms: Record<SocialPlatform, string>;
}) {
    const form = useForm<{ social_links: SocialLink[] }>({
        social_links: socialLinks,
    });

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put('/super-admin/social-media', {
            onSuccess: () => toast.success('Social media links updated.'),
        });
    }

    function updateLink(index: number, key: keyof SocialLink, value: string) {
        form.setData(
            'social_links',
            form.data.social_links.map((link, linkIndex) =>
                linkIndex === index ? { ...link, [key]: value } : link,
            ),
        );
    }

    return (
        <>
            <Head title="Social media" />
            <AdminPage
                title="Social media"
                description="Manage the social profiles displayed on your marketplace."
                action={
                    <button
                        type="button"
                        onClick={() =>
                            form.setData('social_links', [
                                ...form.data.social_links,
                                { platform: 'facebook', url: '' },
                            ])
                        }
                        disabled={form.data.social_links.length >= 10}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Plus className="size-4" />
                        Add social link
                    </button>
                }
            >
                <Panel>
                    <form onSubmit={submit} className="space-y-5 p-5 sm:p-7">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Add up to 10 public profile links. Saved links
                            appear with their platform icon in the storefront
                            footer.
                        </p>

                        {form.data.social_links.length ? (
                            <div className="space-y-4">
                                {form.data.social_links.map((link, index) => {
                                    const Icon = platformIcons[link.platform];

                                    return (
                                        <div
                                            key={`${link.platform}-${index}`}
                                            className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-end dark:border-slate-800"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                    <Icon className="size-4" />
                                                </span>
                                                <SelectField
                                                    label="Platform"
                                                    value={link.platform}
                                                    onChange={(event) =>
                                                        updateLink(
                                                            index,
                                                            'platform',
                                                            event.target.value,
                                                        )
                                                    }
                                                    error={
                                                        form.errors[
                                                            `social_links.${index}.platform`
                                                        ]
                                                    }
                                                >
                                                    {Object.entries(
                                                        platforms,
                                                    ).map(([value, label]) => (
                                                        <option
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {label}
                                                        </option>
                                                    ))}
                                                </SelectField>
                                            </div>
                                            <TextField
                                                label="Profile URL"
                                                type="url"
                                                value={link.url}
                                                onChange={(event) =>
                                                    updateLink(
                                                        index,
                                                        'url',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="https://..."
                                                required
                                                error={
                                                    form.errors[
                                                        `social_links.${index}.url`
                                                    ]
                                                }
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    form.setData(
                                                        'social_links',
                                                        form.data.social_links.filter(
                                                            (_, linkIndex) =>
                                                                linkIndex !==
                                                                index,
                                                        ),
                                                    )
                                                }
                                                aria-label={`Remove ${platforms[link.platform]} link`}
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-800 dark:hover:text-red-400"
                                            >
                                                <Trash2 className="size-4" />
                                                <span className="sm:hidden">
                                                    Remove
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                No social links configured. Add one to show your
                                social profile in the storefront.
                            </div>
                        )}

                        {form.errors.social_links && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {form.errors.social_links}
                            </p>
                        )}

                        <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {form.processing
                                    ? 'Saving…'
                                    : 'Save social links'}
                            </button>
                        </div>
                    </form>
                </Panel>
            </AdminPage>
        </>
    );
}
