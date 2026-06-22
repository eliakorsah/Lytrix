"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { WorkItem } from "@/lib/work";

// Placeholder cards shown until the client drops real images into /public/work.
const placeholders: WorkItem[] = [
  { src: "", title: "E-commerce Brand Site" },
  { src: "", title: "Restaurant POS UI" },
  { src: "", title: "Product Launch Reel" },
  { src: "", title: "Logo & Identity" },
  { src: "", title: "SaaS Dashboard" },
  { src: "", title: "Social Campaign" },
];

export default function WorkGallery({ items }: { items: WorkItem[] }) {
  const data = items.length ? items : placeholders;
  const isPlaceholder = items.length === 0;

  return (
    <div className="mt-16 grid grid-cols-2 gap-4 sm:gap-5">
      {data.map((item, i) => {
        // A lone last item (odd count) spans the full width as a banner.
        const isFullWidth = i === data.length - 1 && data.length % 2 === 1;
        return (
        <motion.figure
          key={item.title + i}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
          className={`group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
            isFullWidth ? "col-span-2" : ""
          }`}
        >
          {isPlaceholder ? (
            <div
              className={`flex items-center justify-center ${
                isFullWidth ? "aspect-[16/7]" : "aspect-[4/5]"
              }`}
              style={{
                background:
                  i % 2
                    ? "linear-gradient(135deg,#eef2f7,#dbe4ef)"
                    : "linear-gradient(135deg,#e4ecf5,#eef2f7)",
              }}
            >
              <span className="font-display text-5xl font-extrabold text-slate-300">
                LYTRIX
              </span>
            </div>
          ) : (
            <Image
              src={item.src}
              alt={item.title}
              width={isFullWidth ? 1600 : 800}
              height={1000}
              sizes={isFullWidth ? "100vw" : "(min-width: 1024px) 33vw, 50vw"}
              className={`w-full transition-transform duration-500 group-hover:scale-105 ${
                isFullWidth
                  ? "aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-200 object-contain p-4 sm:aspect-[2/1]"
                  : "aspect-[4/5] object-cover"
              }`}
            />
          )}

          <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-ink via-ink/70 to-transparent p-5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="font-display text-base font-semibold text-white">
              {item.title}
            </span>
          </figcaption>
        </motion.figure>
        );
      })}
    </div>
  );
}
