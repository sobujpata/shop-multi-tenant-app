import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    status?: string;
};

export default function CustomerVerifyEmail({ status }: Props) {
    return (
        <>
            <Head title="Verify your email" />
            <header className="mb-7 space-y-2">
                <p className="text-sm font-medium text-primary">
                    One last step
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Verify your email
                </h1>
                <p className="text-sm text-muted-foreground">
                    We sent a verification link to your inbox. Open it to finish
                    setting up your shopper account.
                </p>
            </header>

            {status === 'verification-link-sent' && (
                <p className="mb-5 rounded-lg bg-primary/10 px-3 py-2 text-sm">
                    A new verification link has been sent to your email address.
                </p>
            )}

            <Form
                action="/customer/email/verification-notification"
                method="post"
            >
                {({ processing }) => (
                    <Button
                        type="submit"
                        variant="outline"
                        className="w-full"
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Resend verification email
                    </Button>
                )}
            </Form>

            <Form
                action="/customer/logout"
                method="post"
                className="mt-4 text-center"
            >
                {({ processing }) => (
                    <button
                        type="submit"
                        disabled={processing}
                        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                        Sign out
                    </button>
                )}
            </Form>
        </>
    );
}
