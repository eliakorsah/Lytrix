"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Reveal from "./Reveal";

const steps = [
  {
    n: "01",
    title: "Discover",
    desc: "We learn your business, audience and goals — then map the fastest route to results.",
  },
  {
    n: "02",
    title: "Design",
    desc: "We craft the look, feel and experience: visuals, flows and prototypes you can react to.",
  },
  {
    n: "03",
    title: "Build",
    desc: "We develop it for real — clean, fast and responsive — whether it's a site, POS or full SaaS.",
  },
  {
    n: "04",
    title: "Launch & grow",
    desc: "We ship, measure and refine. Then we help you scale with content and campaigns.",
  },
];

export default function Process() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  // Animate via a GPU-composited transform (scaleY) instead of `height`, which
  // would force a layout recalc on every scroll frame and stutter on mobile.
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="process" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-5xl container-px">
        <Reveal>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-brand">
            How we work
          </p>
        </Reveal>
        <Reveal delay={1}>
          <h2 className="font-display font-bold text-fluid-section">
            A simple, proven <span className="text-gradient">process</span>.
          </h2>
        </Reveal>

        <div ref={ref} className="relative mt-16 pl-10 sm:pl-16">
          {/* track */}
          <div className="absolute left-[14px] top-2 h-full w-px bg-slate-200 sm:left-6" />
          {/* animated fill */}
          <motion.div
            style={{ scaleY }}
            className="absolute left-[14px] top-2 h-full w-px origin-top transform-gpu bg-brand-gradient sm:left-6"
          />

          <div className="space-y-12">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i}>
                <div className="relative">
                  <span className="absolute -left-10 top-1 grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-cyan-brand shadow-sm sm:-left-16 sm:h-9 sm:w-9 sm:text-sm">
                    {s.n}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-lg text-slate-600">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
