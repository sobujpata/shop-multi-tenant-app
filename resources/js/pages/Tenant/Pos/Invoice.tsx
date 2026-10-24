import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { AdminPage, Panel } from '@/components/super-admin/admin-page';
import { imageUrl } from '@/components/storefront/types';

type InvoiceItem = {
    id: number;
    name: string;
    price: string | number;
    quantity: number;
    total: string;
};

type Invoice = {
    order_no: string;
    date: string | null;
    store: {
        name: string;
        email: string | null;
        phone: string | null;
        logo: string | null;
    };
    branch: {
        name: string;
        address: string;
        city: string;
        phone: string;
    };
    customer: {
        name: string;
        email: string;
        address: string | null;
    };
    items: InvoiceItem[];
    subtotal: string | number;
    discount: string | number;
    total: string | number;
    payment_method: string;
    paid: string;
    change: string;
};

function currency(value: string | number): string {
    return `Tk ${Number(value).toFixed(2)}`;
}

function paymentMethod(value: string): string {
    return (
        {
            cod: 'Cash',
            card: 'Card',
            bkash: 'bKash',
            nagad: 'Nagad',
        }[value] ?? value
    );
}

export default function PosInvoice({ invoice }: { invoice: Invoice }) {
    const date = invoice.date
        ? new Date(invoice.date).toISOString().slice(0, 10)
        : '';

    return (
        <>
            <Head title={`POS Invoice ${invoice.order_no}`} />
            <AdminPage
                title="POS invoice"
                description={`Invoice ${invoice.order_no}`}
                action={
                    <div className="flex gap-2" data-no-print>
                        <Link
                            href="/tenant/pos"
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold dark:border-slate-700"
                        >
                            <ArrowLeft className="size-4" /> Back to POS
                        </Link>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                            <Printer className="size-4" /> Print invoice
                        </button>
                    </div>
                }
            >
                <Panel>
                    <article
                        id="pos-invoice"
                        className="mx-auto max-w-3xl space-y-8 bg-white p-6 text-slate-900 sm:p-10"
                    >
                        <header className="flex flex-wrap justify-between gap-6 border-b border-slate-200 pb-6">
                            <div className="flex items-start gap-4">
                                {invoice.store.logo && (
                                    <img
                                        src={
                                            imageUrl(invoice.store.logo) ??
                                            undefined
                                        }
                                        alt=""
                                        className="max-h-16 max-w-24 object-contain"
                                    />
                                )}
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        {invoice.store.name}
                                    </h1>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {invoice.branch.name}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        {invoice.branch.address},{' '}
                                        {invoice.branch.city}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        {invoice.branch.phone}
                                    </p>
                                    {invoice.store.email && (
                                        <p className="text-sm text-slate-600">
                                            {invoice.store.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold tracking-wide">
                                    INVOICE
                                </p>
                                <p className="mt-2 text-sm text-slate-600">
                                    Invoice no.
                                </p>
                                <p className="font-semibold">
                                    {invoice.order_no}
                                </p>
                                <p className="mt-2 text-sm text-slate-600">
                                    Date: {date}
                                </p>
                            </div>
                        </header>

                        <section>
                            <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                                Billed to
                            </h2>
                            <p className="mt-2 font-semibold">
                                {invoice.customer.name}
                            </p>
                            <p className="text-sm text-slate-600">
                                {invoice.customer.email}
                            </p>
                            {invoice.customer.address && (
                                <p className="text-sm text-slate-600">
                                    {invoice.customer.address}
                                </p>
                            )}
                        </section>

                        <section className="overflow-x-auto">
                            <table className="w-full min-w-[500px] text-left text-sm">
                                <thead className="border-y border-slate-300 bg-slate-50 text-xs tracking-wide text-slate-600 uppercase">
                                    <tr>
                                        <th className="px-3 py-3">Item</th>
                                        <th className="px-3 py-3 text-right">
                                            Price
                                        </th>
                                        <th className="px-3 py-3 text-right">
                                            Qty
                                        </th>
                                        <th className="px-3 py-3 text-right">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {invoice.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-3 py-3">
                                                {item.name}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                {currency(item.price)}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                {item.quantity}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                {currency(item.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>

                        <section className="ml-auto max-w-xs space-y-2 text-sm">
                            <div className="flex justify-between gap-4">
                                <span>Subtotal</span>
                                <span>{currency(invoice.subtotal)}</span>
                            </div>
                            {Number(invoice.discount) > 0 && (
                                <div className="flex justify-between gap-4">
                                    <span>Discount</span>
                                    <span>-{currency(invoice.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between gap-4 border-t border-slate-300 pt-3 text-base font-bold">
                                <span>Total</span>
                                <span>{currency(invoice.total)}</span>
                            </div>
                            <div className="flex justify-between gap-4 pt-2">
                                <span>Payment</span>
                                <span>
                                    {paymentMethod(invoice.payment_method)}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span>Paid</span>
                                <span>{currency(invoice.paid)}</span>
                            </div>
                            {Number(invoice.change) > 0 && (
                                <div className="flex justify-between gap-4">
                                    <span>Change</span>
                                    <span>{currency(invoice.change)}</span>
                                </div>
                            )}
                        </section>

                        <footer className="border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
                            Thank you for shopping with us.
                        </footer>
                    </article>
                </Panel>
            </AdminPage>
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #pos-invoice, #pos-invoice * { visibility: visible !important; }
                    #pos-invoice {
                        position: absolute !important;
                        inset: 0 auto auto 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        padding: 12mm !important;
                    }
                    [data-no-print] { display: none !important; }
                    @page { margin: 8mm; size: A4; }
                }
            `}</style>
        </>
    );
}
