import { Form, Head, Link } from '@inertiajs/react';
import { KeyRound, Mail } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home, login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Staff password recovery" />

            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(234,88,12,0.12),transparent_32%),linear-gradient(135deg,#fff_0%,#fff7ed_38%,#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-8 dark:bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),transparent_28%),linear-gradient(135deg,#020817_0%,#111827_42%,#0f172a_100%)]">
                <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-border/80 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:bg-slate-950/70">
                    <div className="hidden w-[46%] flex-col justify-between bg-slate-950 p-8 text-white lg:flex dark:bg-slate-900">
                        <Link
                            href={home()}
                            className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
                        >
                            <AppLogoIcon className="h-7 w-7 fill-current text-white" />
                            Marketplace Admin
                        </Link>

                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold tracking-[0.18em] text-orange-200 uppercase">
                                <KeyRound className="size-3.5" />
                                Account recovery
                            </div>
                            <div>
                                <h1 className="max-w-sm text-4xl leading-tight font-black tracking-[-0.05em] text-white">
                                    Get back to running your store.
                                </h1>
                                <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
                                    We’ll send a secure password reset link to
                                    the email address connected to your staff
                                    account.
                                </p>
                            </div>
                            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-200">
                                <Mail className="mt-0.5 size-5 shrink-0 text-orange-300" />
                                <span>
                                    For your security, the reset link is
                                    intended only for the staff account owner.
                                </span>
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
                                    Forgot your password?
                                </p>
                                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900 dark:text-white">
                                    Reset staff password
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Enter your staff account email and we’ll
                                    send you a link to choose a new password.
                                </p>
                            </div>

                            {status && (
                                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    {status}
                                </div>
                            )}

                            <Form {...email.form()} className="space-y-5">
                                {({ processing, errors }) => (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">
                                                Email address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoComplete="email"
                                                autoFocus
                                                placeholder="email@example.com"
                                                className="h-11 rounded-xl border-border bg-background/80 px-3.5"
                                            />
                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="h-11 w-full rounded-xl bg-slate-900 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 dark:bg-orange-500 dark:text-slate-950 dark:hover:bg-orange-400"
                                            disabled={processing}
                                            data-test="email-password-reset-link-button"
                                        >
                                            {processing && <Spinner />}
                                            Email password reset link
                                        </Button>

                                        <div className="text-center text-sm text-muted-foreground">
                                            Remembered your password?{' '}
                                            <Link
                                                href={login()}
                                                className="font-semibold text-orange-600 transition hover:text-orange-700 dark:text-orange-300 dark:hover:text-orange-200"
                                            >
                                                Back to staff login
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

ForgotPassword.layout = {
    title: '',
    description: '',
};
