import fs from "node:fs";
import path from "node:path";

export type WorkItem = {
  src: string;
  title: string;
};

const IMAGE_RE = /\.(png|jpe?g|webp|avif|gif|svg)$/i;

/**
 * Reads everything in /public/work at build/request time so the client just
 * has to drop images into that folder — no code changes needed.
 * Filenames become titles: "brand-kit_01.jpg" -> "Brand Kit 01".
 */
export function getWorkItems(): WorkItem[] {
  const dir = path.join(process.cwd(), "public", "work");
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return [];
  }

  return files
    .filter((f) => IMAGE_RE.test(f))
    .sort()
    .map((file) => {
      const name = file
        .replace(IMAGE_RE, "")
        .replace(/[-_]+/g, " ")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return { src: `/work/${file}`, title: name || "Project" };
    });
}
