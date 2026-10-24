import { Form, Head, Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home, login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    return (
        <>
            <Head title="Staff registration" />

            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(234,88,12,0.12),transparent_32%),linear-gradient(135deg,#fff_0%,#fff7ed_38%,#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-8 dark:bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),transparent_28%),linear-gradient(135deg,#020817_0%,#111827_42%,#0f172a_100%)]">
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
                                <h1 className="max-w-sm text-4xl leading-tight font-black tracking-[-0.05em] text-white">
                                    Set up your workspace access.
                                </h1>
                                <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
                                    Create your staff account to help manage
                                    store operations in one secure workspace.
                                </p>
                            </div>

                            <div className="space-y-4 text-sm text-slate-200">
                                {[
                                    'Manage products and inventory',
                                    'Stay on top of customer orders',
                                    'Work securely with your team',
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
                                    Join the team
                                </p>
                                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                                    Create staff account
                                </h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Enter your details to set up secure staff
                                    access.
                                </p>
                            </div>

                            <Form
                                {...store.form()}
                                resetOnSuccess={[
                                    'password',
                                    'password_confirmation',
                                ]}
                                disableWhileProcessing
                                className="space-y-5"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="space-y-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">
                                                    Full name
                                                </Label>
                                                <Input
                                                    id="name"
                                                    type="text"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="name"
                                                    name="name"
                                                    placeholder="Your full name"
                                                    className="h-11 rounded-xl border-border bg-background/80 px-3.5"
                                                />
                                                <InputError
                                                    message={errors.name}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">
                                                    Email address
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="email"
                                                    name="email"
                                                    placeholder="email@example.com"
                                                    className="h-11 rounded-xl border-border bg-background/80 px-3.5"
                                                />
                                                <InputError
                                                    message={errors.email}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="password">
                                                    Password
                                                </Label>
                                                <PasswordInput
                                                    id="password"
                                                    required
                                                    tabIndex={3}
                                                    autoComplete="new-password"
                                                    name="password"
                                                    placeholder="Create a password"
                                                    passwordrules={
                                                        passwordRules
                                                    }
                                                    className="h-11 rounded-xl border-border bg-background/80 px-3.5"
                                                />
                                                <InputError
                                                    message={errors.password}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="password_confirmation">
                                                    Confirm password
                                                </Label>
                                                <PasswordInput
                                                    id="password_confirmation"
                                                    required
                                                    tabIndex={4}
                                                    autoComplete="new-password"
                                                    name="password_confirmation"
                                                    placeholder="Enter your password again"
                                                    passwordrules={
                                                        passwordRules
                                                    }
                                                    className="h-11 rounded-xl border-border bg-background/80 px-3.5"
                                                />
                                                <InputError
                                                    message={
                                                        errors.password_confirmation
                                                    }
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                className="h-11 w-full rounded-xl bg-slate-900 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 dark:bg-orange-500 dark:text-slate-950 dark:hover:bg-orange-400"
                                                tabIndex={5}
                                                disabled={processing}
                                                data-test="register-user-button"
                                            >
                                                {processing && <Spinner />}
                                                Create account
                                            </Button>
                                        </div>

                                        <div className="mt-6 text-center text-sm text-muted-foreground">
                                            Already have an account?{' '}
                                            <Link
                                                href={login()}
                                                tabIndex={6}
                                                className="font-semibold text-orange-600 transition hover:text-orange-700 dark:text-orange-300 dark:hover:text-orange-200"
                                            >
                                                Log in
                                            </Link>
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

Register.layout = {
    title: '',
    description: '',
};
