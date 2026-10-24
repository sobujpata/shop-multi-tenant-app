import { Form, Head, Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home, register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Staff login" />

            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(234,88,12,0.12),transparent_32%),linear-gradient(135deg,#fff_0%,#fff7ed_38%,#f8fafc_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),transparent_28%),linear-gradient(135deg,#020817_0%,#111827_42%,#0f172a_100%)] sm:px-6 lg:px-8">
                <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-border/80 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:bg-slate-950/70">
                    <div className="hidden w-[46%] flex-col justify-between bg-slate-950 p-8 text-white lg:flex dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                            <Link
                                href={home()}
                                className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
                            >
                                <AppLogoIcon className="h-7 w-7 fill-current text-white" />
                                Marketplace Admin
                            </Link>
                        </div>

                        <div className="space-y-6">
                            <div className="inline-flex items-center rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold tracking-[0.18em] text-orange-200 uppercase">
                                Staff portal
                            </div>
                            <div>
                                <h1 className="max-w-sm text-4xl font-black leading-tight tracking-[-0.05em] text-white">
                                    Manage your store with confidence.
                                </h1>
                                <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
                                    Track orders, manage inventory, and keep your
                                    storefront moving from one secure workspace.
                                </p>
                            </div>

                            <div className="space-y-4 text-sm text-slate-200">
                                {[
                                    'Inventory and stock updates',
                                    'Customer orders and fulfilment',
                                    'Team access and reporting',
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                                    >
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/20 text-orange-300">
                                            ✓
                                        </span>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="text-sm text-slate-400">
                            Secure access for staff only
                        </div>
                    </div>

                    <div className="flex w-full items-center justify-center p-5 sm:p-8 lg:w-[54%] lg:p-12">
                        <div className="w-full max-w-md">
                            <div className="mb-8 flex items-center justify-center lg:hidden">
                                <Link
                                    href={home()}
                                    className="inline-flex items-center gap-3 rounded-full border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground"
                                >
                                    <AppLogoIcon className="h-6 w-6 fill-current text-foreground" />
                                    Marketplace Admin
                                </Link>
                            </div>

                            <div className="mb-7 text-center lg:text-left">
                                <p className="text-sm font-semibold tracking-[0.2em] text-orange-600 uppercase dark:text-orange-300">
                                    Welcome back
                                </p>
                                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                                    Staff login
                                </h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Sign in with your email and password to continue.
                                </p>
                            </div>

                            {status && (
                                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    {status}
                                </div>
                            )}

                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="space-y-5"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="space-y-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="email">
                                                    Email address
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="email"
                                                    placeholder="email@example.com"
                                                    className="h-11 rounded-xl border-border bg-background/80 px-3.5"
                                                />
                                                <InputError message={errors.email} />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <Label htmlFor="password">
                                                        Password
                                                    </Label>
                                                    {canResetPassword && (
                                                        <TextLink
                                                            href={request()}
                                                            className="text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-300 dark:hover:text-orange-200"
                                                            tabIndex={5}
                                                        >
                                                            Forgot password?
                                                        </TextLink>
                                                    )}
                                                </div>
                                                <PasswordInput
                                                    id="password"
                                                    name="password"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="current-password"
                                                    placeholder="Password"
                                                    className="h-11 rounded-xl border-border bg-background/80 px-3.5"
                                                />
                                                <InputError message={errors.password} />
                                            </div>

                                            <div className="flex items-center space-x-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                                                <Checkbox
                                                    id="remember"
                                                    name="remember"
                                                    tabIndex={3}
                                                />
                                                <Label
                                                    htmlFor="remember"
                                                    className="text-sm text-muted-foreground"
                                                >
                                                    Remember me
                                                </Label>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="h-11 w-full rounded-xl bg-slate-900 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 dark:bg-orange-500 dark:text-slate-950 dark:hover:bg-orange-400"
                                                tabIndex={4}
                                                disabled={processing}
                                                data-test="login-button"
                                            >
                                                {processing && <Spinner />}
                                                Log in
                                            </Button>
                                        </div>

                                        <div className="mt-6 text-center text-sm text-muted-foreground">
                                            Don&apos;t have an account?{' '}
                                            <TextLink
                                                href={register()}
                                                tabIndex={5}
                                                className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-300 dark:hover:text-orange-200"
                                            >
                                                Sign up
                                            </TextLink>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Login.layout = {
    title: '',
    description: '',
};
