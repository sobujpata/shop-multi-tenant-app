import { Form, Head } from '@inertiajs/react';
import { MapPin, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Address = {
    id: number;
    label: string;
    recipient_name: string;
    phone: string;
    address_line: string;
    division: string;
    district: string;
    upazila: string | null;
    postal_code: string | null;
    is_default: boolean;
};

type Props = {
    addresses: Address[];
    locations: LocationOption[];
};

type LocationOption = {
    division: string;
    district: string;
    upazila: string;
};

function AddressFields({
    address,
    errors,
    locations,
}: {
    address?: Address;
    errors: Record<string, string>;
    locations: LocationOption[];
}) {
    const [division, setDivision] = useState(address?.division ?? '');
    const [district, setDistrict] = useState(address?.district ?? '');
    const [upazila, setUpazila] = useState(address?.upazila ?? '');
    const divisions = [
        ...new Set(locations.map((location) => location.division)),
    ];
    const districts = [
        ...new Set(
            locations
                .filter((location) => location.division === division)
                .map((location) => location.district),
        ),
    ];
    const upazilas = [
        ...new Set(
            locations
                .filter(
                    (location) =>
                        location.division === division &&
                        location.district === district,
                )
                .map((location) => location.upazila),
        ),
    ];

    const fields = [
        {
            name: 'label',
            label: 'Label',
            value: address?.label,
            placeholder: 'Home',
        },
        {
            name: 'recipient_name',
            label: 'Recipient name',
            value: address?.recipient_name,
            placeholder: 'Full name',
        },
        {
            name: 'phone',
            label: 'Phone',
            value: address?.phone,
            placeholder: '+880 1XXX-XXXXXX',
        },
        {
            name: 'address_line',
            label: 'Street address',
            value: address?.address_line,
            placeholder: 'House, road, area',
        },
        {
            name: 'postal_code',
            label: 'Postcode (optional)',
            value: address?.postal_code ?? '',
            placeholder: 'Postcode',
        },
    ];

    return (
        <>
            {fields.slice(0, 4).map((field) => (
                <div key={field.name} className="grid gap-2">
                    <Label htmlFor={`${address?.id ?? 'new'}-${field.name}`}>
                        {field.label}
                    </Label>
                    <Input
                        id={`${address?.id ?? 'new'}-${field.name}`}
                        name={field.name}
                        defaultValue={field.value ?? ''}
                        placeholder={field.placeholder}
                        required={field.name !== 'postal_code'}
                    />
                    <InputError message={errors[field.name]} />
                </div>
            ))}
            <div className="grid gap-2">
                <Label htmlFor={`${address?.id ?? 'new'}-division`}>
                    Division
                </Label>
                <select
                    id={`${address?.id ?? 'new'}-division`}
                    name="division"
                    value={division}
                    onChange={(event) => {
                        setDivision(event.target.value);
                        setDistrict('');
                        setUpazila('');
                    }}
                    required
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                    <option value="">Select division</option>
                    {divisions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <InputError message={errors.division} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${address?.id ?? 'new'}-district`}>
                    District
                </Label>
                <select
                    id={`${address?.id ?? 'new'}-district`}
                    name="district"
                    value={district}
                    onChange={(event) => {
                        setDistrict(event.target.value);
                        setUpazila('');
                    }}
                    disabled={!division}
                    required
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                >
                    <option value="">Select district</option>
                    {districts.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <InputError message={errors.district} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${address?.id ?? 'new'}-upazila`}>
                    Upazila
                </Label>
                <select
                    id={`${address?.id ?? 'new'}-upazila`}
                    name="upazila"
                    value={upazila}
                    onChange={(event) => setUpazila(event.target.value)}
                    disabled={!district}
                    required
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                >
                    <option value="">Select upazila</option>
                    {upazilas.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <InputError message={errors.upazila} />
            </div>
            {fields.slice(4).map((field) => (
                <div key={field.name} className="grid gap-2">
                    <Label htmlFor={`${address?.id ?? 'new'}-${field.name}`}>
                        {field.label}
                    </Label>
                    <Input
                        id={`${address?.id ?? 'new'}-${field.name}`}
                        name={field.name}
                        defaultValue={field.value ?? ''}
                        placeholder={field.placeholder}
                        required={field.name !== 'postal_code'}
                    />
                    <InputError message={errors[field.name]} />
                </div>
            ))}
            <div className="flex items-center gap-2 sm:col-span-2">
                <input type="hidden" name="is_default" value="0" />
                <Checkbox
                    id={`${address?.id ?? 'new'}-is-default`}
                    name="is_default"
                    value="1"
                    defaultChecked={address?.is_default ?? false}
                />
                <Label htmlFor={`${address?.id ?? 'new'}-is-default`}>
                    Make this my default address
                </Label>
                <InputError message={errors.is_default} />
            </div>
        </>
    );
}

export default function CustomerAddresses({ addresses, locations }: Props) {
    return (
        <>
            <Head title="My addresses" />
            <div className="mb-8">
                <p className="text-sm font-medium text-primary">
                    Account settings
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    Addresses
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Keep your delivery details up to date.
                </p>
            </div>

            <section className="rounded-xl border bg-background p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-2">
                    <Plus className="size-4 text-primary" aria-hidden="true" />
                    <h3 className="font-semibold">Add a new address</h3>
                </div>
                <Form
                    action="/customer/account/addresses"
                    method="post"
                    className="grid gap-4 sm:grid-cols-2"
                >
                    {({ processing, errors }) => (
                        <>
                            <AddressFields
                                errors={errors}
                                locations={locations}
                            />
                            <div className="flex justify-end sm:col-span-2">
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Save address
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </section>

            <div className="mt-8 space-y-5">
                {addresses.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center">
                        <MapPin
                            className="mx-auto size-8 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <p className="mt-3 font-medium">
                            No saved addresses yet
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Add an address above to make checkout quicker.
                        </p>
                    </div>
                ) : (
                    addresses.map((address) => (
                        <article
                            key={address.id}
                            className="rounded-xl border bg-background p-5 sm:p-6"
                        >
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <MapPin
                                        className="size-4 text-primary"
                                        aria-hidden="true"
                                    />
                                    <h3 className="font-semibold">
                                        {address.label}
                                    </h3>
                                    {address.is_default && (
                                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                            Default
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {!address.is_default && (
                                        <Form
                                            action={`/customer/account/addresses/${address.id}/default`}
                                            method="put"
                                        >
                                            <Button
                                                type="submit"
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Star aria-hidden="true" />
                                                Set default
                                            </Button>
                                        </Form>
                                    )}
                                    <Form
                                        action={`/customer/account/addresses/${address.id}`}
                                        method="delete"
                                    >
                                        <Button
                                            type="submit"
                                            variant="outline"
                                            size="sm"
                                            aria-label={`Delete ${address.label} address`}
                                        >
                                            <Trash2 aria-hidden="true" />
                                        </Button>
                                    </Form>
                                </div>
                            </div>

                            <Form
                                action={`/customer/account/addresses/${address.id}`}
                                method="put"
                                className="grid gap-4 sm:grid-cols-2"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <AddressFields
                                            address={address}
                                            errors={errors}
                                            locations={locations}
                                        />
                                        <div className="flex justify-end sm:col-span-2">
                                            <Button
                                                type="submit"
                                                variant="secondary"
                                                disabled={processing}
                                            >
                                                {processing && <Spinner />}
                                                Update address
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </article>
                    ))
                )}
            </div>
        </>
    );
}
