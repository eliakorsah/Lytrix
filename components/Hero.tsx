"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import useIsDesktop from "@/lib/useIsDesktop";

const headline = ["Design.", "Build.", "Launch."];

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  return (
    <section
      id="top"
      ref={ref}
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-gradient-to-b from-sky-50 via-white to-white"
    >
      {/* animated gradient orbs — scaling a heavily-blurred layer per frame is
          GPU-expensive on mobile, so only run the scroll-linked scale on desktop
          and use lighter blur radii on small screens. */}
      <motion.div
        style={isDesktop ? { scale } : undefined}
        className="pointer-events-none absolute inset-0 transform-gpu"
      >
        <div className="absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-magenta-brand/15 blur-[80px] sm:blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-[32rem] w-[32rem] rounded-full bg-cyan-brand/15 blur-[80px] sm:blur-[130px]" />
        <div className="absolute left-1/3 top-1/3 h-[20rem] w-[20rem] rounded-full bg-navy/10 blur-[80px] sm:blur-[120px]" />
      </motion.div>

      {/* subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(#cdd9e8 1px, transparent 1px), linear-gradient(90deg, #cdd9e8 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <motion.div
        style={isDesktop ? { y, opacity } : undefined}
        className="relative z-10 mx-auto w-full max-w-7xl container-px pt-28"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-brand motion-reduce:animate-none" />
          Creative & software studio
        </motion.div>

        <h1 className="font-display font-extrabold text-fluid-hero">
          {headline.map((word, i) => (
            <span key={word} className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{
                  duration: 0.9,
                  delay: 0.15 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {i === 2 ? (
                  <span className="text-gradient">{word}</span>
                ) : (
                  word
                )}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-8 max-w-xl text-base text-slate-600 sm:text-lg"
        >
          We&apos;re LYTRIX CONSULT — we craft standout websites, bold graphic
          design, scroll-stopping video ads, web POS systems and full SaaS
          products. One studio, end to end.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <a
            href="#contact"
            className="rounded-full bg-brand-gradient px-7 py-3.5 text-center text-sm font-semibold text-white transition-transform hover:scale-105"
          >
            Start a project
          </a>
          <a
            href="#work"
            className="rounded-full border border-slate-300 bg-white px-7 py-3.5 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            See our work
          </a>
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-slate-400 sm:flex"
      >
        <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
        <div className="h-10 w-px overflow-hidden bg-slate-200">
          <motion.div
            className="h-1/2 w-full bg-cyan-brand"
            animate={reduce ? undefined : { y: ["-100%", "200%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
