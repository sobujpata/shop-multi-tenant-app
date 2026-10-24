import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Store } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';
import { send } from '@/routes/verification';

type PageProps = {
    auth: Auth;
};

type TenantInfo = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    logo: string | null;
};

export default function Profile({
    mustVerifyEmail,
    status,
    tenant,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    tenant?: TenantInfo | null;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone number</Label>

                                <Input
                                    id="phone"
                                    type="tel"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.phone ?? ''}
                                    name="phone"
                                    autoComplete="tel"
                                    placeholder="Phone number"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.phone}
                                />
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here to re-send the
                                                verification email.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            {tenant && (
                <div className="mt-6 space-y-6 border-t pt-6">
                    <Heading
                        variant="small"
                        title="Store information"
                        description="Update your store's public name, contact email and phone number"
                    />

                    <Form
                        action="/settings/profile/tenant"
                        method="patch"
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="flex items-center gap-4">
                                    {tenant.logo ? (
                                        <img
                                            src={`/storage/${tenant.logo}`}
                                            alt={`${tenant.name} logo`}
                                            className="size-16 rounded-lg border border-border object-contain"
                                        />
                                    ) : (
                                        <div className="flex size-16 items-center justify-center rounded-lg border border-border text-muted-foreground">
                                            <Store
                                                className="size-7"
                                                aria-hidden="true"
                                            />
                                        </div>
                                    )}

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="tenant-logo"
                                            className="mb-0.5"
                                        >
                                            Store logo
                                        </Label>

                                        <Input
                                            id="tenant-logo"
                                            type="file"
                                            name="logo"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="max-w-sm"
                                        />

                                        <p className="text-xs text-muted-foreground">
                                            JPG, PNG, or WebP. Maximum file size
                                            2 MB.
                                        </p>
                                        <InputError
                                            className="mt-2"
                                            message={errors.logo}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tenant-name">
                                        Store name
                                    </Label>

                                    <Input
                                        id="tenant-name"
                                        className="mt-1 block w-full"
                                        defaultValue={tenant.name}
                                        name="name"
                                        required
                                        autoComplete="organization"
                                        placeholder="Store name"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tenant-email">
                                        Email address
                                    </Label>

                                    <Input
                                        id="tenant-email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={tenant.email}
                                        name="email"
                                        required
                                        autoComplete="email"
                                        placeholder="Store email address"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tenant-phone">
                                        Phone number
                                    </Label>

                                    <Input
                                        id="tenant-phone"
                                        type="tel"
                                        className="mt-1 block w-full"
                                        defaultValue={tenant.phone ?? ''}
                                        name="phone"
                                        autoComplete="tel"
                                        placeholder="Store phone number"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.phone}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-tenant-button"
                                    >
                                        Save
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            )}

            {auth.roles.includes('super-admin') && <DeleteUser />}
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
