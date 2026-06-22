"use client";

import { useEffect, useState } from "react";

/**
 * Returns true only on pointer-precise, larger viewports — i.e. where the
 * heavier scroll-linked animations (parallax, smooth scroll) run smoothly.
 * On touch / small screens we fall back to native scroll and static layout to
 * avoid mobile jank. Defaults to false so SSR + first paint are the cheap path.
 */
export default function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
