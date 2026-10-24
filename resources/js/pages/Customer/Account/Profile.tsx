import { Form, Head } from '@inertiajs/react';
import { Camera, UserRound } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type ProfileData = {
    name: string;
    email: string;
    phone: string | null;
    gender: 'male' | 'female' | 'other' | null;
    date_of_birth: string | null;
    bio: string | null;
    preferred_language: string;
    newsletter_opt_in: boolean;
};

type Props = {
    profile: ProfileData;
    avatarUrl: string | null;
};

const fieldClassName =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

export default function CustomerProfile({ profile, avatarUrl }: Props) {
    return (
        <>
            <Head title="My profile" />
            <div className="mb-8">
                <p className="text-sm font-medium text-primary">
                    Account settings
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    Profile
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Update your contact information and shopping preferences.
                </p>
            </div>

            <Form
                action="/customer/account/profile"
                method="post"
                resetOnSuccess={['avatar']}
                className="space-y-8"
            >
                {({ processing, errors }) => (
                    <>
                        <input type="hidden" name="_method" value="put" />
                        <div className="flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-center">
                            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={`${profile.name}'s profile`}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <UserRound
                                        className="size-8 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="profile-avatar">
                                    Profile photo
                                </Label>
                                <Input
                                    id="profile-avatar"
                                    name="avatar"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="max-w-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                    JPG, PNG, or WebP. Maximum file size 2 MB.
                                </p>
                                <InputError message={errors.avatar} />
                            </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="profile-name">Full name</Label>
                                <Input
                                    id="profile-name"
                                    name="name"
                                    defaultValue={profile.name}
                                    autoComplete="name"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="profile-email">
                                    Email address
                                </Label>
                                <Input
                                    id="profile-email"
                                    name="email"
                                    type="email"
                                    defaultValue={profile.email}
                                    autoComplete="email"
                                    required
                                />
                                <InputError message={errors.email} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="profile-phone">Phone</Label>
                                <Input
                                    id="profile-phone"
                                    name="phone"
                                    type="tel"
                                    defaultValue={profile.phone ?? ''}
                                    autoComplete="tel"
                                />
                                <InputError message={errors.phone} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="profile-gender">Gender</Label>
                                <select
                                    id="profile-gender"
                                    name="gender"
                                    defaultValue={profile.gender ?? ''}
                                    className={fieldClassName}
                                >
                                    <option value="">Prefer not to say</option>
                                    <option value="female">Female</option>
                                    <option value="male">Male</option>
                                    <option value="other">Other</option>
                                </select>
                                <InputError message={errors.gender} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="profile-date-of-birth">
                                    Date of birth
                                </Label>
                                <Input
                                    id="profile-date-of-birth"
                                    name="date_of_birth"
                                    type="date"
                                    defaultValue={
                                        profile.date_of_birth?.slice(0, 10) ??
                                        ''
                                    }
                                />
                                <InputError message={errors.date_of_birth} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="profile-language">
                                    Preferred language
                                </Label>
                                <Input
                                    id="profile-language"
                                    name="preferred_language"
                                    defaultValue={profile.preferred_language}
                                    maxLength={10}
                                    required
                                />
                                <InputError
                                    message={errors.preferred_language}
                                />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="profile-bio">About you</Label>
                                <textarea
                                    id="profile-bio"
                                    name="bio"
                                    defaultValue={profile.bio ?? ''}
                                    rows={4}
                                    maxLength={2000}
                                    className={`${fieldClassName} h-auto resize-y`}
                                />
                                <InputError message={errors.bio} />
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <input
                                type="hidden"
                                name="newsletter_opt_in"
                                value="0"
                            />
                            <Checkbox
                                id="newsletter-opt-in"
                                name="newsletter_opt_in"
                                value="1"
                                defaultChecked={profile.newsletter_opt_in}
                            />
                            <div className="grid gap-1">
                                <Label htmlFor="newsletter-opt-in">
                                    Email me about offers and new arrivals
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    You can change this preference at any time.
                                </p>
                                <InputError
                                    message={errors.newsletter_opt_in}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end border-t pt-6">
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <Spinner />
                                ) : (
                                    <Camera aria-hidden="true" />
                                )}
                                Save profile
                            </Button>
                        </div>
                    </>
                )}
            </Form>

            <div className="mt-10 border-t pt-8">
                <h3 className="text-lg font-semibold">Change password</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Choose a strong password you do not use elsewhere.
                </p>
                <Form
                    action="/customer/account/password"
                    method="put"
                    resetOnSuccess={[
                        'current_password',
                        'password',
                        'password_confirmation',
                    ]}
                    className="mt-5 grid gap-5 sm:grid-cols-2"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="current-password">
                                    Current password
                                </Label>
                                <PasswordInput
                                    id="current-password"
                                    name="current_password"
                                    autoComplete="current-password"
                                    required
                                />
                                <InputError message={errors.current_password} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new-password">
                                    New password
                                </Label>
                                <PasswordInput
                                    id="new-password"
                                    name="password"
                                    autoComplete="new-password"
                                    required
                                />
                                <InputError message={errors.password} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirm-password">
                                    Confirm new password
                                </Label>
                                <PasswordInput
                                    id="confirm-password"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                            <div className="flex justify-end sm:col-span-2">
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Update password
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
