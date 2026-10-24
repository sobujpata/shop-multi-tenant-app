import { Head, Link, useForm } from '@inertiajs/react';
import { Check, MapPin, PackageCheck, WalletCards } from 'lucide-react';
import { useState } from 'react';
import type { CartPayload } from '@/components/storefront/CartDrawer';
import InputError from '@/components/input-error';
import { imageUrl, money } from '@/components/storefront/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

type CheckoutData = {
    address_id: string;
    label: string;
    recipient_name: string;
    phone: string;
    address_line: string;
    division: string;
    district: string;
    upazila: string;
    postal_code: string;
    payment_method: 'cod';
    coupon_code: string;
    delivery_cost_ids: Record<string, string>;
};

type DeliveryArea = {
    id: number;
    branch_id: number;
    area: string;
    cost: string | number;
};

type LocationOption = {
    division: string;
    district: string;
    upazila: string;
};

const steps = ['Review cart', 'Delivery address', 'Payment', 'Confirm'];
const methods: Array<{
    id: CheckoutData['payment_method'];
    label: string;
    detail: string;
}> = [
    {
        id: 'cod',
        label: 'Cash on delivery',
        detail: 'Pay when your order arrives',
    },
    // { id: 'card', label: 'Card', detail: 'Pay securely by card' },
    // { id: 'bkash', label: 'bKash', detail: 'Pay with your bKash account' },
    // { id: 'nagad', label: 'Nagad', detail: 'Pay with your Nagad account' },
];

