import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function CustomerRegister() {
    return (
        <>
            <Head title="Create shopper account" />

            <header className="mb-7 space-y-2">
                <p className="text-sm font-medium text-primary">
                    Join our community
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Create your account
                </h1>
                <p className="text-sm text-muted-foreground">
                    Sign up for a simpler, more personal shopping experience.
                </p>
            </header>

            <Form
                action="/customer/register"
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
                className="space-y-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="customer-name">Full name</Label>
                            <Input
                                id="customer-name"
                                name="name"
                                autoComplete="name"
                                placeholder="Your name"
                                required
                                autoFocus
                            />
                            <InputError message={errors.name} />
                        </div>

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
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="customer-phone">
                                Phone number{' '}
                                <span className="text-muted-foreground">
                                    (optional)
                                </span>
                            </Label>
                            <Input
                                id="customer-phone"
                                name="phone"
                                type="tel"
                                autoComplete="tel"
                                placeholder="+880 1XXX-XXXXXX"
                            />
                            <InputError message={errors.phone} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="customer-password">Password</Label>
                            <PasswordInput
                                id="customer-password"
                                name="password"
                                autoComplete="new-password"
                                placeholder="Create a password"
                                required
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="customer-password-confirmation">
                                Confirm password
                            </Label>
                            <PasswordInput
                                id="customer-password-confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                placeholder="Enter your password again"
                                required
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-2 w-full"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Create account
                        </Button>
                    </>
                )}
            </Form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
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
