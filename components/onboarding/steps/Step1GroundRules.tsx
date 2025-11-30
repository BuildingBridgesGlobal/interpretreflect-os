"use client";
import React from "react";

export default function Step1GroundRules({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-300">Your work data stays private. Teams and programs only see anonymized patterns.</p>
      <p className="text-sm text-slate-300">No ads, no selling your data, ever.</p>
      <p className="text-sm text-slate-300">You control what you share with mentors, supervisors, or programs.</p>
      <label className="mt-4 flex items-center gap-2 text-sm text-slate-200">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-700 bg-slate-900" />
        I understand this OS is for professional development and performance tracking, not clinical or emergency care.
      </label>
    </div>
  );
}
