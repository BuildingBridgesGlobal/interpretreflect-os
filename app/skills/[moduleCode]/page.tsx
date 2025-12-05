"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import { motion, AnimatePresence } from "framer-motion";
import AssessmentQuiz from "@/components/AssessmentQuiz";

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

type AssessmentQuestion = {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correct_answer: string;
  explanation: string;
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
  // CEU fields
  ceu_eligible: boolean;
  ceu_value: number | null;
  assessment_questions: AssessmentQuestion[] | null;
  assessment_pass_threshold: number | null;
  learning_objectives: { id: string; objective: string; verb: string }[] | null;
};

type UserProgress = {
  id: string;
  status: string;
  concept_completed: boolean;
  practice_completed: boolean;
  reflection_completed: boolean;
  application_completed: boolean;
  assessment_completed: boolean;
  assessment_passed: boolean;
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
  const [currentSection, setCurrentSection] = useState<"concept" | "practice" | "reflection" | "application" | "assessment">("concept");
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

    // Load module with series data (including CEU fields)
    const { data: moduleData } = await (supabase as any)
      .from("skill_modules")
      .select(`
        *,
        series:skill_series(title, series_code, icon_emoji)
      `)
      .eq("module_code", moduleCode)
      .single();

    // Log CEU data for debugging
    if (moduleData) {
      console.log("Module CEU data:", {
        ceu_eligible: moduleData.ceu_eligible,
        ceu_value: moduleData.ceu_value,
        has_assessment: !!moduleData.assessment_questions,
        question_count: moduleData.assessment_questions?.length || 0
      });
    }

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

  const markSectionComplete = async (section: "concept" | "practice" | "reflection" | "application" | "assessment") => {
    if (!progress || !module) return;

    const sectionField = `${section}_completed`;
    const timeSpent = Math.floor((Date.now() - sectionStartTime.current) / 1000);

    const updates: any = {
      [sectionField]: true,
      time_spent_seconds: progress.time_spent_seconds + timeSpent,
      updated_at: new Date().toISOString()
    };

    // Check if all sections are complete
    // For CEU-eligible modules, assessment must also be complete
    const coreComplete =
      (section === "concept" || progress.concept_completed) &&
      (section === "practice" || progress.practice_completed) &&
      (section === "reflection" || progress.reflection_completed) &&
      (section === "application" || progress.application_completed);

    // Module is complete if core is complete AND (not CEU-eligible OR assessment is complete)
    const allComplete = coreComplete &&
      (!module.ceu_eligible || section === "assessment" || progress.assessment_completed);

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

      // Update ECCI competency scores only when core content is complete
      if (coreComplete) {
        await updateECCIScore();
      }
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
            module_subtitle: module.subtitle,
            module_description: module.description,
            ecci_domain: module.ecci_domain,
            series_title: module.series?.title,
            series_code: module.series?.series_code,
            order_in_series: module.order_in_series,
            elya_prompt_set_id: module.elya_prompt_set_id,
            // Include what sections they've completed so Elya knows their progress in this module
            sections_completed: {
              concept: progress?.concept_completed || false,
              practice: progress?.practice_completed || false,
              reflection: progress?.reflection_completed || false,
              application: progress?.application_completed || false
            }
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

  // Animation variants for staggered content
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  // Parse markdown-style bold (**text**) into styled HTML
  const parseMarkdownBold = (text: string): string => {
    if (!text) return "";
    // Convert **text** to styled span with nice typography
    return text.replace(
      /\*\*([^*]+)\*\*/g,
      '<span class="font-semibold text-slate-100 tracking-tight">$1</span>'
    );
  };

  const renderContentBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case "heading":
        return (
          <motion.h2
            key={index}
            variants={itemVariants}
            className="text-xl font-medium text-slate-50 mb-6 pb-3 border-b border-slate-800"
            dangerouslySetInnerHTML={{ __html: parseMarkdownBold(block.text || "") }}
          />
        );

      case "subheading":
        return (
          <motion.h3
            key={index}
            variants={itemVariants}
            className="text-base font-medium text-teal-400 mt-8 mb-4 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            <span dangerouslySetInnerHTML={{ __html: parseMarkdownBold(block.text || "") }} />
          </motion.h3>
        );

      case "paragraph":
        return (
          <motion.p
            key={index}
            variants={itemVariants}
            className="text-slate-300 leading-loose mb-6 text-[15px]"
            dangerouslySetInnerHTML={{ __html: parseMarkdownBold(block.text || "") }}
          />
        );

      case "bullet_list":
        return (
          <motion.ul key={index} variants={itemVariants} className="space-y-4 mb-8 ml-2">
            {block.items?.map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.3 }}
                className="flex items-start gap-3 text-slate-300 text-[15px] leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: parseMarkdownBold(item) }} />
              </motion.li>
            ))}
          </motion.ul>
        );

      case "callout": {
        const calloutConfig = {
          insight: {
            bg: "bg-slate-800/50",
            border: "border-teal-500/30",
            accentColor: "bg-teal-500",
            label: "Key Insight"
          },
          practice_tip: {
            bg: "bg-slate-800/50",
            border: "border-emerald-500/30",
            accentColor: "bg-emerald-500",
            label: "Nice Work"
          },
          next_step: {
            bg: "bg-slate-800/50",
            border: "border-violet-500/30",
            accentColor: "bg-violet-500",
            label: "Next"
          }
        };
        const config = calloutConfig[block.style as keyof typeof calloutConfig] || calloutConfig.insight;

        return (
          <motion.div
            key={index}
            variants={itemVariants}
            className={`p-5 rounded-xl border ${config.bg} ${config.border} my-8 relative overflow-hidden`}
          >
            {/* Subtle accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accentColor}`} />
            <div className="flex items-start gap-3 pl-3">
              <div className="flex-1">
                <p className="text-slate-300 text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: parseMarkdownBold(block.text || "") }} />
              </div>
            </div>
          </motion.div>
        );
      }

      default:
        return null;
    }
  };

  // Handle assessment completion
  const handleAssessmentComplete = async (passed: boolean, certificate?: any) => {
    if (!progress) return;

    // Update progress with assessment results
    const updates: any = {
      assessment_completed: true,
      assessment_passed: passed,
      updated_at: new Date().toISOString()
    };

    if (passed) {
      updates.status = "completed";
      updates.completed_at = new Date().toISOString();
    }

    await (supabase as any)
      .from("user_module_progress")
      .update(updates)
      .eq("id", progress.id);

    // Reload progress
    const { data: updatedProgress } = await (supabase as any)
      .from("user_module_progress")
      .select("*")
      .eq("id", progress.id)
      .single();

    if (updatedProgress) {
      setProgress(updatedProgress);
    }

    // Navigate back to skills page on completion
    if (passed) {
      router.push("/skills?completed=true&ceu=" + (module?.ceu_value || 0));
    }
  };

  const renderSection = () => {
    if (!module) return null;

    const sections = {
      concept: module.content_concept,
      practice: module.content_practice,
      application: module.content_application,
      reflection: null,
      assessment: null
    };

    // Render Assessment section for CEU-eligible modules
    if (currentSection === "assessment" && module.ceu_eligible && module.assessment_questions) {
      return (
        <AssessmentQuiz
          moduleId={module.id}
          moduleTitle={module.title}
          ceuValue={module.ceu_value || 0}
          questions={module.assessment_questions}
          passThreshold={module.assessment_pass_threshold || 80}
          onComplete={handleAssessmentComplete}
          onBack={() => setCurrentSection("application")}
        />
      );
    }

    if (currentSection === "reflection") {
      return (
        <motion.div
          key="reflection"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full flex flex-col"
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <p className="text-slate-500 text-sm italic mb-4">
              Take a breath. There's no rush here.
            </p>
            <h2 className="text-xl font-medium text-slate-50 mb-2">Chat with Elya</h2>
            <p className="text-slate-400 text-sm">
              Share what stood out to you, or ask any questions that came up.
            </p>
          </motion.div>

          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col"
            style={{ minHeight: "400px" }}
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {reflectionMessages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center py-12"
                >
                  {/* Animated orb indicator */}
                  <motion.div
                    className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-400/20 to-violet-500/20 border border-teal-500/30 flex items-center justify-center"
                    animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  >
                    <div className="w-4 h-4 rounded-full bg-teal-400/50" />
                  </motion.div>
                  <p className="text-slate-300 mb-2">What's on your mind?</p>
                  <p className="text-slate-500 text-sm">
                    Share a thought, ask a question, or just say hi.
                  </p>
                </motion.div>
              )}

              <AnimatePresence mode="popLayout">
                {reflectionMessages.map((message) => {
                  const isElya = message.role === "assistant";

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
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
                    </motion.div>
                  );
                })}
              </AnimatePresence>
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
          </motion.div>
        </motion.div>
      );
    }

    const section = sections[currentSection];
    if (!section) return null;

    // Friendly section intro with clear purpose
    const sectionIntros: Record<string, { hint: string; purpose: string }> = {
      concept: {
        hint: "Read & absorb",
        purpose: "Understanding the idea behind this skill"
      },
      practice: {
        hint: "Try it out",
        purpose: "A quick exercise to experience this yourself"
      },
      application: {
        hint: "Take it with you",
        purpose: "How to use this in your interpreting work"
      }
    };

    const intro = sectionIntros[currentSection];

    return (
      <motion.div
        key={currentSection}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Section context */}
        {intro && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 pb-6 border-b border-slate-800/50"
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs uppercase tracking-wider text-teal-500 font-medium">
                {intro.hint}
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              {intro.purpose}
            </p>
          </motion.div>
        )}

        <motion.div
          className="max-w-2xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {section.content_blocks.map((block, index) => renderContentBlock(block, index))}
        </motion.div>
      </motion.div>
    );
  };

  const nextSection = async () => {
    await markSectionComplete(currentSection);

    // For CEU-eligible modules, add assessment after application
    const baseSections: Array<"concept" | "practice" | "reflection" | "application" | "assessment"> =
      ["concept", "practice", "reflection", "application"];

    const sectionOrder = module?.ceu_eligible && module?.assessment_questions
      ? [...baseSections, "assessment" as const]
      : baseSections;

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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            <div className="w-8 h-1 bg-slate-600 rounded-full" />
          </div>
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

  // Build section progress including assessment for CEU-eligible modules
  const baseSectionProgress = [
    { key: "concept", label: "Learn", completed: progress?.concept_completed || false },
    { key: "practice", label: "Try It", completed: progress?.practice_completed || false },
    { key: "reflection", label: "Reflect", completed: progress?.reflection_completed || false },
    { key: "application", label: "Apply", completed: progress?.application_completed || false }
  ];

  const sectionProgress = module.ceu_eligible && module.assessment_questions
    ? [...baseSectionProgress, { key: "assessment", label: "CEU Quiz", completed: progress?.assessment_completed || false }]
    : baseSectionProgress;

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="container mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <button
            onClick={() => router.push("/skills")}
            className="text-sm text-slate-400 hover:text-teal-400 mb-4 flex items-center gap-1"
          >
            ← Back to Skills Library
          </button>

          <div className="flex items-start gap-4 mb-6">
            <motion.span
              className="text-4xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              {module.series.icon_emoji}
            </motion.span>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">{module.series.title}</p>
              <h1 className="text-2xl font-medium text-slate-50">{module.title}</h1>
              <p className="mt-2 text-slate-400">{module.subtitle}</p>
            </div>
          </div>

          {/* Progress Steps - Clearer flow indicator */}
          <div className="flex items-center gap-1">
            {sectionProgress.map((section, index) => {
              const isActive = section.key === currentSection;
              const isPast = sectionProgress.findIndex(s => s.key === currentSection) > index;

              return (
                <div key={section.key} className="flex items-center">
                  {/* Step indicator */}
                  <button
                    onClick={() => {
                      if (isPast || section.completed) {
                        setCurrentSection(section.key as "concept" | "practice" | "reflection" | "application");
                      }
                    }}
                    disabled={!isPast && !section.completed && !isActive}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                        : section.completed || isPast
                        ? 'bg-slate-800 text-slate-400 hover:text-teal-400 cursor-pointer'
                        : 'bg-slate-800/50 text-slate-600 cursor-default'
                    }`}
                  >
                    {section.completed ? (
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        isActive ? 'bg-teal-500 text-slate-950' : 'bg-slate-700 text-slate-500'
                      }`}>
                        {index + 1}
                      </span>
                    )}
                    {section.label}
                  </button>

                  {/* Connector line */}
                  {index < sectionProgress.length - 1 && (
                    <div className={`w-4 h-px mx-1 ${
                      isPast || section.completed ? 'bg-teal-500/50' : 'bg-slate-700'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 mb-6"
        >
          <AnimatePresence mode="wait">
            {renderSection()}
          </AnimatePresence>
        </motion.div>

        {/* Navigation - hide for assessment since it has its own nav */}
        {currentSection !== "assessment" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-between items-center"
          >
            <div>
              {currentSection !== "concept" && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => {
                    const baseSections: Array<"concept" | "practice" | "reflection" | "application" | "assessment"> =
                      ["concept", "practice", "reflection", "application"];
                    const sectionOrder = module.ceu_eligible && module.assessment_questions
                      ? [...baseSections, "assessment" as const]
                      : baseSections;
                    const currentIndex = sectionOrder.indexOf(currentSection);
                    if (currentIndex > 0) {
                      setCurrentSection(sectionOrder[currentIndex - 1]);
                    }
                  }}
                  className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-sm"
                >
                  ← Back
                </motion.button>
              )}
            </div>

            <motion.button
              onClick={nextSection}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors"
            >
              {currentSection === "application" && module.ceu_eligible && module.assessment_questions
                ? "Take CEU Quiz →"
                : currentSection === "application"
                ? "Finish"
                : "Continue →"}
            </motion.button>
          </motion.div>
        )}

        {/* Attribution */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs text-slate-500 leading-relaxed">
            {module.attribution_text}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
