import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    status?: string;
};

export default function CustomerLogin({ status }: Props) {
    return (
        <>
            <Head title="Shopper sign in" />

            <header className="mb-7 space-y-2">
                <p className="text-sm font-medium text-primary">Welcome back</p>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Sign in to your account
                </h1>
                <p className="text-sm text-muted-foreground">
                    Access your orders, saved items, and account details.
                </p>
            </header>

            {status && (
                <p className="mb-5 rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground">
                    {status}
                </p>
            )}

            <Form
                action="/customer/login"
                method="post"
                resetOnSuccess={['password']}
                className="space-y-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="customer-email">
                                Email address
                            </Label>
                            <Input
                                id="customer-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                required
                                autoFocus
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="customer-password">
                                    Password
                                </Label>
                                <Link
                                    href="/customer/forgot-password"
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <PasswordInput
                                id="customer-password"
                                name="password"
                                autoComplete="current-password"
                                placeholder="Your password"
                                required
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox id="customer-remember" name="remember" />
                            <Label
                                htmlFor="customer-remember"
                                className="font-normal text-muted-foreground"
                            >
                                Remember me
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Sign in
                        </Button>
                    </>
                )}
            </Form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                New to our marketplace?{' '}
                <Link
                    href="/customer/register"
                    className="font-medium text-primary hover:underline"
                >
                    Create an account
                </Link>
            </p>
        </>
    );
}
