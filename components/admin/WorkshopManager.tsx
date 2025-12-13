"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Workshop = {
  id: string;
  module_code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  duration_minutes: number;
  ceu_value: number | null;
  rid_category: string | null;
  ceu_eligible: boolean;
  is_active: boolean;
  workshop_type: string;
  presentation_language: string;
  access_expiration: string | null;
  live_date: string | null;
  instructor_name: string | null;
  instructor_credentials: string | null;
  rid_activity_code: string | null;
  rid_approved_hours: number | null;
  video_url: string | null;
  flyer_url: string | null;
  slide_deck_url: string | null;
  google_folder_url: string | null;
  checklist_ceu_request_form: boolean;
  checklist_flyer_generated: boolean;
  checklist_evaluation_form: boolean;
  checklist_certificate_created: boolean;
  checklist_reflection_form: boolean;
  checklist_slide_deck: boolean;
  checklist_drive_folder_complete: boolean;
  checklist_recording_uploaded: boolean;
  checklist_connected_to_slide_fill: boolean;
  checklist_submitted_to_rid: boolean;
  checklist_social_media_campaign: boolean;
  publish_status: string;
  status_notes: string | null;
  learning_objectives: any[] | null;
  assessment_questions: any[] | null;
};

type NewWorkshop = {
  title: string;
  subtitle: string;
  description: string;
  duration_minutes: number;
  ceu_value: number;
  rid_category: string;
  workshop_type: string;
  presentation_language: string;
  instructor_name: string;
  instructor_credentials: string;
  video_url: string;
  google_folder_url: string;
};

type AssessmentQuestion = {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
};

