import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    CircleHelp,
    MessageCircleQuestion,
} from 'lucide-react';

const faqs = [
    {
        question: 'How do I find a product?',
        answer: 'Browse the shop, open a category from the menu, or search by product name.',
    },
    {
        question: 'How do I save products for later?',
        answer: 'Sign in and use the wishlist button on a product to save it to your account.',
    },
    {
        question: 'Where can I check my order status?',
        answer: 'Sign in and open Orders in your customer account to view order and delivery updates.',
    },
    {
        question: 'Which payment methods can I use?',
        answer: 'Available payment methods are shown during checkout.',
    },
];

export default function Faq() {
    return (
        <>
            <Head title="Help & FAQ" />
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
                <header className="relative isolate overflow-hidden rounded-[2rem] bg-[#17191f] px-6 py-12 text-white shadow-[0_24px_60px_rgba(18,24,35,0.18)] sm:px-10 sm:py-16 lg:px-14">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_35%,rgba(239,68,68,0.23),transparent_38%),radial-gradient(ellipse_at_10%_100%,rgba(59,130,246,0.13),transparent_38%),linear-gradient(135deg,#17191f,#252a34)]" />
                    <div className="absolute -top-20 right-[-4rem] -z-10 size-72 rounded-full border border-white/10" />
                    <p className="text-xs font-semibold tracking-[0.2em] text-rose-300 uppercase">
                        Here to help
                    </p>
                    <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-black tracking-tight sm:text-5xl">
                        Help & frequently asked questions
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                        Find quick answers about discovering products, managing
                        your account, orders, and payment.
                    </p>
                    <Link
                        href="/contact"
                        className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#17191f] transition hover:bg-rose-50"
                    >
                        Contact our team
                        <ArrowRight className="size-4" />
                    </Link>
                </header>

                <section className="py-14 sm:py-20">
                    <div className="mb-8 max-w-2xl">
                        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                            Common questions
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                            How can we help?
                        </h2>
                        <p className="mt-4 text-base leading-7 text-muted-foreground">
                            A few helpful answers to make your marketplace
                            experience simple and smooth.
                        </p>
                    </div>
                    <div
                        aria-label="Frequently asked questions"
                        className="grid gap-4 sm:grid-cols-2"
                    >
                        {faqs.map(({ question, answer }, index) => (
                            <article
                                key={question}
                                className="group rounded-2xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-7"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                                        <MessageCircleQuestion
                                            className="size-5"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <span className="text-sm font-semibold tracking-wider text-muted-foreground/60">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                </div>
                                <h3 className="mt-5 text-lg font-semibold tracking-tight">
                                    {question}
                                </h3>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                    {answer}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="rounded-[2rem] bg-muted/70 px-6 py-9 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-10 sm:py-10">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                            Still need a hand?
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                            We’re happy to help.
                        </h2>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                            Get in touch with our team, or continue exploring
                            the marketplace.
                        </p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3 sm:mt-0">
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                        >
                            Contact us
                            <ArrowUpRight className="size-4" />
                        </Link>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary/40 hover:text-primary"
                        >
                            Visit the shop
                            <CircleHelp className="size-4" />
                        </Link>
                    </div>
                </section>
            </main>
        </>
    );
}
