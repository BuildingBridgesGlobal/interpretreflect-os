export type PromptKey =
  | "hero"
  | "burnout"
  | "domains"
  | "support"
  | "reflection"
  | "og";

export const prompts: Record<PromptKey, string> = {
  hero: "concentric orbs, teal and violet, soft gradient, low contrast, abstract, calming, subtle glow",
  burnout: "amber drift, gentle gradients, abstract heat map, non-figurative, soft focus",
  domains: "panelled geometry, teal and sky tones, abstract tiles, subdued",
  support: "woven threads, teal and violet threads, light weave, minimal motion",
  reflection: "orbs and rings, subtle light, contemplative, abstract geometry",
  og: "brand panel with concentric motifs, readable text overlay, high contrast foreground, abstract background",
};

