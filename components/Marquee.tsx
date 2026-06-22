const items = [
  "Web Design",
  "Graphic Design",
  "Video Ads",
  "Web POS Systems",
  "SaaS Development",
  "Brand Identity",
  "UI / UX",
];

export default function Marquee() {
  return (
    <div className="relative flex overflow-hidden border-y border-slate-200 bg-slate-50 py-6">
      <div className="flex shrink-0 animate-marquee-slow items-center gap-8 pr-8 motion-reduce:animate-none sm:animate-marquee">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="font-display text-xl font-semibold text-slate-700 sm:text-2xl">
              {item}
            </span>
            <span className="text-cyan-brand">✦</span>
          </span>
        ))}
      </div>
      <div
        aria-hidden
        className="flex shrink-0 animate-marquee-slow items-center gap-8 pr-8 motion-reduce:animate-none sm:animate-marquee"
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="font-display text-xl font-semibold text-slate-700 sm:text-2xl">
              {item}
            </span>
            <span className="text-cyan-brand">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