export default function CheckoutIndex({
    cart,
    addresses,
    deliveryAreas,
    locations,
}: {
    cart: CartPayload;
    addresses: Address[];
    deliveryAreas: Record<number, DeliveryArea[]>;
    locations: LocationOption[];
}) {
    const defaultAddress = addresses.find((address) => address.is_default);
    const form = useForm<CheckoutData>({
        address_id: defaultAddress ? String(defaultAddress.id) : '',
        label: 'Home',
        recipient_name: '',
        phone: '',
        address_line: '',
        division: '',
        district: '',
        upazila: '',
        postal_code: '',
        payment_method: 'cod',
        coupon_code: '',
        delivery_cost_ids: {},
    });
    const [step, setStep] = useState(0);
    const [addressError, setAddressError] = useState<string | null>(null);
    const formErrors = form.errors as Record<string, string | undefined>;
    const cartBranches = Array.from(
        new Map(
            cart.items.map((item) => [
                item.branch_id,
                { id: item.branch_id, name: item.branch ?? 'Store' },
            ]),
        ).values(),
    );
    const selectedAddress = addresses.find(
        (address) => String(address.id) === form.data.address_id,
    );
    const divisions = [
        ...new Set(locations.map((location) => location.division)),
    ];
    const districts = [
        ...new Set(
            locations
                .filter((location) => location.division === form.data.division)
                .map((location) => location.district),
        ),
    ];
    const upazilas = [
        ...new Set(
            locations
                .filter(
                    (location) =>
                        location.division === form.data.division &&
                        location.district === form.data.district,
                )
                .map((location) => location.upazila),
        ),
    ];
    const newAddressComplete = [
        form.data.recipient_name,
        form.data.phone,
        form.data.address_line,
        form.data.division,
        form.data.district,
        form.data.upazila,
    ].every((value) => value.trim() !== '');

    function nextStep() {
        if (step === 1 && !form.data.address_id && !newAddressComplete) {
            setAddressError(
                'Complete the required address details to continue.',
            );
            return;
        }

        if (
            step === 1 &&
            cartBranches.some(
                (branch) => !form.data.delivery_cost_ids[String(branch.id)],
            )
        ) {
            form.setError(
                'delivery_cost_ids',
                'Choose a delivery area for every branch in your cart.',
            );
            return;
        }

        form.clearErrors('delivery_cost_ids');
        setAddressError(null);
        setStep((current) => Math.min(current + 1, steps.length - 1));
    }

    function previousStep() {
        setAddressError(null);
        setStep((current) => Math.max(current - 1, 0));
    }

    const addressSummary = selectedAddress
        ? `${selectedAddress.recipient_name}, ${selectedAddress.address_line}, ${selectedAddress.division}, ${selectedAddress.district}, ${selectedAddress.upazila ?? ''}`
        : `${form.data.recipient_name}, ${form.data.address_line}, ${form.data.division}, ${form.data.district}, ${form.data.upazila}`;
    const paymentLabel = methods.find(
        (method) => method.id === form.data.payment_method,
    )?.label;
    const selectedDeliveryCost = (branchId: number) =>
        deliveryAreas[branchId]?.find(
            (area) =>
                String(area.id) ===
                form.data.delivery_cost_ids[String(branchId)],
        );
    const shippingFee = cartBranches.reduce(
        (total, branch) =>
            total + Number(selectedDeliveryCost(branch.id)?.cost ?? 0),
        0,
    );

    return (
        <>
            <Head title="Checkout" />
            <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
                <Link
                    href="/cart"
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    Back to cart
                </Link>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    Checkout
                </h1>
                <ol className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {steps.map((label, index) => (
                        <li key={label} className="flex items-center gap-2">
                            <span
                                className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${step >= index ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                            >
                                {step > index ? (
                                    <Check className="size-4" />
                                ) : (
                                    index + 1
                                )}
                            </span>
                            <span
                                className={`text-xs font-medium sm:text-sm ${step === index ? 'text-foreground' : 'text-muted-foreground'}`}
                            >
                                {label}
                            </span>
                        </li>
                    ))}
                </ol>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (step === steps.length - 1) {
                            form.post('/customer/checkout', {
                                preserveScroll: true,
                                onError: (errors) => {
                                    if (errors.coupon_code) {
                                        setStep(0);
                                    } else if (
                                        errors.address_id ||
                                        errors.recipient_name ||
                                        errors.phone ||
                                        errors.address_line ||
                                        errors.division ||
                                        errors.district ||
                                        errors.upazila
                                    ) {
                                        setStep(1);
                                    } else if (errors.payment_method) {
                                        setStep(2);
                                    } else {
                                        setStep(0);
                                    }
                                },
                            });
                        }
                    }}
                    className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"
                >
                    <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
                        <p className="text-xs font-semibold tracking-[0.15em] text-primary uppercase">
                            Step {step + 1} of 4
                        </p>
                        <h2 className="mt-2 text-xl font-semibold">
                            {steps[step]}
                        </h2>

                        {step === 0 && (
                            <div className="mt-6">
                                <ul className="divide-y divide-border">
                                    {cart.items.map((item) => (
                                        <li
                                            key={item.id}
                                            className="flex gap-4 py-4 first:pt-0"
                                        >
                                            <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                                                {item.product.image && (
                                                    <img
                                                        src={
                                                            imageUrl(
                                                                item.product
                                                                    .image,
                                                            ) ?? undefined
                                                        }
                                                        alt={item.product.name}
                                                        className="size-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium">
                                                    {item.product.name}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {item.branch} ·{' '}
                                                    {[
                                                        item.variant.color,
                                                        item.variant.size,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}{' '}
                                                    · Qty {item.quantity}
                                                </p>
                                            </div>
                                            <p className="font-semibold">
                                                {money(item.line_total)}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6 max-w-sm">
                                    <Label htmlFor="coupon_code">
                                        Coupon code
                                    </Label>
                                    <Input
                                        id="coupon_code"
                                        value={form.data.coupon_code}
                                        onChange={(event) =>
                                            form.setData(
                                                'coupon_code',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2"
                                        placeholder="Enter a coupon"
                                    />
                                    <InputError
                                        message={form.errors.coupon_code}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="mt-6 space-y-3">
                                {addresses.map((address) => (
                                    <label
                                        key={address.id}
                                        className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${form.data.address_id === String(address.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                                    >
                                        <input
                                            type="radio"
                                            name="address_id"
                                            value={address.id}
                                            checked={
                                                form.data.address_id ===
                                                String(address.id)
                                            }
                                            onChange={() =>
                                                form.setData(
                                                    'address_id',
                                                    String(address.id),
                                                )
                                            }
                                            className="mt-1 accent-primary"
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center gap-2 font-medium">
                                                {address.label}
                                                {address.is_default && (
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                                        Default
                                                    </span>
                                                )}
                                            </span>
                                            <span className="mt-1 block text-sm text-muted-foreground">
                                                {address.recipient_name} ·{' '}
                                                {address.phone}
                                            </span>
                                            <span className="mt-1 block text-sm text-muted-foreground">
                                                {address.address_line},{' '}
                                                {address.division},{' '}
                                                {address.district}{' '}
                                                {address.upazila}{' '}
                                                {address.postal_code}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                                <label
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${form.data.address_id === '' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                                >
                                    <input
                                        type="radio"
                                        name="address_id"
                                        value=""
                                        checked={form.data.address_id === ''}
                                        onChange={() =>
                                            form.setData('address_id', '')
                                        }
                                        className="accent-primary"
                                    />
                                    <span className="flex items-center gap-2 font-medium">
                                        <MapPin className="size-4 text-primary" />{' '}
                                        Add a new address
                                    </span>
                                </label>
                                {!form.data.address_id && (
                                    <div className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
                                        {(
                                            [
                                                [
                                                    'label',
                                                    'Address label',
                                                    'Home',
                                                ],
                                                [
                                                    'recipient_name',
                                                    'Recipient name',
                                                    'Full name',
                                                ],
                                                [
                                                    'phone',
                                                    'Phone number',
                                                    '+880 1XXX-XXXXXX',
                                                ],
                                                [
                                                    'address_line',
                                                    'Street address',
                                                    'House, road, area',
                                                ],
                                                [
                                                    'postal_code',
                                                    'Postcode (optional)',
                                                    'Postcode',
                                                ],
                                            ] as const
                                        ).map(([key, label, placeholder]) => (
                                            <div
                                                key={key}
                                                className="grid gap-2"
                                            >
                                                <Label
                                                    htmlFor={`checkout-${key}`}
                                                >
                                                    {label}
                                                </Label>
                                                <Input
                                                    id={`checkout-${key}`}
                                                    value={form.data[key]}
                                                    onChange={(event) =>
                                                        form.setData(
                                                            key,
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder={placeholder}
                                                />
                                                <InputError
                                                    message={form.errors[key]}
                                                />
                                            </div>
                                        ))}
                                        {(
                                            [
                                                [
                                                    'division',
                                                    'Division',
                                                    divisions,
                                                ],
                                                [
                                                    'district',
                                                    'District',
                                                    districts,
                                                ],
                                                [
                                                    'upazila',
                                                    'Upazila',
                                                    upazilas,
                                                ],
                                            ] as const
                                        ).map(([key, label, options]) => (
                                            <div
                                                key={key}
                                                className="grid gap-2"
                                            >
                                                <Label
                                                    htmlFor={`checkout-${key}`}
                                                >
                                                    {label}
                                                </Label>
                                                <select
                                                    id={`checkout-${key}`}
                                                    value={form.data[key]}
                                                    onChange={(event) => {
                                                        form.setData(
                                                            key,
                                                            event.target.value,
                                                        );
                                                        if (
                                                            key === 'division'
                                                        ) {
                                                            form.setData(
                                                                'district',
                                                                '',
                                                            );
                                                            form.setData(
                                                                'upazila',
                                                                '',
                                                            );
                                                        } else if (
                                                            key === 'district'
                                                        ) {
                                                            form.setData(
                                                                'upazila',
                                                                '',
                                                            );
                                                        }
                                                    }}
                                                    disabled={
                                                        (key === 'district' &&
                                                            !form.data
                                                                .division) ||
                                                        (key === 'upazila' &&
                                                            !form.data.district)
                                                    }
                                                    required
                                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                                                >
                                                    <option value="">
                                                        Select{' '}
                                                        {label.toLowerCase()}
                                                    </option>
                                                    {options.map((option) => (
                                                        <option
                                                            key={option}
                                                            value={option}
                                                        >
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError
                                                    message={form.errors[key]}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <InputError message={form.errors.address_id} />
                                {addressError && (
                                    <p
                                        role="alert"
                                        className="text-sm text-destructive"
                                    >
                                        {addressError}
                                    </p>
                                )}
                                <div className="mt-6 space-y-5">
                                    <h3 className="font-semibold">
                                        Delivery area and cost
                                    </h3>
                                    {cartBranches.map((branch) => {
                                        const areas =
                                            deliveryAreas[branch.id] ?? [];

                                        return (
                                            <fieldset
                                                key={branch.id}
                                                className="space-y-3"
                                            >
                                                <legend className="text-sm font-medium">
                                                    {branch.name}
                                                </legend>
                                                {areas.length > 0 ? (
                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        {areas.map((area) => (
                                                            <label
                                                                key={area.id}
                                                                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${form.data.delivery_cost_ids[String(branch.id)] === String(area.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name={`delivery_cost_${branch.id}`}
                                                                    value={
                                                                        area.id
                                                                    }
                                                                    checked={
                                                                        form
                                                                            .data
                                                                            .delivery_cost_ids[
                                                                            String(
                                                                                branch.id,
                                                                            )
                                                                        ] ===
                                                                        String(
                                                                            area.id,
                                                                        )
                                                                    }
                                                                    onChange={() => {
                                                                        form.setData(
                                                                            'delivery_cost_ids',
                                                                            {
                                                                                ...form
                                                                                    .data
                                                                                    .delivery_cost_ids,
                                                                                [String(
                                                                                    branch.id,
                                                                                )]:
                                                                                    String(
                                                                                        area.id,
                                                                                    ),
                                                                            },
                                                                        );
                                                                        form.clearErrors(
                                                                            'delivery_cost_ids',
                                                                        );
                                                                    }}
                                                                    className="accent-primary"
                                                                />
                                                                <span>
                                                                    <span className="block font-medium">
                                                                        {
                                                                            area.area
                                                                        }
                                                                    </span>
                                                                    <span className="mt-1 block text-sm text-muted-foreground">
                                                                        {money(
                                                                            area.cost,
                                                                        )}
                                                                    </span>
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-destructive">
                                                        This branch has no
                                                        delivery areas
                                                        configured.
                                                    </p>
                                                )}
                                                <InputError
                                                    message={
                                                        formErrors[
                                                            `delivery_cost_ids.${branch.id}`
                                                        ]
                                                    }
                                                />
                                            </fieldset>
                                        );
                                    })}
                                    <InputError
                                        message={formErrors.delivery_cost_ids}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <fieldset className="mt-6 space-y-3">
                                <legend className="sr-only">
                                    Choose payment method
                                </legend>
                                {methods.map((method) => (
                                    <label
                                        key={method.id}
                                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${form.data.payment_method === method.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value={method.id}
                                            checked={
                                                form.data.payment_method ===
                                                method.id
                                            }
                                            onChange={() =>
                                                form.setData(
                                                    'payment_method',
                                                    method.id,
                                                )
                                            }
                                            className="accent-primary"
                                        />
                                        <WalletCards className="size-5 text-primary" />
                                        <span>
                                            <span className="block font-medium">
                                                {method.label}
                                            </span>
                                            <span className="mt-1 block text-sm text-muted-foreground">
                                                {method.detail}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                                <InputError
                                    message={form.errors.payment_method}
                                />
                            </fieldset>
                        )}

                        {step === 3 && (
                            <div className="mt-6 space-y-4">
                                <div className="rounded-xl bg-muted/50 p-4">
                                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Deliver to
                                    </p>
                                    <p className="mt-2 font-medium">
                                        {selectedAddress?.label ??
                                            form.data.label}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {addressSummary}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {selectedAddress?.phone ??
                                            form.data.phone}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-muted/50 p-4">
                                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Delivery areas
                                    </p>
                                    {cartBranches.map((branch) => {
                                        const area = selectedDeliveryCost(
                                            branch.id,
                                        );

                                        return (
                                            <p
                                                key={branch.id}
                                                className="mt-2 flex justify-between gap-3 text-sm"
                                            >
                                                <span>
                                                    {branch.name}: {area?.area}
                                                </span>
                                                <span>{money(area?.cost)}</span>
                                            </p>
                                        );
                                    })}
                                </div>
                                <div className="rounded-xl bg-muted/50 p-4">
                                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Payment
                                    </p>
                                    <p className="mt-2 font-medium">
                                        {paymentLabel}
                                    </p>
                                    {form.data.coupon_code && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Coupon: {form.data.coupon_code}
                                        </p>
                                    )}
                                </div>
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <PackageCheck className="size-4 text-primary" />{' '}
                                    Stock is rechecked before your order is
                                    placed.
                                </p>
                            </div>
                        )}

                        {(formErrors.cart || formErrors.message) && (
                            <p
                                role="alert"
                                className="mt-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
                            >
                                {formErrors.cart ?? formErrors.message}
                            </p>
                        )}
                        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
                            <button
                                type="button"
                                onClick={previousStep}
                                disabled={step === 0}
                                className="h-11 rounded-full border border-border px-5 text-sm font-semibold disabled:opacity-40"
                            >
                                Back
                            </button>
                            {step < steps.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
                                >
                                    Continue
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                                >
                                    {form.processing
                                        ? 'Placing order…'
                                        : 'Place order'}
                                </button>
                            )}
                        </div>
                    </section>

                    <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-28">
                        <h2 className="text-lg font-semibold">Order summary</h2>
                        <div className="mt-5 space-y-3">
                            {cart.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between gap-3 text-sm"
                                >
                                    <span className="text-muted-foreground">
                                        {item.product.name} × {item.quantity}
                                    </span>
                                    <span className="shrink-0">
                                        {money(item.line_total)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 flex justify-between border-t border-border pt-4 font-semibold">
                            <span>Subtotal</span>
                            <span>{money(cart.subtotal)}</span>
                        </div>
                        <div className="mt-3 flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Delivery cost
                            </span>
                            <span>{money(shippingFee)}</span>
                        </div>
                        <div className="mt-3 flex justify-between border-t border-border pt-4 font-semibold">
                            <span>Total</span>
                            <span>
                                {money(Number(cart.subtotal) + shippingFee)}
                            </span>
                        </div>
                    </aside>
                </form>
            </div>
        </>
    );
}
