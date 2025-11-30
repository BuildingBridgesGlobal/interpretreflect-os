"use client";
import React, { useState } from "react";

const roleOptions = [
  "Student / recent grad",
  "Staff interpreter",
  "Freelance / agency",
  "Designated interpreter",
  "VRS/VRI",
  "Educator / supervisor",
  "Other",
  "Prefer not to say"
];
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

type Step2ContextProps = {
  roles: string[];
  role_other?: string;
  years_experience?: string;
  settings: string[];
  settings_other?: string;
  onChange: (partial: {
    roles?: string[];
    role_other?: string;
    years_experience?: string;
    settings?: string[];
    settings_other?: string;
  }) => void;
};

export default function Step2Context({
  roles,
  role_other,
  years_experience,
  settings,
  settings_other,
  onChange
}: Step2ContextProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(roles || []);
  const [selectedSettings, setSelectedSettings] = useState<string[]>(settings || []);
  const [roleOtherText, setRoleOtherText] = useState(role_other || "");
  const [settingsOtherText, setSettingsOtherText] = useState(settings_other || "");

  const toggleRole = (r: string) => {
    const next = selectedRoles.includes(r)
      ? selectedRoles.filter((x) => x !== r)
      : [...selectedRoles, r];
    setSelectedRoles(next);
    onChange({ roles: next });
  };

  const toggleSetting = (s: string) => {
    const next = selectedSettings.includes(s)
      ? selectedSettings.filter((x) => x !== s)
      : [...selectedSettings, s];
    setSelectedSettings(next);
    onChange({ settings: next });
  };

  const handleRoleOtherChange = (value: string) => {
    setRoleOtherText(value);
    onChange({ role_other: value });
  };

  const handleSettingsOtherChange = (value: string) => {
    setSettingsOtherText(value);
    onChange({ settings_other: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-slate-200">Primary role (select all that apply)</p>
        <div className="grid grid-cols-2 gap-2">
          {roleOptions.map((r) => (
            <button
              key={r}
              onClick={() => toggleRole(r)}
              className={`rounded-lg border px-3 py-2 text-sm ${
                selectedRoles.includes(r)
                  ? "border-teal-400 text-teal-300"
                  : "border-slate-700 text-slate-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        {selectedRoles.includes("Other") && (
          <input
            type="text"
            value={roleOtherText}
            onChange={(e) => handleRoleOtherChange(e.target.value)}
            placeholder="Please specify your role..."
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
          />
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-200">Years interpreting</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => onChange({ years_experience: y })}
              className={`rounded-lg border px-3 py-2 text-sm ${
                years_experience === y
                  ? "border-teal-400 text-teal-300"
                  : "border-slate-700 text-slate-300"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-200">Typical settings (select all that apply)</p>
        <div className="grid grid-cols-2 gap-2">
          {settingsOptions.map((s) => (
            <button
              key={s}
              onClick={() => toggleSetting(s)}
              className={`rounded-lg border px-3 py-2 text-sm ${
                selectedSettings.includes(s)
                  ? "border-teal-400 text-teal-300"
                  : "border-slate-700 text-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {selectedSettings.includes("Other") && (
          <input
            type="text"
            value={settingsOtherText}
            onChange={(e) => handleSettingsOtherChange(e.target.value)}
            placeholder="Please specify your settings..."
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}
