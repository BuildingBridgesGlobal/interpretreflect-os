import type { CSSProperties } from "react";
import { motifGradient, type MotifName } from "./motifs";

type MotifOptions = {
  motif: MotifName;
  variant?: string;
  opacity?: number;
  blur?: number;
};

const cache = new Map<string, string>();

export function getMotifStyle(opts: MotifOptions): CSSProperties {
  const key = `${opts.motif}|${opts.variant || "default"}`;
  let bg = cache.get(key);
  if (!bg) {
    bg = motifGradient(opts.motif, opts.variant);
    cache.set(key, bg);
  }
  const opacity = typeof opts.opacity === "number" ? opts.opacity : 0.9;
  const blur = typeof opts.blur === "number" ? opts.blur : 0;
  const style: CSSProperties = {
    backgroundImage: bg,
    opacity,
  };
  if (blur > 0) style.filter = `blur(${blur}px)`;
  return style;
}

