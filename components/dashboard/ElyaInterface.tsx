"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { ThinkingDots } from "@/components/ui/ai-typing";

type ElyaInterfaceProps = {
  userData: any;
  preFillMessage?: string;
  onMessageSent?: () => void;
  recentAssignments?: Assignment[];
  initialMode?: ElyaMode;
};

type Assignment = {
  id: string;
  title: string;
  assignment_type: string;
  date: string;
  completed: boolean;
};

type Message = {
  role: "elya" | "user";
  content: string;
  timestamp: Date;
};

type ElyaMode = "chat" | "prep" | "debrief" | "research" | "patterns" | "free-write";

// Mode configurations with distinct visual identities and contextual prompts
const modeConfig: Record<ElyaMode, {
  label: string;
  color: string;
  bgGradient: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
  ringColor: string;
  placeholder: string;
  placeholderWithAssignment: string;
  description: string;
  tooltip: string;
  showAssignmentSelector: boolean;
  icon: JSX.Element;
}> = {
  chat: {
    label: "Chat",
    color: "violet",
    bgGradient: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    textColor: "text-violet-400",
    ringColor: "focus:ring-violet-500",
    placeholder: "Ask me anything about interpreting, your career, or how I can help...",
    placeholderWithAssignment: "Ask me anything...",
    description: "General conversation",
    tooltip: "Ask questions about interpreting, get career advice, or just chat",
    showAssignmentSelector: false,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
  },
  prep: {
    label: "Prep",
    color: "teal",
    bgGradient: "from-teal-500 to-emerald-600",
    bgLight: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    textColor: "text-teal-400",
    ringColor: "focus:ring-teal-500",
    placeholder: "Select an assignment above, or describe what you're preparing for...",
    placeholderWithAssignment: "What do you want to focus on for this assignment?",
    description: "Prepare for assignments",
    tooltip: "Get ready for upcoming assignments with context, terminology, and strategies",
    showAssignmentSelector: true,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
  },
  debrief: {
    label: "Debrief",
    color: "blue",
    bgGradient: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
    ringColor: "focus:ring-blue-500",
    placeholder: "Select an assignment above, or tell me about a recent session...",
    placeholderWithAssignment: "How did it go? What stood out to you?",
    description: "Reflect on sessions",
    tooltip: "Reflect on completed assignments to identify what went well and areas to grow",
    showAssignmentSelector: true,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  research: {
    label: "Research",
    color: "amber",
    bgGradient: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
    ringColor: "focus:ring-amber-500",
    placeholder: "What terminology, domain, or topic do you want to explore?",
    placeholderWithAssignment: "What vocabulary or context do you need for this assignment?",
    description: "Vocab & terminology",
    tooltip: "Research terminology, domain-specific vocabulary, and background context",
    showAssignmentSelector: true,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
  },
  patterns: {
    label: "Patterns",
    color: "purple",
    bgGradient: "from-purple-500 to-fuchsia-600",
    bgLight: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    textColor: "text-purple-400",
    ringColor: "focus:ring-purple-500",
    placeholder: "Ask about trends in your work, recurring challenges, or growth areas...",
    placeholderWithAssignment: "What patterns do you notice in assignments like this?",
    description: "Analyze your growth",
    tooltip: "Discover trends in your work, recurring challenges, and track your growth over time",
    showAssignmentSelector: true,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  },
  "free-write": {
    label: "Free Write",
    color: "rose",
    bgGradient: "from-rose-500 to-pink-600",
    bgLight: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    textColor: "text-rose-400",
    ringColor: "focus:ring-rose-500",
    placeholder: "This is your space. Write whatever you need to process...",
    placeholderWithAssignment: "Process your thoughts about this assignment...",
    description: "Emotional processing",
    tooltip: "A safe space to process emotions, vent, or write freely without judgment",
    showAssignmentSelector: true,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
  }
};

const OPENING_MESSAGE = "Hi! I'm Elya, your AI interpreter co-pilot. I'm here to help you prep, debrief, research, analyze patterns, or just talk through whatever's on your mind. You can also tell me about an upcoming assignment and I'll automatically add it to your calendar. What would you like to work on?";

// Post-debrief feeling options (matches wellness check-in options)
const postDebriefFeelings = [
  { id: "energized", label: "Energized", emoji: "⚡", color: "emerald", description: "Feeling great" },
  { id: "calm", label: "Calm", emoji: "🌊", color: "teal", description: "At peace" },
  { id: "okay", label: "Okay", emoji: "🌤️", color: "amber", description: "Neutral" },
  { id: "overwhelmed", label: "Overwhelmed", emoji: "🌀", color: "orange", description: "Stressed" },
  { id: "drained", label: "Drained", emoji: "🔋", color: "rose", description: "Tired" },
] as const;

// Mood emoji options for journal (spec requirement)
const MOOD_EMOJIS = [
  { emoji: "😤", label: "Frustrated", sentiment: "difficult" },
  { emoji: "😢", label: "Sad", sentiment: "difficult" },
  { emoji: "😐", label: "Neutral", sentiment: "neutral" },
  { emoji: "😊", label: "Happy", sentiment: "joyful" },
  { emoji: "🌟", label: "Amazing", sentiment: "joyful" },
] as const;

export default function ElyaInterface({ userData, preFillMessage, onMessageSent, recentAssignments = [], initialMode = "chat" }: ElyaInterfaceProps) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ElyaMode>(initialMode);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: "elya", content: OPENING_MESSAGE, timestamp: new Date() }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showWellnessPrompt, setShowWellnessPrompt] = useState(false);
  const [wellnessSubmitted, setWellnessSubmitted] = useState(false);
  const [submittingWellness, setSubmittingWellness] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [savingMood, setSavingMood] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConfig = modeConfig[mode];
  const selectedAssignmentData = recentAssignments.find(a => a.id === selectedAssignment);

  // Get the appropriate placeholder based on mode and assignment selection
  const getPlaceholder = () => {
    if (selectedAssignment && currentConfig.showAssignmentSelector) {
      return currentConfig.placeholderWithAssignment;
    }
    return currentConfig.placeholder;
  };

  // Load conversation from Supabase on mount
  useEffect(() => {
    const loadConversation = async () => {
      if (!userData?.id) return;

      // Try to load the most recent active conversation
      const { data: existingConvo } = await supabase
        .from("elya_conversations")
        .select("*")
        .eq("user_id", userData.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (existingConvo) {
        setConversationId(existingConvo.id);
        setMode((existingConvo.mode as ElyaMode) || "chat");
        setSelectedAssignment(existingConvo.assignment_id || null);
        const messages = existingConvo.messages as any[] | null;
        if (messages && messages.length > 0) {
          setMessages(messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        }
      }
    };

    loadConversation();
  }, [userData?.id]);

  // Save conversation to Supabase whenever messages change
  const saveConversation = useCallback(async (messagesToSave: Message[], currentMode: ElyaMode, assignmentId: string | null) => {
    if (!userData?.id || messagesToSave.length <= 1) return;

    setSaving(true);
    try {
      const conversationData = {
        user_id: userData.id,
        mode: currentMode,
        assignment_id: assignmentId,
        messages: messagesToSave.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString()
        })),
        message_count: messagesToSave.length,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      if (conversationId) {
        // Update existing conversation
        await supabase
          .from("elya_conversations")
          .update(conversationData)
          .eq("id", conversationId);
      } else {
        // Create new conversation
        const { data: newConvo } = await supabase
          .from("elya_conversations")
          .insert({
            ...conversationData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (newConvo) {
          setConversationId(newConvo.id);
        }
      }
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
    setSaving(false);
  }, [userData?.id, conversationId]);

  // Auto-save when messages change
  useEffect(() => {
    if (messages.length > 1) {
      const timeoutId = setTimeout(() => {
        saveConversation(messages, mode, selectedAssignment);
      }, 1000); // Debounce saves

      return () => clearTimeout(timeoutId);
    }
  }, [messages, mode, selectedAssignment, saveConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show wellness prompt after meaningful debrief/free-write conversation
  useEffect(() => {
    // Only show for debrief or free-write mode with an assignment selected
    if ((mode === "debrief" || mode === "free-write") && selectedAssignment && !wellnessSubmitted && !showWellnessPrompt) {
      // Count user messages (excluding opening message and loading states)
      const userMessageCount = messages.filter(m => m.role === "user").length;
      // Show after 3+ user messages (indicates a meaningful conversation)
      if (userMessageCount >= 3) {
        setShowWellnessPrompt(true);
      }
    }
  }, [messages, mode, selectedAssignment, wellnessSubmitted, showWellnessPrompt]);

  // Submit post-debrief wellness check-in
  const submitWellnessCheckin = async (feeling: string) => {
    if (!userData?.id || !selectedAssignment) return;

    setSubmittingWellness(true);
    try {
      const response = await fetch("/api/wellness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userData.id,
          feeling,
          assignment_id: selectedAssignment,
          assignment_type: selectedAssignmentData?.assignment_type || null,
          is_post_debrief: true,
        }),
      });

      if (response.ok) {
        setWellnessSubmitted(true);
        setShowWellnessPrompt(false);
        // Auto-hide success message after 5 seconds
        setTimeout(() => setWellnessSubmitted(false), 5000);
      } else {
        // If API fails, just hide the prompt silently
        console.warn("Wellness check-in failed, hiding prompt");
        setShowWellnessPrompt(false);
      }
    } catch (error) {
      console.error("Error submitting wellness check-in:", error);
      // Hide prompt on error to prevent stuck UI
      setShowWellnessPrompt(false);
    }
    setSubmittingWellness(false);
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            }
          }
          if (finalTranscript) {
            setInput(prev => prev + finalTranscript);
          }
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Handle pre-fill message from parent component
  useEffect(() => {
    if (preFillMessage) {
      setInput(preFillMessage);
      // Detect mode from message content
      if (preFillMessage.toLowerCase().includes('prep')) {
        setMode("prep");
      } else if (preFillMessage.toLowerCase().includes('debrief')) {
        setMode("debrief");
      }
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => inputRef.current?.focus(), 500);
      onMessageSent?.();
    }
  }, [preFillMessage, onMessageSent]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput("");

    const loadingMessage: Message = {
      role: "elya",
      content: "Thinking...",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userId: userData?.id,
          context: {
            type: mode,
            mode_label: currentConfig.label,
            mode_description: currentConfig.description,
            assignment_id: selectedAssignment,
            assignment_title: selectedAssignmentData?.title,
            assignment_type: selectedAssignmentData?.assignment_type
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to get response");

      setMessages(prev => {
        const withoutLoading = prev.slice(0, -1);
        return [
          ...withoutLoading,
          {
            role: "elya",
            content: data.response || data.reply,
            timestamp: new Date()
          }
        ];
      });
    } catch (error: any) {
      console.error("Error calling Elya:", error);
      setMessages(prev => {
        const withoutLoading = prev.slice(0, -1);
        return [
          ...withoutLoading,
          {
            role: "elya",
            content: "I'm having trouble connecting right now. Please try again in a moment.",
            timestamp: new Date()
          }
        ];
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const startNewConversation = () => {
    // Only show mood picker if there's a meaningful conversation (more than just opening message)
    if (messages.length > 1 && conversationId) {
      setShowMoodPicker(true);
    } else {
      setShowNewChatModal(true);
    }
  };

  // Save mood and end conversation
  const saveMoodAndEndConversation = async (moodEmoji: string | null) => {
    setSavingMood(true);

    // Find the sentiment for this mood
    const moodData = MOOD_EMOJIS.find(m => m.emoji === moodEmoji);

    if (conversationId) {
      await supabase
        .from("elya_conversations")
        .update({
          is_active: false,
          mood_emoji: moodEmoji,
          sentiment: moodData?.sentiment || null,
          ended_at: new Date().toISOString()
        })
        .eq("id", conversationId);
    }

    // Reset state
    setConversationId(null);
    setSelectedAssignment(null);
    setMessages([{ role: "elya", content: OPENING_MESSAGE, timestamp: new Date() }]);
    setShowWellnessPrompt(false);
    setWellnessSubmitted(false);
    setShowMoodPicker(false);
    setSavingMood(false);
  };

  const confirmNewConversation = async () => {
    setShowNewChatModal(false);

    // Mark current conversation as inactive
    if (conversationId) {
      await supabase
        .from("elya_conversations")
        .update({ is_active: false })
        .eq("id", conversationId);
    }

    // Reset state
    setConversationId(null);
    setSelectedAssignment(null);
    setMessages([{ role: "elya", content: OPENING_MESSAGE, timestamp: new Date() }]);
    // Reset wellness prompt state
    setShowWellnessPrompt(false);
    setWellnessSubmitted(false);
  };

  const modes: ElyaMode[] = ["chat", "prep", "debrief", "research", "patterns", "free-write"];

  // Filter assignments based on mode
  const getFilteredAssignments = () => {
    if (mode === "prep") {
      // For prep, show upcoming (not completed) assignments
      return recentAssignments.filter(a => !a.completed);
    } else if (mode === "debrief" || mode === "patterns" || mode === "free-write") {
      // For debrief/patterns/free-write, show completed assignments
      return recentAssignments.filter(a => a.completed);
    }
    // For research, show all
    return recentAssignments;
  };

  // Dynamic styles based on mode
  const getBorderStyle = () => {
    switch (mode) {
      case "chat": return "border-violet-500/40";
      case "prep": return "border-teal-500/40";
      case "debrief": return "border-blue-500/40";
      case "research": return "border-amber-500/40";
      case "patterns": return "border-purple-500/40";
      case "free-write": return "border-rose-500/40";
      default: return "border-slate-700";
    }
  };

  const filteredAssignments = getFilteredAssignments();

  return (
    <div className="h-full flex flex-col" ref={containerRef}>
      <div className={`flex-1 rounded-2xl border-2 ${getBorderStyle()} bg-slate-900/80 backdrop-blur-sm shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-240px)] transition-colors duration-300`}>

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Elya</h3>
              <p className={`text-xs ${currentConfig.textColor} transition-colors duration-300`}>
                {currentConfig.description}
                {saving && <span className="ml-2 text-slate-500">Saving...</span>}
              </p>
            </div>
          </div>
          <button
            onClick={startNewConversation}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New
          </button>
        </div>

        {/* Assignment Selector - Shows for relevant modes */}
        {currentConfig.showAssignmentSelector && filteredAssignments.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/30">
            <div className="flex items-center gap-2">
              <span className={`text-xs ${currentConfig.textColor}`}>
                {mode === "prep" ? "Preparing for:" : mode === "debrief" ? "Debriefing:" : "Assignment:"}
              </span>
              <select
                value={selectedAssignment || ""}
                onChange={(e) => setSelectedAssignment(e.target.value || null)}
                className={`flex-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 text-sm focus:outline-none focus:ring-1 ${currentConfig.ringColor}`}
              >
                <option value="">No assignment selected</option>
                {filteredAssignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.date}) - {a.assignment_type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 px-4 py-4 overflow-y-auto min-h-0">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => {
                const isThinking = message.role === "elya" && message.content === "Thinking...";
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                  >
                    {message.role === "elya" && (
                      <motion.div
                        className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 mt-1 shadow-lg shadow-violet-500/20"
                        animate={isThinking ? {
                          boxShadow: [
                            "0 0 0 0 rgba(139, 92, 246, 0)",
                            "0 0 0 10px rgba(139, 92, 246, 0.2)",
                            "0 0 0 0 rgba(139, 92, 246, 0)"
                          ]
                        } : {}}
                        transition={{ duration: 1.5, repeat: isThinking ? Infinity : 0 }}
                      >
                        <img src="/elya.jpg" alt="Elya" className="w-full h-full object-cover" />
                      </motion.div>
                    )}
                    <motion.div
                      className={`flex-1 max-w-2xl rounded-xl px-4 py-3 ${
                        message.role === "elya"
                          ? `${currentConfig.bgLight} border ${currentConfig.borderColor} text-slate-200`
                          : "bg-slate-800 border border-slate-700 text-slate-100 ml-12"
                      }`}
                      layout
                    >
                      {isThinking ? (
                        <ThinkingDots color={currentConfig.color} />
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs text-slate-500 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                        </>
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Mode Buttons + Input Area */}
        <div className="px-4 py-4 bg-slate-950/50 border-t border-slate-800 flex-shrink-0 space-y-3">

          {/* Post-Debrief Wellness Prompt */}
          <AnimatePresence>
            {showWellnessPrompt && !wellnessSubmitted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-4 mb-3">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💜</span>
                      <div>
                        <p className="text-sm font-medium text-slate-200">How are you feeling after this session?</p>
                        <p className="text-xs text-slate-400">Optional - helps track how different assignments affect you</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowWellnessPrompt(false)}
                      className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                      title="Dismiss"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {postDebriefFeelings.map((feeling) => {
                      const colorClasses: Record<string, string> = {
                        emerald: "bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300",
                        teal: "bg-teal-500/20 border-teal-500/40 hover:bg-teal-500/30 text-teal-300",
                        amber: "bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30 text-amber-300",
                        rose: "bg-rose-500/20 border-rose-500/40 hover:bg-rose-500/30 text-rose-300",
                        orange: "bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30 text-orange-300",
                      };
                      return (
                        <motion.button
                          key={feeling.id}
                          onClick={() => submitWellnessCheckin(feeling.id)}
                          disabled={submittingWellness}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses[feeling.color]}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span>{feeling.emoji}</span>
                          <span>{feeling.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wellness Submitted Confirmation */}
          <AnimatePresence>
            {wellnessSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mb-2"
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-emerald-300">Feeling logged - see trends on the Wellness page</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode Selection Buttons */}
          <div className="flex flex-wrap gap-2">
            {modes.map((m, index) => {
              const config = modeConfig[m];
              const isActive = mode === m;
              // Position tooltip to the right for first 2 buttons to prevent off-screen
              const isLeftEdge = index < 2;
              return (
                <div key={m} className="relative group">
                  <motion.button
                    onClick={() => {
                      setMode(m);
                      // Clear assignment selection when switching modes
                      if (!config.showAssignmentSelector) {
                        setSelectedAssignment(null);
                      }
                      // Hide wellness prompt when switching away from debrief/free-write
                      if (m !== "debrief" && m !== "free-write") {
                        setShowWellnessPrompt(false);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
                      isActive
                        ? `bg-gradient-to-r ${config.bgGradient} text-white shadow-lg`
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300 border border-slate-700"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    layout
                  >
                    {config.icon}
                    {config.label}
                  </motion.button>
                  {/* Tooltip with 800ms delay */}
                  <div className={`absolute bottom-full mb-2 w-44 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 text-center leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-[800ms] pointer-events-none z-50 shadow-xl ${
                    isLeftEdge ? 'left-0' : 'left-1/2 -translate-x-1/2'
                  }`}>
                    {config.tooltip}
                    <div className={`absolute top-full border-4 border-transparent border-t-slate-800 ${
                      isLeftEdge ? 'left-4' : 'left-1/2 -translate-x-1/2'
                    }`}></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Row */}
          <div className="flex gap-3">
            {mode === "free-write" ? (
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={getPlaceholder()}
                rows={2}
                className={`flex-1 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 ${currentConfig.ringColor} focus:border-transparent resize-none transition-all duration-200`}
              />
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={getPlaceholder()}
                className={`flex-1 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 ${currentConfig.ringColor} focus:border-transparent transition-all duration-200`}
              />
            )}
            {speechSupported && (
              <button
                onClick={toggleSpeechRecognition}
                className={`px-4 py-3 rounded-xl border transition-colors ${
                  isListening
                    ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                    : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
                title={isListening ? "Stop recording" : "Start voice input"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}
            <motion.button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`px-6 py-3 rounded-xl font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${currentConfig.bgGradient} text-white shadow-lg`}
              whileHover={input.trim() ? { scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" } : {}}
              whileTap={input.trim() ? { scale: 0.98 } : {}}
            >
              Send
            </motion.button>
          </div>
        </div>
      </div>

      {/* New Chat Confirmation Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-100">Start New Chat?</h3>
            </div>
            <p className="text-sm text-slate-300 mb-6">
              Your current conversation will be saved and you can start fresh with Elya.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmNewConversation}
                className="flex-1 px-4 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-medium text-sm transition-colors"
              >
                Start New Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mood Picker Modal */}
      {showMoodPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-xl border border-slate-700 max-w-md w-full p-6 shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full overflow-hidden shadow-lg shadow-violet-500/20">
                <img src="/elya.jpg" alt="Elya" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">How did this feel?</h3>
              <p className="text-sm text-slate-400">
                Before we start fresh, take a moment to reflect on this conversation.
              </p>
            </div>

            {/* Mood Emoji Options */}
            <div className="flex justify-center gap-3 mb-6">
              {MOOD_EMOJIS.map(({ emoji, label }) => (
                <motion.button
                  key={emoji}
                  onClick={() => saveMoodAndEndConversation(emoji)}
                  disabled={savingMood}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-violet-500/50 transition-all group disabled:opacity-50"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{emoji}</span>
                  <span className="text-xs text-slate-400 group-hover:text-slate-300">{label}</span>
                </motion.button>
              ))}
            </div>

            {/* Skip Button */}
            <div className="text-center">
              <button
                onClick={() => saveMoodAndEndConversation(null)}
                disabled={savingMood}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
              >
                {savingMood ? "Saving..." : "Skip and start new chat"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
