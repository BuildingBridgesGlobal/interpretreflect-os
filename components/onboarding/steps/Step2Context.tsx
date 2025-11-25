"use client";
import React, { useState } from "react";

const roles = ["Student / recent grad", "Staff interpreter", "Freelance / agency", "VRS/VRI", "Educator / supervisor", "Other", "Prefer not to say"];
const years = ["0–2", "3–7", "8–15", "16+", "Prefer not to say"];
const settingsOptions = [
  "Medical / healthcare",
  "Legal",
  "Mental health / counseling",
  "K–12",
  "College / university",
  "Community / social services",
  "VRS/VRI",
  "Performing arts",
  "Other",
  "Prefer not to say",
];

export default function Step2Context({ role, years_experience, settings, onChange }: { role?: string; years_experience?: string; settings: string[]; onChange: (partial: { role?: string; years_experience?: string; settings?: string[] }) => void }) {
  const [selectedSettings, setSelectedSettings] = useState<string[]>(settings || []);

  const toggleSetting = (s: string) => {
    let next = selectedSettings.includes(s) ? selectedSettings.filter((x) => x !== s) : [...selectedSettings, s];
    if (next.length > 3) next = next.slice(0, 3);
    setSelectedSettings(next);
    onChange({ settings: next });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-slate-200">Primary role</p>
        <div className="grid grid-cols-2 gap-2">
          {roles.map((r) => (
            <button key={r} onClick={() => onChange({ role: r })} className={`rounded-lg border px-3 py-2 text-sm ${role === r ? "border-teal-400 text-teal-300" : "border-slate-700 text-slate-300"}`}>{r}</button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-slate-200">Years interpreting</p>
        <div className="grid grid-cols-4 gap-2">
          {years.map((y) => (
            <button key={y} onClick={() => onChange({ years_experience: y })} className={`rounded-lg border px-3 py-2 text-sm ${years_experience === y ? "border-teal-400 text-teal-300" : "border-slate-700 text-slate-300"}`}>{y}</button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-slate-200">Typical settings (choose up to 3)</p>
        <div className="grid grid-cols-2 gap-2">
          {settingsOptions.map((s) => (
            <button key={s} onClick={() => toggleSetting(s)} className={`rounded-lg border px-3 py-2 text-sm ${selectedSettings.includes(s) ? "border-teal-400 text-teal-300" : "border-slate-700 text-slate-300"}`}>{s}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
