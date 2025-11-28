export type MotifName =
  | "concentric-orbs"
  | "topographic-lines"
  | "woven-threads"
  | "domain-panels"
  | "burnout-drift";

const gradients: Record<MotifName, (variant?: string) => string> = {
  "concentric-orbs": (variant) =>
    `radial-gradient(60% 60% at 30% 20%, rgba(45,212,191,0.25), transparent 70%), radial-gradient(50% 50% at 70% 60%, rgba(124,58,237,0.22), transparent 65%), radial-gradient(40% 40% at 20% 80%, rgba(251,191,36,0.18), transparent 60%)`,
  "topographic-lines": (variant) =>
    `repeating-conic-gradient(from 0deg, rgba(56,189,248,0.15) 0% 5%, transparent 5% 10%), radial-gradient(80% 80% at 50% 50%, rgba(124,58,237,0.15), transparent 70%)`,
  "woven-threads": (variant) =>
    `repeating-linear-gradient(45deg, rgba(45,212,191,0.18) 0 6px, transparent 6px 12px), repeating-linear-gradient(135deg, rgba(124,58,237,0.14) 0 8px, transparent 8px 16px)`,
  "domain-panels": (variant) =>
    `linear-gradient(180deg, rgba(2,6,23,0.9), rgba(2,6,23,0.92)), radial-gradient(60% 60% at 20% 30%, rgba(45,212,191,0.22), transparent 70%), radial-gradient(40% 40% at 80% 70%, rgba(56,189,248,0.18), transparent 65%)`,
  "burnout-drift": (variant) =>
    `radial-gradient(70% 70% at 30% 70%, rgba(251,191,36,0.18), transparent 70%), radial-gradient(50% 50% at 70% 30%, rgba(234,179,8,0.15), transparent 65%)`,
};

export function motifGradient(name: MotifName, variant?: string): string {
  return gradients[name](variant);
}

