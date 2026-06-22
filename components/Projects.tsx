"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Reveal from "./Reveal";

type Project = {
  name: string;
  category: string;
  desc: string;
  url: string;
  image: string;
  tags: string[];
};

const projects: Project[] = [
  {
    name: "Intelet Electropoint",
    category: "E-commerce",
    desc: "Online store for electronics & security products — product catalog, cart and checkout.",
    url: "https://www.inteletelectropoint.com/",
    image: "/projects/intelet.png",
    tags: ["E-commerce", "Catalog", "Checkout"],
  },
  {
    name: "JDY Traders",
    category: "E-commerce",
    desc: "Trading & retail storefront built for fast browsing and a smooth buying experience.",
    url: "https://www.jdytraders.com/",
    image: "/projects/jdy.png",
    tags: ["E-commerce", "Retail", "Responsive"],
  },
  {
    name: "Wagent Africa",
    category: "SaaS",
    desc: "A full SaaS platform — accounts, dashboards and tooling delivered end to end.",
    url: "https://www.wagent-africa.com/",
    image: "/projects/wagent.png",
    tags: ["SaaS", "Dashboard", "Platform"],
  },
];

export default function Projects() {
  return (
    <section id="projects" className="relative bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl container-px">
        <Reveal>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-brand">
            Featured projects
          </p>
        </Reveal>
        <Reveal delay={1}>
          <h2 className="max-w-3xl font-display font-bold text-fluid-section">
            Live sites & products we&apos;ve{" "}
            <span className="text-gradient">shipped</span>.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <Reveal key={p.url} delay={i}>
              <motion.a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -6 }}
                className="group block h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
              >
                {/* screenshot — local 16:9 thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                  <Image
                    src={p.image}
                    alt={`${p.name} website preview`}
                    width={1280}
                    height={720}
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-cyan-brand shadow-sm backdrop-blur">
                    {p.category}
                  </span>
                </div>

                {/* meta */}
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-xl font-bold text-slate-900">{p.name}</h3>
                    <span className="text-cyan-brand transition-transform group-hover:translate-x-1">
                      ↗
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {p.desc}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
