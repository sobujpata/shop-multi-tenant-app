import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    Clock3,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
} from 'lucide-react';

type ContactContent = {
    eyebrow: string;
    title: string;
    intro: string;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    address: string | null;
    business_hours: string | null;
    map_url: string | null;
};

function ContactCard({
    icon: Icon,
    title,
    children,
}: {
    icon: typeof Mail;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-border bg-card p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
            </span>
            <h2 className="mt-4 font-semibold">{title}</h2>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">
                {children}
            </div>
        </section>
    );
}

export default function Contact({ contact }: { contact: ContactContent }) {
    const whatsappNumber = contact.whatsapp?.replace(/\D/g, '');

    return (
        <>
            <Head title="Contact us" />
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
                <header className="relative isolate overflow-hidden rounded-[2rem] bg-[#17191f] px-6 py-12 text-white shadow-[0_24px_60px_rgba(18,24,35,0.18)] sm:px-10 sm:py-16 lg:px-14">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_35%,rgba(239,68,68,0.23),transparent_38%),radial-gradient(ellipse_at_10%_100%,rgba(59,130,246,0.13),transparent_38%),linear-gradient(135deg,#17191f,#252a34)]" />
                    <p className="text-xs font-semibold tracking-[0.2em] text-rose-300 uppercase">
                        {contact.eyebrow}
                    </p>
                    <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-black tracking-tight sm:text-5xl">
                        {contact.title}
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                        {contact.intro}
                    </p>
                </header>

                <div className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.65fr)] lg:py-16">
                    <div className="grid content-start gap-4 sm:grid-cols-2">
                        {contact.email && (
                            <ContactCard icon={Mail} title="Email us">
                                <a
                                    href={`mailto:${contact.email}`}
                                    className="font-medium break-all text-foreground underline-offset-4 hover:underline"
                                >
                                    {contact.email}
                                </a>
                            </ContactCard>
                        )}
                        {contact.phone && (
                            <ContactCard icon={Phone} title="Call us">
                                <a
                                    href={`tel:${contact.phone}`}
                                    className="font-medium text-foreground underline-offset-4 hover:underline"
                                >
                                    {contact.phone}
                                </a>
                            </ContactCard>
                        )}
                        {contact.whatsapp && whatsappNumber && (
                            <ContactCard icon={MessageCircle} title="WhatsApp">
                                <a
                                    href={`https://wa.me/${whatsappNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
                                >
                                    Message our team
                                    <ArrowUpRight className="size-3.5" />
                                </a>
                            </ContactCard>
                        )}
                        {contact.business_hours && (
                            <ContactCard icon={Clock3} title="Business hours">
                                <p className="whitespace-pre-line">
                                    {contact.business_hours}
                                </p>
                            </ContactCard>
                        )}
                    </div>

                    {(contact.address || contact.map_url) && (
                        <section className="h-fit rounded-2xl border border-border bg-card p-6">
                            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                                <MapPin className="size-5" />
                            </span>
                            <h2 className="mt-4 font-semibold">Visit us</h2>
                            {contact.address && (
                                <p className="mt-2 text-sm leading-6 whitespace-pre-line text-muted-foreground">
                                    {contact.address}
                                </p>
                            )}
                            {contact.map_url && (
                                <a
                                    href={contact.map_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
                                >
                                    View map
                                    <ArrowUpRight className="size-4" />
                                </a>
                            )}
                        </section>
                    )}
                </div>

                <div className="rounded-2xl bg-muted/70 p-6 text-center sm:p-8">
                    <p className="text-sm text-muted-foreground">
                        Looking for your next favorite find?
                    </p>
                    <Link
                        href="/shop"
                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary"
                    >
                        Explore the marketplace
                        <ArrowUpRight className="size-4" />
                    </Link>
                </div>
            </main>
        </>
    );
}
