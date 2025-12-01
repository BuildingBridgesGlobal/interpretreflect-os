"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

type ContentBlock = {
  type: string;
  text?: string;
  items?: string[];
  style?: string;
};

type ContentSection = {
  section_title: string;
  duration_minutes: number;
  content_blocks: ContentBlock[];
};

type SkillModule = {
  id: string;
  module_code: string;
  title: string;
  subtitle: string;
  description: string;
  duration_minutes: number;
  ecci_domain: string;
  order_in_series: number;
  content_concept: ContentSection;
  content_practice: ContentSection;
  content_application: ContentSection;
  elya_prompt_set_id: string | null;
  has_video: boolean;
  video_url: string | null;
  attribution_text: string;
  series: {
    title: string;
    series_code: string;
    icon_emoji: string;
  };
};

type UserProgress = {
  id: string;
  status: string;
  concept_completed: boolean;
  practice_completed: boolean;
  reflection_completed: boolean;
  application_completed: boolean;
  started_at: string | null;
  completed_at: string | null;
  time_spent_seconds: number;
};

type ReflectionMessage = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

export default function ModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleCode = params?.moduleCode as string;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [module, setModule] = useState<SkillModule | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [currentSection, setCurrentSection] = useState<"concept" | "practice" | "reflection" | "application">("concept");
  const [reflectionMessages, setReflectionMessages] = useState<ReflectionMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sectionStartTime = useRef<number>(Date.now());

  useEffect(() => {
    loadData();
  }, [moduleCode]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [reflectionMessages]);

  useEffect(() => {
    // Reset section start time when section changes
    sectionStartTime.current = Date.now();
  }, [currentSection]);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/signin");
      return;
    }

    setUser(session.user);

    // Load module with series data
    const { data: moduleData } = await (supabase as any)
      .from("skill_modules")
      .select(`
        *,
        series:skill_series(title, series_code, icon_emoji)
      `)
      .eq("module_code", moduleCode)
      .single();

    if (moduleData) {
      setModule(moduleData as any);
    }

    // Load or create user progress
    let { data: progressData } = await (supabase as any)
      .from("user_module_progress")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("module_id", moduleData?.id)
      .single();

    if (!progressData && moduleData) {
      // Create initial progress record
      const { data: newProgress } = await (supabase as any)
        .from("user_module_progress")
        .insert({
          user_id: session.user.id,
          module_id: moduleData.id,
          status: "in_progress",
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      progressData = newProgress;
    }

    setProgress(progressData);

    // Load reflection messages if they exist
    if (progressData) {
      const { data: reflectionData } = await (supabase as any)
        .from("skill_reflections")
        .select("messages")
        .eq("user_module_progress_id", progressData.id)
        .single();

      if (reflectionData?.messages) {
        setReflectionMessages(reflectionData.messages);
      }
    }

    setLoading(false);
  };

  const markSectionComplete = async (section: "concept" | "practice" | "reflection" | "application") => {
    if (!progress || !module) return;

    const sectionField = `${section}_completed`;
    const timeSpent = Math.floor((Date.now() - sectionStartTime.current) / 1000);

    const updates: any = {
      [sectionField]: true,
      time_spent_seconds: progress.time_spent_seconds + timeSpent,
      updated_at: new Date().toISOString()
    };

    // Check if all sections are complete
    const allComplete =
      (section === "concept" || progress.concept_completed) &&
      (section === "practice" || progress.practice_completed) &&
      (section === "reflection" || progress.reflection_completed) &&
      (section === "application" || progress.application_completed);

    if (allComplete) {
      updates.status = "completed";
      updates.completed_at = new Date().toISOString();
    }

    const { data: updatedProgress } = await (supabase as any)
      .from("user_module_progress")
      .update(updates)
      .eq("id", progress.id)
      .select()
      .single();

    if (updatedProgress) {
      setProgress(updatedProgress);

      // Update ECCI competency scores
      await updateECCIScore();
    }
  };

  const updateECCIScore = async () => {
    if (!user || !module) return;

    const { data: existingScore } = await (supabase as any)
      .from("ecci_competency_scores")
      .select("*")
      .eq("user_id", user.id)
      .eq("domain", module.ecci_domain)
      .single();

    const updates = {
      modules_completed: (existingScore?.modules_completed || 0) + 1,
      last_activity_at: new Date().toISOString(),
      engagement_level: Math.min(100, ((existingScore?.modules_completed || 0) + 1) * 10)
    };

    if (existingScore) {
      await (supabase as any)
        .from("ecci_competency_scores")
        .update(updates)
        .eq("id", existingScore.id);
    } else {
      await (supabase as any)
        .from("ecci_competency_scores")
        .insert({
          user_id: user.id,
          domain: module.ecci_domain,
          ...updates,
          trend: "building"
        });
    }
  };

  const sendReflectionMessage = async () => {
    if (!newMessage.trim() || !progress || !module || sending) return;

    setSending(true);

    // Add user message to local state immediately
    const userMsg: ReflectionMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: newMessage.trim(),
      created_at: new Date().toISOString()
    };

    const updatedMessages = [...reflectionMessages, userMsg];
    setReflectionMessages(updatedMessages);
    setNewMessage("");

    // Call Elya API
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          userId: user.id,
          context: {
            type: "skill_reflection",
            module_code: module.module_code,
            module_title: module.title,
            ecci_domain: module.ecci_domain,
            elya_prompt_set_id: module.elya_prompt_set_id
          }
        })
      });

      const data = await response.json();

      if (data.response) {
        const assistantMsg: ReflectionMessage = {
          id: `elya-${Date.now()}`,
          role: "assistant",
          content: data.response,
          created_at: new Date().toISOString()
        };

        const finalMessages = [...updatedMessages, assistantMsg];
        setReflectionMessages(finalMessages);

        // Save to database
        const { data: existingReflection } = await (supabase as any)
          .from("skill_reflections")
          .select("id")
          .eq("user_module_progress_id", progress.id)
          .single();

        if (existingReflection) {
          await (supabase as any)
            .from("skill_reflections")
            .update({
              messages: finalMessages,
              total_messages: finalMessages.length,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingReflection.id);
        } else {
          await (supabase as any)
            .from("skill_reflections")
            .insert({
              user_id: user.id,
              module_id: module.id,
              user_module_progress_id: progress.id,
              messages: finalMessages,
              total_messages: finalMessages.length
            });
        }
      }
    } catch (error) {
      console.error("Error calling Elya:", error);
    }

    setSending(false);
  };

  const renderContentBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case "heading":
        return <h2 key={index} className="text-2xl font-semibold text-slate-50 mb-4">{block.text}</h2>;

      case "subheading":
        return <h3 key={index} className="text-xl font-semibold text-slate-100 mt-6 mb-3">{block.text}</h3>;

      case "paragraph":
        return <p key={index} className="text-slate-300 leading-relaxed mb-4">{block.text}</p>;

      case "bullet_list":
        return (
          <ul key={index} className="list-disc list-inside space-y-2 mb-4 text-slate-300">
            {block.items?.map((item, i) => (
              <li key={i} className="ml-4" dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ul>
        );

      case "callout":
        const calloutStyles = {
          insight: "bg-teal-500/10 border-teal-500/30 text-teal-100",
          practice_tip: "bg-violet-500/10 border-violet-500/30 text-violet-100",
          next_step: "bg-blue-500/10 border-blue-500/30 text-blue-100"
        };
        const style = calloutStyles[block.style as keyof typeof calloutStyles] || calloutStyles.insight;

        return (
          <div key={index} className={`p-4 rounded-lg border ${style} mb-4`}>
            <p dangerouslySetInnerHTML={{ __html: block.text || "" }} />
          </div>
        );

      default:
        return null;
    }
  };

  const renderSection = () => {
    if (!module) return null;

    const sections = {
      concept: module.content_concept,
      practice: module.content_practice,
      application: module.content_application,
      reflection: null
    };

    if (currentSection === "reflection") {
      return (
        <div className="h-full flex flex-col">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-slate-50 mb-2">Reflect with Elya</h2>
            <p className="text-slate-400">
              Take a moment to process what you've learned. Elya will guide you through a brief reflection.
            </p>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col" style={{ minHeight: "400px" }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {reflectionMessages.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">💭</div>
                  <p className="text-slate-400">
                    Ready to reflect? Start the conversation with Elya.
                  </p>
                </div>
              )}

              {reflectionMessages.map((message) => {
                const isElya = message.role === "assistant";

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isElya ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      isElya
                        ? 'bg-teal-500 text-slate-950'
                        : 'bg-violet-500 text-white'
                    }`}>
                      {isElya ? 'E' : 'You'.charAt(0)}
                    </div>

                    {/* Message */}
                    <div className={`flex-1 max-w-[80%] ${!isElya ? 'text-right' : ''}`}>
                      <div className={`text-xs text-slate-400 mb-1 ${!isElya ? 'text-right' : ''}`}>
                        {isElya ? 'Elya' : 'You'} • {new Date(message.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div className={`rounded-lg p-4 ${
                        isElya
                          ? 'bg-teal-500/10 border border-teal-500/30 text-slate-100'
                          : 'bg-violet-500/10 border border-violet-500/30 text-slate-100'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-800 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReflectionMessage()}
                  placeholder="Share your thoughts with Elya..."
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  disabled={sending}
                />
                <button
                  onClick={sendReflectionMessage}
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const section = sections[currentSection];
    if (!section) return null;

    return (
      <div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-slate-50">{section.section_title}</h2>
            <span className="text-sm text-slate-400">{section.duration_minutes} min</span>
          </div>
        </div>

        <div className="prose prose-invert prose-slate max-w-none">
          {section.content_blocks.map((block, index) => renderContentBlock(block, index))}
        </div>
      </div>
    );
  };

  const nextSection = async () => {
    await markSectionComplete(currentSection);

    const sectionOrder: Array<"concept" | "practice" | "reflection" | "application"> = ["concept", "practice", "reflection", "application"];
    const currentIndex = sectionOrder.indexOf(currentSection);

    if (currentIndex < sectionOrder.length - 1) {
      setCurrentSection(sectionOrder[currentIndex + 1]);
    } else {
      // Module complete
      router.push("/skills");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading module...</div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Module not found</h2>
          <button
            onClick={() => router.push("/skills")}
            className="mt-4 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
          >
            Back to Skills Library
          </button>
        </div>
      </div>
    );
  }

  const sectionProgress = [
    { key: "concept", label: "Concept", completed: progress?.concept_completed || false },
    { key: "practice", label: "Practice", completed: progress?.practice_completed || false },
    { key: "reflection", label: "Reflection", completed: progress?.reflection_completed || false },
    { key: "application", label: "Application", completed: progress?.application_completed || false }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/skills")}
            className="text-sm text-slate-400 hover:text-teal-400 mb-4 flex items-center gap-1"
          >
            ← Back to Skills Library
          </button>

          <div className="flex items-start gap-4 mb-4">
            <span className="text-5xl">{module.series.icon_emoji}</span>
            <div className="flex-1">
              <p className="text-sm text-teal-400 mb-1">{module.series.title} • Module {module.order_in_series}</p>
              <h1 className="text-3xl font-semibold text-slate-50">{module.title}</h1>
              <p className="mt-2 text-lg text-slate-300">{module.subtitle}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                <span>{module.duration_minutes} minutes</span>
                <span>•</span>
                <span>{module.ecci_domain}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2">
            {sectionProgress.map((section, index) => (
              <div key={section.key} className="flex-1">
                <div className={`h-2 rounded-full ${
                  section.completed
                    ? 'bg-teal-500'
                    : section.key === currentSection
                    ? 'bg-teal-500/50'
                    : 'bg-slate-700'
                }`} />
                <p className={`text-xs mt-1 text-center ${
                  section.key === currentSection ? 'text-teal-400' : 'text-slate-500'
                }`}>
                  {section.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 mb-6">
          {renderSection()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div>
            {currentSection !== "concept" && (
              <button
                onClick={() => {
                  const sectionOrder: Array<"concept" | "practice" | "reflection" | "application"> = ["concept", "practice", "reflection", "application"];
                  const currentIndex = sectionOrder.indexOf(currentSection);
                  if (currentIndex > 0) {
                    setCurrentSection(sectionOrder[currentIndex - 1]);
                  }
                }}
                className="px-6 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                ← Previous
              </button>
            )}
          </div>

          <button
            onClick={nextSection}
            className="px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
          >
            {currentSection === "application" ? "Complete Module" : "Next →"}
          </button>
        </div>

        {/* Attribution */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs text-slate-500 leading-relaxed">
            {module.attribution_text}
          </p>
        </div>
      </div>
    </div>
  );
}
