import { Head, Link } from '@inertiajs/react';
import { ArrowRight, HeartHandshake, Lightbulb, Store } from 'lucide-react';

type AboutContent = {
    eyebrow: string;
    title: string;
    intro: string;
    story_heading: string;
    story_body: string;
    mission_heading: string;
    mission_body: string;
    vision_heading: string;
    vision_body: string;
    values: Array<{ title: string; description: string }>;
};

export default function About({ about }: { about: AboutContent }) {
    return (
        <>
            <Head title="About us" />
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
                <header className="relative isolate overflow-hidden rounded-[2rem] bg-[#17191f] px-6 py-12 text-white shadow-[0_24px_60px_rgba(18,24,35,0.18)] sm:px-10 sm:py-16 lg:px-14">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_35%,rgba(239,68,68,0.23),transparent_38%),radial-gradient(ellipse_at_10%_100%,rgba(59,130,246,0.13),transparent_38%),linear-gradient(135deg,#17191f,#252a34)]" />
                    <div className="absolute -top-20 right-[-4rem] -z-10 size-72 rounded-full border border-white/10" />
                    <p className="text-xs font-semibold tracking-[0.2em] text-rose-300 uppercase">
                        {about.eyebrow}
                    </p>
                    <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-black tracking-tight sm:text-5xl">
                        {about.title}
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                        {about.intro}
                    </p>
                    <Link
                        href="/shop"
                        className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#17191f] transition hover:bg-rose-50"
                    >
                        Explore the marketplace
                        <ArrowRight className="size-4" />
                    </Link>
                </header>

                <section className="grid gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                            Our story
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                            {about.story_heading}
                        </h2>
                        <p className="mt-5 text-base leading-8 whitespace-pre-line text-muted-foreground">
                            {about.story_body}
                        </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-border bg-card p-6">
                            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                                <HeartHandshake className="size-5" />
                            </span>
                            <h3 className="mt-5 text-lg font-semibold">
                                {about.mission_heading}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                {about.mission_body}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-border bg-card p-6 sm:translate-y-8">
                            <span className="grid size-11 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Lightbulb className="size-5" />
                            </span>
                            <h3 className="mt-5 text-lg font-semibold">
                                {about.vision_heading}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                {about.vision_body}
                            </p>
                        </div>
                    </div>
                </section>

                {about.values.length > 0 && (
                    <section className="rounded-[2rem] bg-muted/70 px-6 py-10 sm:px-10 sm:py-12">
                        <div className="max-w-2xl">
                            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                                What matters to us
                            </p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Our values
                            </h2>
                        </div>
                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {about.values.map((value) => (
                                <article
                                    key={value.title}
                                    className="rounded-2xl border border-border/70 bg-card p-5"
                                >
                                    <Store className="size-5 text-primary" />
                                    <h3 className="mt-4 font-semibold">
                                        {value.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        {value.description}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </>
    );
}
