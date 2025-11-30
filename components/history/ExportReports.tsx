"use client";

import { useState } from "react";

export default function ExportReports() {
  const [reportType, setReportType] = useState<"professional" | "ceu" | "custom">("professional");
  const [dateRange, setDateRange] = useState("all-time");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const skills = ["Message Accuracy", "Cultural Mediation", "Decision Making", "Terminology Management", "Register Shifting", "Ethical Reasoning"];
  const assignmentTypes = ["Medical", "Legal", "Educational", "VRS", "Community", "Mental Health"];

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleExport = (format: "pdf" | "print") => {
    alert(`Exporting ${reportType} report as ${format.toUpperCase()}. This feature will generate a professional document with all selected data.`);
  };

  return (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Select Report Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setReportType("professional")}
            className={`p-4 rounded-lg border transition-all text-left ${
              reportType === "professional"
                ? "border-teal-500 bg-teal-500/10"
                : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
            }`}
          >
            <h3 className={`font-semibold mb-1 ${reportType === "professional" ? "text-teal-400" : "text-slate-200"}`}>
              Professional Development Report
            </h3>
            <p className="text-xs text-slate-400">
              Complete performance history for employers, agencies, and credentialing bodies
            </p>
          </button>

          <button
            onClick={() => setReportType("ceu")}
            className={`p-4 rounded-lg border transition-all text-left ${
              reportType === "ceu"
                ? "border-teal-500 bg-teal-500/10"
                : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
            }`}
          >
            <h3 className={`font-semibold mb-1 ${reportType === "ceu" ? "text-teal-400" : "text-slate-200"}`}>
              CEU Documentation
            </h3>
            <p className="text-xs text-slate-400">
              Training hours and activities formatted for continuing education credit submission
            </p>
          </button>

          <button
            onClick={() => setReportType("custom")}
            className={`p-4 rounded-lg border transition-all text-left ${
              reportType === "custom"
                ? "border-teal-500 bg-teal-500/10"
                : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
            }`}
          >
            <h3 className={`font-semibold mb-1 ${reportType === "custom" ? "text-teal-400" : "text-slate-200"}`}>
              Custom Report
            </h3>
            <p className="text-xs text-slate-400">
              Build your own report with specific date ranges, skills, and assignment types
            </p>
          </button>
        </div>
      </div>

      {/* Report Preview/Configuration */}
      {reportType === "professional" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Professional Development Report</h3>
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Report Includes:</h4>
              <ul className="space-y-1 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-teal-400">✓</span>
                  Total assignments debriefed (52) with breakdown by type
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400">✓</span>
                  Skills developed with measurable evidence and performance scores
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400">✓</span>
                  Training hours logged (34.5 hours) with activity breakdown
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400">✓</span>
                  Performance trajectory graph showing 35% improvement
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400">✓</span>
                  Specialization areas and competency levels (ECCI framework)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400">✓</span>
                  Key milestones and breakthrough moments
                </li>
              </ul>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="all-time">All Time (Jan 2025 - Present)</option>
                <option value="last-year">Last 12 Months</option>
                <option value="last-6-months">Last 6 Months</option>
                <option value="last-3-months">Last 3 Months</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {reportType === "ceu" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">CEU Documentation</h3>
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">CEU-Eligible Activities:</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Scenario Practice Sessions</span>
                  <span className="font-semibold text-teal-400">12.5 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Micro-Lesson Completions</span>
                  <span className="font-semibold text-teal-400">8.0 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Case Study Analysis</span>
                  <span className="font-semibold text-teal-400">6.5 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Skill Drill Practice</span>
                  <span className="font-semibold text-teal-400">7.5 hours</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                  <span className="text-sm font-semibold text-slate-200">Total CEU Hours</span>
                  <span className="text-xl font-bold text-teal-400">34.5 hours</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              * Report formatted to meet RID and state-specific continuing education requirements
            </p>
          </div>
        </div>
      )}

      {reportType === "custom" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Custom Report Builder</h3>
          <div className="space-y-6">
            {/* Date Range */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="all-time">All Time</option>
                <option value="last-year">Last 12 Months</option>
                <option value="last-6-months">Last 6 Months</option>
                <option value="last-3-months">Last 3 Months</option>
                <option value="last-month">Last Month</option>
              </select>
            </div>

            {/* Skills Filter */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Focus on Specific Skills</label>
              <div className="flex gap-2 flex-wrap">
                {skills.map(skill => (
                  <button
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedSkills.includes(skill)
                        ? "bg-teal-500 text-slate-950"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignment Types Filter */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Assignment Types to Include</label>
              <div className="flex gap-2 flex-wrap">
                {assignmentTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => handleTypeToggle(type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTypes.includes(type)
                        ? "bg-teal-500 text-slate-950"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Report Preview */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Report Will Include:</h4>
              <ul className="space-y-1 text-sm text-slate-400">
                <li>• Assignments from {dateRange === "all-time" ? "all time" : dateRange.replace("-", " ")}</li>
                {selectedSkills.length > 0 && (
                  <li>• Performance data for: {selectedSkills.join(", ")}</li>
                )}
                {selectedTypes.length > 0 && (
                  <li>• Filtered to assignment types: {selectedTypes.join(", ")}</li>
                )}
                <li>• Debriefs, training hours, and performance trends matching your filters</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Export Options</h3>
        <div className="flex gap-4">
          <button
            onClick={() => handleExport("pdf")}
            className="flex-1 px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-semibold hover:bg-teal-400 transition-colors"
          >
            Export as PDF
          </button>
          <button
            onClick={() => handleExport("print")}
            className="flex-1 px-6 py-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700 transition-colors"
          >
            Print View
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-4 text-center">
          Reports are formatted for professional submission and include all necessary documentation for agencies, employers, and state boards.
        </p>
      </div>
    </div>
  );
}
