import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, FileText } from 'lucide-react';

type LegalPageContent = {
    slug: string;
    title: string;
    intro: string;
    content: string;
};

export default function LegalShow({
    legalPage,
}: {
    legalPage: LegalPageContent;
}) {
    const paragraphs = legalPage.content
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    return (
        <>
            <Head title={legalPage.title} />
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
                <header className="relative isolate overflow-hidden rounded-[2rem] bg-[#17191f] px-6 py-12 text-white shadow-[0_24px_60px_rgba(18,24,35,0.18)] sm:px-10 sm:py-16 lg:px-14">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_35%,rgba(239,68,68,0.23),transparent_38%),radial-gradient(ellipse_at_10%_100%,rgba(59,130,246,0.13),transparent_38%),linear-gradient(135deg,#17191f,#252a34)]" />
                    <div className="absolute -top-20 right-[-4rem] -z-10 size-72 rounded-full border border-white/10" />
                    <p className="text-xs font-semibold tracking-[0.2em] text-rose-300 uppercase">
                        Marketplace information
                    </p>
                    <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-black tracking-tight sm:text-5xl">
                        {legalPage.title}
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                        {legalPage.intro}
                    </p>
                    <Link
                        href="/"
                        className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#17191f] transition hover:bg-rose-50"
                    >
                        <ArrowLeft className="size-4" />
                        Back to marketplace
                    </Link>
                </header>

                <section className="grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:py-16">
                    <article className="rounded-[1.75rem] border border-border bg-card px-6 py-8 shadow-sm sm:px-10 sm:py-10">
                        <div className="mb-7 flex items-center gap-3 border-b border-border pb-6">
                            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                                <FileText className="size-5" />
                            </span>
                            <div>
                                <p className="font-semibold">
                                    {legalPage.title}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Marketplace policy
                                </p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {paragraphs.map((paragraph, index) => {
                                const [firstLine, ...remainingLines] =
                                    paragraph.split('\n');
                                const hasHeading =
                                    remainingLines.length > 0 &&
                                    firstLine.length <= 100;

                                return (
                                    <section
                                        key={`${index}-${firstLine}`}
                                        className="space-y-2"
                                    >
                                        {hasHeading && (
                                            <h2 className="text-lg font-semibold tracking-tight">
                                                {firstLine}
                                            </h2>
                                        )}
                                        <p className="text-sm leading-7 whitespace-pre-line text-muted-foreground sm:text-base">
                                            {hasHeading
                                                ? remainingLines.join('\n')
                                                : paragraph}
                                        </p>
                                    </section>
                                );
                            })}
                        </div>
                    </article>

                    <aside className="h-fit rounded-[1.75rem] bg-muted/70 p-6 sm:p-7">
                        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                            Need clarification?
                        </p>
                        <h2 className="mt-3 text-xl font-semibold tracking-tight">
                            We’re here to help.
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Contact our team if you have questions about this
                            policy.
                        </p>
                        <Link
                            href="/contact"
                            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
                        >
                            Contact us
                            <ArrowUpRight className="size-4" />
                        </Link>
                    </aside>
                </section>
            </main>
        </>
    );
}
