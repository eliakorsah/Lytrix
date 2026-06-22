import { getWorkItems } from "@/lib/work";
import Reveal from "./Reveal";
import WorkGallery from "./WorkGallery";

export default function Work() {
  const items = getWorkItems();

  return (
    <section id="work" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl container-px">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <Reveal>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-magenta-brand">
                Selected work
              </p>
            </Reveal>
            <Reveal delay={1}>
              <h2 className="max-w-2xl font-display font-bold text-fluid-section">
                A look at what we&apos;ve <span className="text-gradient">made</span>.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={2}>
            <p className="max-w-xs text-sm text-slate-600">
              Brands, products and campaigns we&apos;ve designed and shipped.
            </p>
          </Reveal>
        </div>

        <WorkGallery items={items} />
      </div>
    </section>
  );
}
