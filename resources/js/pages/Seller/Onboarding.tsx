import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, Check, Store, Warehouse } from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type OnboardingForm = {
    tenant_name: string;
    email: string;
    phone: string;
    branch_name: string;
    address: string;
    city: string;
    delivery_area: string;
    delivery_cost: string;
};

export default function SellerOnboarding({
    account,
}: {
    account: { name: string; email: string };
}) {
    const form = useForm<OnboardingForm>({
        tenant_name: '',
        email: account.email,
        phone: '',
        branch_name: '',
        address: '',
        city: '',
        delivery_area: '',
        delivery_cost: '0',
    });
    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/seller/onboarding');
    }

    return (
        <>
            <Head title="Set up your seller account" />
            <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_20%,rgba(249,115,22,0.25),transparent_38%),radial-gradient(ellipse_at_10%_100%,rgba(59,130,246,0.16),transparent_40%),linear-gradient(135deg,#0f172a,#1e293b)]" />
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/25 bg-orange-400/10 px-3 py-1.5 text-xs font-semibold tracking-[0.16em] text-orange-200 uppercase">
                        <Store className="size-4" />
                        Seller onboarding
                    </div>
                    <h1 className="mt-5 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
                        Welcome, {account.name}. Let&apos;s set up your store.
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                        Add your store and first branch to open your seller
                        panel. Your account starts with one month of Free
                        access.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
                        {['10 products', '1 branch', '30-day Free access'].map(
                            (benefit) => (
                                <span
                                    key={benefit}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"
                                >
                                    <Check className="size-4 text-orange-300" />
                                    {benefit}
                                </span>
                            ),
                        )}
                    </div>
                </section>

                <form onSubmit={submit} className="mt-7 space-y-6">
                    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
                        <div className="mb-6 flex items-center gap-3">
                            <span className="grid size-10 place-items-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-300">
                                <Store className="size-5" />
                            </span>
                            <div>
                                <h2 className="font-semibold">Your store</h2>
                                <p className="text-sm text-muted-foreground">
                                    These details identify your marketplace
                                    store.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                                id="tenant_name"
                                label="Store name"
                                value={form.data.tenant_name}
                                error={form.errors.tenant_name}
                                onChange={(value) =>
                                    form.setData('tenant_name', value)
                                }
                                placeholder="e.g. Your Store"
                                required
                            />
                            <Field
                                id="email"
                                label="Store contact email"
                                value={form.data.email}
                                error={form.errors.email}
                                onChange={(value) =>
                                    form.setData('email', value)
                                }
                                type="email"
                                autoComplete="email"
                                required
                            />
                            <Field
                                id="phone"
                                label="Store phone"
                                value={form.data.phone}
                                error={form.errors.phone}
                                onChange={(value) =>
                                    form.setData('phone', value)
                                }
                                type="tel"
                                autoComplete="tel"
                                placeholder="+880 1XXX-XXXXXX"
                                required
                            />
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
                        <div className="mb-6 flex items-center gap-3">
                            <span className="grid size-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
                                <Warehouse className="size-5" />
                            </span>
                            <div>
                                <h2 className="font-semibold">First branch</h2>
                                <p className="text-sm text-muted-foreground">
                                    Your Free plan includes one branch and its
                                    first delivery area.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                                id="branch_name"
                                label="Branch name"
                                value={form.data.branch_name}
                                error={form.errors.branch_name}
                                onChange={(value) =>
                                    form.setData('branch_name', value)
                                }
                                placeholder="e.g. Main branch"
                                required
                            />
                            <Field
                                id="city"
                                label="City"
                                value={form.data.city}
                                error={form.errors.city}
                                onChange={(value) =>
                                    form.setData('city', value)
                                }
                                required
                            />
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="address">Street address</Label>
                                <Input
                                    id="address"
                                    value={form.data.address}
                                    onChange={(event) =>
                                        form.setData(
                                            'address',
                                            event.target.value,
                                        )
                                    }
                                    autoComplete="street-address"
                                    required
                                />
                                <InputError message={form.errors.address} />
                            </div>
                            <Field
                                id="delivery_area"
                                label="Delivery area"
                                value={form.data.delivery_area}
                                error={form.errors.delivery_area}
                                onChange={(value) =>
                                    form.setData('delivery_area', value)
                                }
                                placeholder="e.g. Inside Dhaka"
                                required
                            />
                            <Field
                                id="delivery_cost"
                                label="Delivery charge (৳)"
                                value={form.data.delivery_cost}
                                error={form.errors.delivery_cost}
                                onChange={(value) =>
                                    form.setData('delivery_cost', value)
                                }
                                type="number"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </section>

                    <div className="flex flex-col-reverse items-stretch justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:flex-row sm:items-center sm:px-6 dark:border-orange-900/50 dark:bg-orange-950/20">
                        <p className="max-w-xl text-sm leading-6 text-orange-950 dark:text-orange-100">
                            By continuing, you’ll start a 30-day Free
                            subscription with access to up to 10 products and
                            one branch. After it expires, your panel becomes
                            read-only until your subscription is renewed.
                        </p>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="h-11 shrink-0 gap-2 bg-orange-600 font-semibold text-white hover:bg-orange-700"
                        >
                            {form.processing ? <Spinner /> : null}
                            Create store and continue
                            {!form.processing && (
                                <ArrowRight className="size-4" />
                            )}
                        </Button>
                    </div>
                </form>
            </main>
        </>
    );
}

function Field({
    id,
    label,
    value,
    error,
    onChange,
    ...inputProps
}: {
    id: keyof OnboardingForm;
    label: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
    type?: string;
    min?: string;
    step?: string;
    autoComplete?: string;
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                name={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-11"
                {...inputProps}
            />
            <InputError message={error} />
        </div>
    );
}
