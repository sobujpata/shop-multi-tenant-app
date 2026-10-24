import { Head, useForm } from '@inertiajs/react';
import { ImagePlus, Store } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    AdminPage,
    Panel,
    SelectField,
    TextField,
} from '@/components/super-admin/admin-page';

type MarketSettings = {
    market_name: string;
    logo_url: string | null;
    currency_code: string;
    timezone: string;
};

type FormData = {
    market_name: string;
    logo: File | null;
    remove_logo: boolean;
    currency_code: string;
    timezone: string;
};

export default function MarketSettingsEdit({
    settings,
    currencies,
    timezones,
}: {
    settings: MarketSettings;
    currencies: Record<string, string>;
    timezones: string[];
}) {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const form = useForm<FormData>({
        market_name: settings.market_name,
        logo: null,
        remove_logo: false,
        currency_code: settings.currency_code,
        timezone: settings.timezone,
    });
    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put('/super-admin/market-settings', {
            forceFormData: true,
            onSuccess: () => toast.success('Market settings updated.'),
        });
    }

    function changeLogo(file: File | null) {
        form.setData('logo', file);
        form.setData('remove_logo', false);
        setLogoPreview(file ? URL.createObjectURL(file) : null);
    }

    return (
        <>
            <Head title="Market settings" />
            <AdminPage
                title="Market settings"
                description="Manage the marketplace identity and regional defaults."
            >
                <Panel>
                    <form onSubmit={submit} className="space-y-6 p-5 sm:p-7">
                        <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center dark:border-slate-800">
                            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                                {logoPreview ||
                                (!form.data.remove_logo &&
                                    settings.logo_url) ? (
                                    <img
                                        src={
                                            logoPreview ??
                                            settings.logo_url ??
                                            ''
                                        }
                                        alt="Marketplace logo preview"
                                        className="size-full object-contain p-2"
                                    />
                                ) : (
                                    <Store className="size-8 text-slate-400" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <label className="block space-y-1.5 text-sm font-medium">
                                    Marketplace logo
                                    <span className="mt-1 flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-950">
                                        <ImagePlus className="size-4 text-slate-500" />
                                        <span className="truncate">
                                            {form.data.logo?.name ??
                                                'Choose an image'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(event) =>
                                                changeLogo(
                                                    event.target.files?.[0] ??
                                                        null,
                                                )
                                            }
                                        />
                                    </span>
                                    <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">
                                        PNG, JPG or WEBP up to 2 MB.
                                    </span>
                                    {form.errors.logo && (
                                        <span className="block text-xs text-red-600 dark:text-red-400">
                                            {form.errors.logo}
                                        </span>
                                    )}
                                </label>
                                {settings.logo_url && (
                                    <label className="mt-3 inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                        <input
                                            type="checkbox"
                                            checked={form.data.remove_logo}
                                            onChange={(event) => {
                                                form.setData(
                                                    'remove_logo',
                                                    event.target.checked,
                                                );
                                                if (event.target.checked) {
                                                    form.setData('logo', null);
                                                    setLogoPreview(null);
                                                }
                                            }}
                                            className="size-4 accent-indigo-600"
                                        />
                                        Remove current logo
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <TextField
                                label="Marketplace name"
                                value={form.data.market_name}
                                onChange={(event) =>
                                    form.setData(
                                        'market_name',
                                        event.target.value,
                                    )
                                }
                                maxLength={120}
                                required
                                error={form.errors.market_name}
                            />
                            <SelectField
                                label="Currency"
                                value={form.data.currency_code}
                                onChange={(event) =>
                                    form.setData(
                                        'currency_code',
                                        event.target.value,
                                    )
                                }
                                error={form.errors.currency_code}
                            >
                                {Object.entries(currencies).map(
                                    ([code, label]) => (
                                        <option key={code} value={code}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </SelectField>
                            <SelectField
                                label="Date and time zone"
                                value={form.data.timezone}
                                onChange={(event) =>
                                    form.setData('timezone', event.target.value)
                                }
                                error={form.errors.timezone}
                            >
                                {timezones.map((timezone) => (
                                    <option key={timezone} value={timezone}>
                                        {timezone.replaceAll('_', ' ')}
                                    </option>
                                ))}
                            </SelectField>
                        </div>

                        <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {form.processing
                                    ? 'Saving…'
                                    : 'Save market settings'}
                            </button>
                        </div>
                    </form>
                </Panel>
            </AdminPage>
        </>
    );
}