export default function WorkshopManager() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [saving, setSaving] = useState(false);

  // Learning objectives editing
  const [editingObjectives, setEditingObjectives] = useState(false);
  const [tempObjectives, setTempObjectives] = useState<string[]>([]);
  const [newObjective, setNewObjective] = useState("");

  // Assessment questions editing
  const [editingQuestions, setEditingQuestions] = useState(false);
  const [tempQuestions, setTempQuestions] = useState<AssessmentQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState({ question: "", options: ["", "", "", ""], correct_answer: 0 });

  const [newWorkshop, setNewWorkshop] = useState<NewWorkshop>({
    title: "",
    subtitle: "",
    description: "",
    duration_minutes: 60,
    ceu_value: 0.1,
    rid_category: "Professional Studies",
    workshop_type: "on_demand",
    presentation_language: "ASL w/ English Captions",
    instructor_name: "Sarah Wheeler, MA",
    instructor_credentials: "NIC, CI/CT",
    video_url: "",
    google_folder_url: "",
  });

  useEffect(() => {
    loadWorkshops();
  }, []);

  const loadWorkshops = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("skill_modules")
        .select("*")
        .eq("ceu_eligible", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkshops(data || []);
    } catch (err) {
      console.error("Error loading workshops:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateModuleCode = () => {
    const year = new Date().getFullYear();
    const count = workshops.length + 1;
    return `CEU-${year}-${String(count).padStart(3, "0")}`;
  };

  const createWorkshop = async () => {
    if (!newWorkshop.title.trim()) {
      alert("Please enter a workshop title");
      return;
    }

    setSaving(true);
    try {
      const moduleCode = generateModuleCode();

      const { data, error } = await (supabase as any)
        .from("skill_modules")
        .insert({
          module_code: moduleCode,
          title: newWorkshop.title,
          subtitle: newWorkshop.subtitle || null,
          description: newWorkshop.description || null,
          duration_minutes: newWorkshop.duration_minutes,
          ceu_value: newWorkshop.ceu_value,
          rid_category: newWorkshop.rid_category,
          ceu_eligible: true,
          is_active: false, // Start as inactive until fully set up
          workshop_type: newWorkshop.workshop_type,
          presentation_language: newWorkshop.presentation_language,
          instructor_name: newWorkshop.instructor_name,
          instructor_credentials: newWorkshop.instructor_credentials,
          video_url: newWorkshop.video_url || null,
          google_folder_url: newWorkshop.google_folder_url || null,
          publish_status: "draft",
          assessment_pass_threshold: 80,
        })
        .select()
        .single();

      if (error) throw error;

      setWorkshops([data, ...workshops]);
      setShowCreateForm(false);
      setNewWorkshop({
        title: "",
        subtitle: "",
        description: "",
        duration_minutes: 60,
        ceu_value: 0.1,
        rid_category: "Professional Studies",
        workshop_type: "on_demand",
        presentation_language: "ASL w/ English Captions",
        instructor_name: "Sarah Wheeler, MA",
        instructor_credentials: "NIC, CI/CT",
        video_url: "",
        google_folder_url: "",
      });
      alert("Workshop created! Now add learning objectives and assessment questions.");
      setSelectedWorkshop(data);
    } catch (err: any) {
      console.error("Error creating workshop:", err);
      alert("Failed to create workshop: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateChecklist = async (workshopId: string, field: string, value: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from("skill_modules")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", workshopId);

      if (error) throw error;

      setWorkshops(workshops.map(w =>
        w.id === workshopId ? { ...w, [field]: value } : w
      ));

      if (selectedWorkshop?.id === workshopId) {
        setSelectedWorkshop({ ...selectedWorkshop, [field]: value });
      }
    } catch (err) {
      console.error("Error updating checklist:", err);
    }
  };

  const updateWorkshopField = async (workshopId: string, field: string, value: any) => {
    try {
      const { error } = await (supabase as any)
        .from("skill_modules")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", workshopId);

      if (error) throw error;

      setWorkshops(workshops.map(w =>
        w.id === workshopId ? { ...w, [field]: value } : w
      ));

      if (selectedWorkshop?.id === workshopId) {
        setSelectedWorkshop({ ...selectedWorkshop, [field]: value });
      }
    } catch (err) {
      console.error("Error updating field:", err);
    }
  };

  // Start editing learning objectives
  const startEditingObjectives = (workshop: Workshop) => {
    setTempObjectives(workshop.learning_objectives || []);
    setEditingObjectives(true);
    setNewObjective("");
  };

  // Save learning objectives
  const saveObjectives = async (workshopId: string) => {
    setSaving(true);
    try {
      await updateWorkshopField(workshopId, "learning_objectives", tempObjectives);
      setEditingObjectives(false);
    } catch (err) {
      console.error("Error saving objectives:", err);
    } finally {
      setSaving(false);
    }
  };

  // Add a new objective
  const addObjective = () => {
    if (newObjective.trim()) {
      setTempObjectives([...tempObjectives, newObjective.trim()]);
      setNewObjective("");
    }
  };

  // Remove an objective
  const removeObjective = (index: number) => {
    setTempObjectives(tempObjectives.filter((_, i) => i !== index));
  };

  // Start editing questions
  const startEditingQuestions = (workshop: Workshop) => {
    setTempQuestions(workshop.assessment_questions || []);
    setEditingQuestions(true);
    setNewQuestion({ question: "", options: ["", "", "", ""], correct_answer: 0 });
  };

  // Save assessment questions
  const saveQuestions = async (workshopId: string) => {
    setSaving(true);
    try {
      await updateWorkshopField(workshopId, "assessment_questions", tempQuestions);
      setEditingQuestions(false);
    } catch (err) {
      console.error("Error saving questions:", err);
    } finally {
      setSaving(false);
    }
  };

  // Add a new question
  const addQuestion = () => {
    if (newQuestion.question.trim() && newQuestion.options.every(o => o.trim())) {
      const question: AssessmentQuestion = {
        id: `q_${Date.now()}`,
        question: newQuestion.question.trim(),
        options: newQuestion.options.map(o => o.trim()),
        correct_answer: newQuestion.correct_answer,
      };
      setTempQuestions([...tempQuestions, question]);
      setNewQuestion({ question: "", options: ["", "", "", ""], correct_answer: 0 });
    } else {
      alert("Please fill in the question and all 4 answer options");
    }
  };

  // Remove a question
  const removeQuestion = (id: string) => {
    setTempQuestions(tempQuestions.filter(q => q.id !== id));
  };

  // Update a new question option
  const updateNewQuestionOption = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const publishWorkshop = async (workshop: Workshop) => {
    // Check required items
    const required = [
      workshop.title,
      workshop.description,
      workshop.learning_objectives?.length,
      workshop.assessment_questions?.length,
      workshop.video_url,
      workshop.checklist_recording_uploaded,
    ];

    if (required.some(r => !r)) {
      alert("Cannot publish: Missing required items (title, description, learning objectives, assessment questions, video)");
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from("skill_modules")
        .update({
          is_active: true,
          publish_status: "published",
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", workshop.id);

      if (error) throw error;

      alert("Workshop published! It's now visible to Pro users.");
      loadWorkshops();
    } catch (err: any) {
      console.error("Error publishing:", err);
      alert("Failed to publish: " + err.message);
    }
  };

  const ChecklistItem = ({
    label,
    checked,
    onChange
  }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500"
      />
      <span className={`text-sm ${checked ? "text-slate-300" : "text-slate-500"}`}>
        {label}
      </span>
    </label>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-teal-400">Loading workshops...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">CEU Workshop Manager</h2>
          <p className="text-sm text-slate-400 mt-1">
            Create and manage RID-approved CEU workshops
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-teal-500 text-slate-950 font-medium rounded-lg hover:bg-teal-400 transition-colors"
        >
          + New Workshop
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-100">Create New CEU Workshop</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Workshop Title *</label>
                <input
                  type="text"
                  value={newWorkshop.title}
                  onChange={(e) => setNewWorkshop({ ...newWorkshop, title: e.target.value })}
                  placeholder="e.g., Virtual Synergy: Mastering Teamwork in Digital Interpreting"
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={newWorkshop.subtitle}
                  onChange={(e) => setNewWorkshop({ ...newWorkshop, subtitle: e.target.value })}
                  placeholder="Optional subtitle or tagline"
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={newWorkshop.description}
                  onChange={(e) => setNewWorkshop({ ...newWorkshop, description: e.target.value })}
                  rows={3}
                  placeholder="Workshop description for participants"
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newWorkshop.duration_minutes}
                    onChange={(e) => setNewWorkshop({ ...newWorkshop, duration_minutes: parseInt(e.target.value) || 60 })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">CEU Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newWorkshop.ceu_value}
                    onChange={(e) => setNewWorkshop({ ...newWorkshop, ceu_value: parseFloat(e.target.value) || 0.1 })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">10 hours = 1.0 CEU (60 min = 0.1 CEU)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">RID Category</label>
                  <select
                    value={newWorkshop.rid_category}
                    onChange={(e) => setNewWorkshop({ ...newWorkshop, rid_category: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="Professional Studies">Professional Studies (PS)</option>
                    <option value="PPO">Power, Privilege & Oppression (PPO)</option>
                    <option value="General Studies">General Studies (GS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Workshop Type</label>
                  <select
                    value={newWorkshop.workshop_type}
                    onChange={(e) => setNewWorkshop({ ...newWorkshop, workshop_type: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="on_demand">On-Demand</option>
                    <option value="live">Live</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Presentation Language</label>
                <select
                  value={newWorkshop.presentation_language}
                  onChange={(e) => setNewWorkshop({ ...newWorkshop, presentation_language: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="ASL w/ English Captions">ASL w/ English Captions</option>
                  <option value="ASL only">ASL only</option>
                  <option value="English only">English only</option>
                  <option value="ASL & English">ASL & English</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Instructor Name</label>
                  <input
                    type="text"
                    value={newWorkshop.instructor_name}
                    onChange={(e) => setNewWorkshop({ ...newWorkshop, instructor_name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Credentials</label>
                  <input
                    type="text"
                    value={newWorkshop.instructor_credentials}
                    onChange={(e) => setNewWorkshop({ ...newWorkshop, instructor_credentials: e.target.value })}
                    placeholder="NIC, CI/CT, etc."
                    className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Video URL or Embed Code</label>
                <textarea
                  value={newWorkshop.video_url}
                  onChange={(e) => setNewWorkshop({ ...newWorkshop, video_url: e.target.value })}
                  placeholder="Paste Vimeo embed code (e.g., <iframe src=&quot;https://player.vimeo.com/video/...&quot;>) or just the URL"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500 resize-none font-mono text-xs"
                />
                <p className="text-xs text-slate-500 mt-1">Accepts: Vimeo embed code, player.vimeo.com URL, or vimeo.com URL</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Google Drive Folder URL</label>
                <input
                  type="url"
                  value={newWorkshop.google_folder_url}
                  onChange={(e) => setNewWorkshop({ ...newWorkshop, google_folder_url: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createWorkshop}
                disabled={saving}
                className="px-4 py-2 bg-teal-500 text-slate-950 font-medium rounded-lg hover:bg-teal-400 transition-colors disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Workshop"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workshop List */}
      <div className="space-y-4">
        {workshops.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-12 text-center">
            <p className="text-slate-400 mb-4">No CEU workshops yet</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-teal-500 text-slate-950 font-medium rounded-lg hover:bg-teal-400 transition-colors"
            >
              Create Your First Workshop
            </button>
          </div>
        ) : (
          workshops.map((workshop) => (
            <div
              key={workshop.id}
              className={`rounded-xl border p-5 transition-all ${
                workshop.publish_status === "published"
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-slate-700 bg-slate-900/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      workshop.publish_status === "published"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {workshop.publish_status === "published" ? "Published" : "Draft"}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold">
                      {workshop.ceu_value?.toFixed(2) || "0.00"} CEU
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      workshop.rid_category === "Professional Studies"
                        ? "bg-violet-500/20 text-violet-400"
                        : workshop.rid_category === "PPO"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}>
                      {workshop.rid_category === "Professional Studies" ? "PS" : workshop.rid_category}
                    </span>
                    <span className="text-xs text-slate-500">{workshop.module_code}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">{workshop.title}</h3>
                  {workshop.subtitle && (
                    <p className="text-sm text-slate-400 mt-1">{workshop.subtitle}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>{workshop.duration_minutes} min</span>
                    <span>{workshop.workshop_type === "live" ? "Live" : "On-Demand"}</span>
                    <span>{workshop.presentation_language}</span>
                    <span>{workshop.instructor_name}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedWorkshop(selectedWorkshop?.id === workshop.id ? null : workshop)}
                    className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors text-sm"
                  >
                    {selectedWorkshop?.id === workshop.id ? "Close" : "Edit"}
                  </button>
                  {workshop.publish_status !== "published" && (
                    <button
                      onClick={() => publishWorkshop(workshop)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors text-sm font-medium"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Edit Panel */}
              {selectedWorkshop?.id === workshop.id && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Checklist */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-3">RID Workflow Checklist</h4>
                      <div className="space-y-1">
                        <ChecklistItem
                          label="CEU Request Form Submitted"
                          checked={workshop.checklist_ceu_request_form}
                          onChange={(v) => updateChecklist(workshop.id, "checklist_ceu_request_form", v)}
                        />
                        <ChecklistItem
                          label="Flyer Generated"
                          checked={workshop.checklist_flyer_generated}
                          onChange={(v) => updateChecklist(workshop.id, "checklist_flyer_generated", v)}
                        />
                        <ChecklistItem
                          label="Evaluation Form Ready"
                          checked={workshop.checklist_evaluation_form}
                          onChange={(v) => updateChecklist(workshop.id, "checklist_evaluation_form", v)}
                        />
                        <ChecklistItem
                          label="Certificate Template Created"
                          checked={workshop.checklist_certificate_created}
                          onChange={(v) => updateChecklist(workshop.id, "checklist_certificate_created", v)}
                        />
                        <ChecklistItem
                          label="Reflection Form Ready"
                          checked={workshop.checklist_reflection_form}
                          onChange={(v) => updateChecklist(workshop.id, "checklist_reflection_form", v)}
                        />
                        <ChecklistItem
                          label="Slide Deck Complete"
                          checked={workshop.checklist_slide_deck}
                          onChange={(v) => updateChecklist(workshop.id, "checklist_slide_deck", v)}
                        />
                        <ChecklistItem
                          label="Drive Folder Complete"
                          checked={workshop.checklist_drive_folder_complete}
                          onChange={(v) => updateChecklist(workshop.id, "checklist_drive_folder_complete", v)}
                        />
                        <ChecklistItem
                          label="Recording Uploaded"
                          checked={workshop.checklist_recording_uploaded}
                          onChange={(v) => updateChecklist(workshop.id, "checklist_recording_uploaded", v)}
                        />
                        <ChecklistItem
                          label="Connected to Slide Fill"
                          checked={workshop.checklist_connected_to_slide_fill}
                          onChange={(v) => updateChecklist(workshop.id, "checklist_connected_to_slide_fill", v)}
                        />
                        <ChecklistItem
                          label="Submitted to RID"
                          checked={workshop.checklist_submitted_to_rid}
                          onChange={(v) => updateChecklist(workshop.id, "checklist_submitted_to_rid", v)}
                        />
                        <ChecklistItem
                          label="Social Media Campaign"
                          checked={workshop.checklist_social_media_campaign}
                          onChange={(v) => updateChecklist(workshop.id, "checklist_social_media_campaign", v)}
                        />
                      </div>
                    </div>

                    {/* Content Requirements */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-3">Content Requirements</h4>
                      <div className="space-y-3">
                        <button
                          onClick={() => startEditingObjectives(workshop)}
                          className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
                        >
                          <span className="text-sm text-slate-300">Learning Objectives</span>
                          <span className={`text-xs ${workshop.learning_objectives?.length ? "text-emerald-400" : "text-amber-400"}`}>
                            {workshop.learning_objectives?.length || 0} added - Click to edit
                          </span>
                        </button>
                        <button
                          onClick={() => startEditingQuestions(workshop)}
                          className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
                        >
                          <span className="text-sm text-slate-300">Assessment Questions</span>
                          <span className={`text-xs ${workshop.assessment_questions?.length ? "text-emerald-400" : "text-amber-400"}`}>
                            {workshop.assessment_questions?.length || 0} added - Click to edit
                          </span>
                        </button>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                          <span className="text-sm text-slate-300">Video URL</span>
                          <span className={`text-xs ${workshop.video_url ? "text-emerald-400" : "text-amber-400"}`}>
                            {workshop.video_url ? "Set" : "Missing"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Status Notes</label>
                        <textarea
                          value={workshop.status_notes || ""}
                          onChange={(e) => updateWorkshopField(workshop.id, "status_notes", e.target.value)}
                          rows={3}
                          placeholder="Internal notes about this workshop..."
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500 resize-none text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Learning Objectives Editor */}
                  {editingObjectives && (
                    <div className="mt-6 pt-6 border-t border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-slate-300">Edit Learning Objectives</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingObjectives(false)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveObjectives(workshop.id)}
                            disabled={saving}
                            className="px-3 py-1.5 text-xs rounded-lg bg-teal-500 text-slate-950 hover:bg-teal-400 disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save Objectives"}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">After completing this workshop, participants will be able to:</p>
                      <div className="space-y-2 mb-4">
                        {tempObjectives.map((obj, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/50">
                            <span className="text-teal-400 text-sm mt-0.5">{idx + 1}.</span>
                            <span className="text-sm text-slate-300 flex-1">{obj}</span>
                            <button
                              onClick={() => removeObjective(idx)}
                              className="text-rose-400 hover:text-rose-300 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newObjective}
                          onChange={(e) => setNewObjective(e.target.value)}
                          placeholder="e.g., Identify three key strategies for team communication"
                          className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500 text-sm"
                          onKeyPress={(e) => e.key === "Enter" && addObjective()}
                        />
                        <button
                          onClick={addObjective}
                          className="px-3 py-2 text-sm rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Assessment Questions Editor */}
                  {editingQuestions && (
                    <div className="mt-6 pt-6 border-t border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-slate-300">Edit Assessment Questions</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingQuestions(false)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveQuestions(workshop.id)}
                            disabled={saving}
                            className="px-3 py-1.5 text-xs rounded-lg bg-teal-500 text-slate-950 hover:bg-teal-400 disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save Questions"}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">Must pass with 80% to earn CEU credit. Add 5+ questions recommended.</p>

                      {/* Existing Questions */}
                      <div className="space-y-4 mb-6">
                        {tempQuestions.map((q, qIdx) => (
                          <div key={q.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                            <div className="flex items-start justify-between mb-3">
                              <span className="text-sm font-medium text-slate-200">Q{qIdx + 1}: {q.question}</span>
                              <button
                                onClick={() => removeQuestion(q.id)}
                                className="text-rose-400 hover:text-rose-300 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className={`px-3 py-2 rounded text-xs ${
                                    optIdx === q.correct_answer
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                      : "bg-slate-900 text-slate-400"
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}. {opt} {optIdx === q.correct_answer && "(Correct)"}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add New Question Form */}
                      <div className="p-4 rounded-lg border border-dashed border-slate-600 bg-slate-800/30">
                        <h5 className="text-sm font-medium text-slate-300 mb-3">Add New Question</h5>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={newQuestion.question}
                            onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                            placeholder="Enter your question..."
                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500 text-sm"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            {newQuestion.options.map((opt, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="correct_answer"
                                  checked={newQuestion.correct_answer === idx}
                                  onChange={() => setNewQuestion({ ...newQuestion, correct_answer: idx })}
                                  className="text-teal-500"
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => updateNewQuestionOption(idx, e.target.value)}
                                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500 text-sm"
                                />
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500">Select the radio button next to the correct answer</p>
                          <button
                            onClick={addQuestion}
                            className="w-full px-3 py-2 text-sm rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
                          >
                            + Add Question
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
