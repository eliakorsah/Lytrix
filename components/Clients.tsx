"use client";

import Reveal from "./Reveal";

const clients = [
  "Tritech Technologies Ltd",
  "Intelet Express",
  "Intelet Electropoint",
  "JDY Traders",
  "Wagent Africa",
];

export default function Clients() {
  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl container-px">
        <Reveal>
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Trusted by teams we&apos;ve worked with
          </p>
        </Reveal>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {clients.map((c, i) => (
            <Reveal key={c} delay={i} as="div">
              <span className="rounded-full border border-slate-200 bg-white px-5 py-3 font-display text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-cyan-brand/50 hover:text-slate-900 sm:text-base">
                {c}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
