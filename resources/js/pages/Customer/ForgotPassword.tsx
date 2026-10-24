import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    status?: string;
};

export default function CustomerForgotPassword({ status }: Props) {
    return (
        <>
            <Head title="Reset shopper password" />
            <header className="mb-7 space-y-2">
                <p className="text-sm font-medium text-primary">
                    Account recovery
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Forgot your password?
                </h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email and we’ll send you a link to reset it.
                </p>
            </header>

            {status && (
                <p className="mb-5 rounded-lg bg-primary/10 px-3 py-2 text-sm">
                    {status}
                </p>
            )}

            <Form
                action="/customer/forgot-password"
                method="post"
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
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Send reset link
                        </Button>
                    </>
                )}
            </Form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                Remembered your password?{' '}
                <Link
                    href="/customer/login"
                    className="font-medium text-primary hover:underline"
                >
                    Sign in
                </Link>
            </p>
        </>
    );
}
