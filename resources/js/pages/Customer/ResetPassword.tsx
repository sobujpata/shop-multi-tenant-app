import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    email?: string;
    token: string;
};

export default function CustomerResetPassword({ email, token }: Props) {
    return (
        <>
            <Head title="Choose a new password" />
            <header className="mb-7 space-y-2">
                <p className="text-sm font-medium text-primary">
                    Account recovery
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Choose a new password
                </h1>
                <p className="text-sm text-muted-foreground">
                    Create a new password for your shopper account.
                </p>
            </header>

            <Form
                action="/customer/reset-password"
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
                className="space-y-5"
            >
                {({ processing, errors }) => (
                    <>
                        <input type="hidden" name="token" value={token} />
                        <div className="grid gap-2">
                            <Label htmlFor="customer-email">
                                Email address
                            </Label>
                            <Input
                                id="customer-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                defaultValue={email ?? ''}
                                required
                            />
                            <InputError message={errors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="customer-password">
                                New password
                            </Label>
                            <PasswordInput
                                id="customer-password"
                                name="password"
                                autoComplete="new-password"
                                required
                            />
                            <InputError message={errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="customer-password-confirmation">
                                Confirm new password
                            </Label>
                            <PasswordInput
                                id="customer-password-confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                required
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Update password
                        </Button>
                    </>
                )}
            </Form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link
                    href="/customer/login"
                    className="font-medium text-primary hover:underline"
                >
                    Return to sign in
                </Link>
            </p>
        </>
    );
}
