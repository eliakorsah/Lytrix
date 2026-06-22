"use client";

import Reveal from "./Reveal";

const services = [
  {
    n: "01",
    title: "Web Design & Development",
    desc: "Fast, responsive, conversion-focused websites built on modern stacks like Next.js — pixel-perfect on every screen.",
    tags: ["Next.js", "Responsive", "SEO"],
  },
  {
    n: "02",
    title: "Graphic Design",
    desc: "Logos, brand identities, social media kits and print — design that makes your brand impossible to ignore.",
    tags: ["Branding", "Social", "Print"],
  },
  {
    n: "03",
    title: "Video Ads",
    desc: "Scroll-stopping motion content and ad creatives engineered to grab attention and drive action.",
    tags: ["Motion", "Reels", "Promo"],
  },
  {
    n: "04",
    title: "Web POS Systems",
    desc: "Cloud point-of-sale systems for retail and hospitality — inventory, sales, receipts and reporting in one place.",
    tags: ["Inventory", "Cloud", "Reports"],
  },
  {
    n: "05",
    title: "SaaS Development",
    desc: "End-to-end SaaS products: auth, billing, dashboards and scalable backends — from idea to launch.",
    tags: ["Billing", "Dashboards", "Scale"],
  },
  {
    n: "06",
    title: "Brand Strategy",
    desc: "Positioning, messaging and visual systems that give your business a clear, confident voice.",
    tags: ["Identity", "Voice", "Systems"],
  },
];

export default function Services() {
  return (
    <section id="services" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl container-px">
        <Reveal>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-brand">
            What we do
          </p>
        </Reveal>
        <Reveal delay={1}>
          <h2 className="max-w-3xl font-display font-bold text-fluid-section">
            One studio for everything your{" "}
            <span className="text-gradient">brand</span> needs.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.n} delay={i}>
              <article className="group relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-brand/50 hover:shadow-lg">
                <div className="absolute inset-0 -z-10 bg-brand-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-[0.05]" />
                <span className="font-display text-sm font-semibold text-slate-300">
                  {s.n}
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-slate-900 sm:text-2xl">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {s.desc}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {s.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
