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
  lockedAssignmentId?: string | null;
  continueConversationId?: string | null;
};

type Assignment = {
  id: string;
  title: string;
  assignment_type: string;
  date: string;
  time?: string | null;
  completed: boolean;
  setting?: string | null;
  description?: string | null;
  duration_minutes?: number | null;
  location_type?: string | null;
};

type Message = {
  role: "elya" | "user";
  content: string;
  timestamp: Date;
};

type ElyaMode = "chat" | "prep" | "debrief" | "research" | "patterns" | "free-write";

// Mode configurations with distinct visual identities and contextual prompts
// Colors from InterpretReflect spec:
// - Purple (#a855f7) = Primary Actions/AI
// - Teal (#00d9ff) = Prep/Premium/Trust
// - Blue (#3b82f6) = Debrief/Analysis
// - Orange (#f59e0b) = Research/Learning
// - Magenta (#ec4899) = Emotional/Wellness (Free Write)
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
    color: "purple",
    bgGradient: "from-[#a855f7] to-[#9333ea]",
    bgLight: "bg-[#a855f7]/10",
    borderColor: "border-[#a855f7]/30",
    textColor: "text-[#a855f7]",
    ringColor: "focus:ring-[#a855f7]",
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
    bgGradient: "from-[#00d9ff] to-[#1dd1a1]",
    bgLight: "bg-[#00d9ff]/10",
    borderColor: "border-[#00d9ff]/30",
    textColor: "text-[#00d9ff]",
    ringColor: "focus:ring-[#00d9ff]",
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
    bgGradient: "from-[#3b82f6] to-[#6366f1]",
    bgLight: "bg-[#3b82f6]/10",
    borderColor: "border-[#3b82f6]/30",
    textColor: "text-[#3b82f6]",
    ringColor: "focus:ring-[#3b82f6]",
    placeholder: "Select an assignment above, or tell me about a recent session...",
    placeholderWithAssignment: "How did it go? What stood out to you?",
    description: "Reflect on sessions",
    tooltip: "Reflect on completed assignments to identify what went well and areas to grow",
    showAssignmentSelector: true,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  research: {
    label: "Research",
    color: "orange",
    bgGradient: "from-[#f59e0b] to-[#ea8c55]",
    bgLight: "bg-[#f59e0b]/10",
    borderColor: "border-[#f59e0b]/30",
    textColor: "text-[#f59e0b]",
    ringColor: "focus:ring-[#f59e0b]",
    placeholder: "What terminology, domain, or topic do you want to explore?",
    placeholderWithAssignment: "What vocabulary or context do you need for this assignment?",
    description: "Vocab & terminology",
    tooltip: "Research terminology, domain-specific vocabulary, and background context",
    showAssignmentSelector: true,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
  },
  patterns: {
    label: "Patterns",
    color: "magenta",
    bgGradient: "from-[#d946ef] to-[#a855f7]",
    bgLight: "bg-[#d946ef]/10",
    borderColor: "border-[#d946ef]/30",
    textColor: "text-[#d946ef]",
    ringColor: "focus:ring-[#d946ef]",
    placeholder: "Ask about trends in your work, recurring challenges, or growth areas...",
    placeholderWithAssignment: "What patterns do you notice in assignments like this?",
    description: "Analyze your growth",
    tooltip: "Discover trends in your work, recurring challenges, and track your growth over time",
    showAssignmentSelector: true,
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  },
  "free-write": {
    label: "Free Write",
    color: "magenta",
    bgGradient: "from-[#ec4899] to-[#f472b6]",
    bgLight: "bg-[#ec4899]/10",
    borderColor: "border-[#ec4899]/30",
    textColor: "text-[#ec4899]",
    ringColor: "focus:ring-[#ec4899]",
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
  { id: "energized", label: "Energized", color: "emerald", description: "Feeling great" },
  { id: "calm", label: "Calm", color: "teal", description: "At peace" },
  { id: "okay", label: "Okay", color: "amber", description: "Neutral" },
  { id: "overwhelmed", label: "Overwhelmed", color: "orange", description: "Stressed" },
  { id: "drained", label: "Drained", color: "rose", description: "Tired" },
] as const;

// Chat feedback options (simple and conversation-focused)
const CHAT_FEEDBACK_OPTIONS = [
  { id: "helpful", label: "Helpful", sentiment: "positive" },
  { id: "okay", label: "Okay", sentiment: "neutral" },
  { id: "not-helpful", label: "Not what I needed", sentiment: "negative" },
] as const;

export default function ElyaInterface({ userData, preFillMessage, onMessageSent, recentAssignments = [], initialMode = "chat", lockedAssignmentId = null, continueConversationId = null }: ElyaInterfaceProps) {
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
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConfig = modeConfig[mode];
  const selectedAssignmentData = recentAssignments.find(a => a.id === selectedAssignment);

  // Check if we have a locked assignment (from URL parameter)
  const isAssignmentLocked = !!lockedAssignmentId;
  const lockedAssignmentData = lockedAssignmentId ? recentAssignments.find(a => a.id === lockedAssignmentId) : null;

  // Auto-select locked assignment when provided
  useEffect(() => {
    if (lockedAssignmentId && !selectedAssignment) {
      setSelectedAssignment(lockedAssignmentId);
    }
  }, [lockedAssignmentId, selectedAssignment]);

  // Update assignment prep_status when in prep mode with an assignment
  const updatePrepStatus = useCallback(async (assignmentId: string, status: 'in_progress' | 'completed') => {
    if (!assignmentId) return;

    try {
      const { error } = await supabase
        .from("assignments")
        .update({ prep_status: status })
        .eq("id", assignmentId);

      if (error) {
        console.error("Error updating prep_status:", error);
      }
    } catch (err) {
      console.error("Error updating prep_status:", err);
    }
  }, []);

  // Sync mode with initialMode prop when it changes (e.g., from URL params)
  useEffect(() => {
    if (initialMode && initialMode !== mode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  // Get the appropriate placeholder based on mode and assignment selection
  const getPlaceholder = () => {
    if (selectedAssignment && currentConfig.showAssignmentSelector) {
      return currentConfig.placeholderWithAssignment;
    }
    return currentConfig.placeholder;
  };

  // Load conversation from Supabase on mount
  // Prioritizes: continueConversationId > lockedAssignmentId (fresh) > most recent active
  useEffect(() => {
    const loadConversation = async () => {
      if (!userData?.id) return;

      // If we have a specific conversation ID to continue (from journal page)
      // Load that specific conversation regardless of its active status
      if (continueConversationId) {
        const { data: specificConvo } = await supabase
          .from("elya_conversations")
          .select("*")
          .eq("id", continueConversationId)
          .eq("user_id", userData.id)
          .single();

        if (specificConvo) {
          setConversationId(specificConvo.id);
          setMode((specificConvo.mode as ElyaMode) || "chat");
          setSelectedAssignment(specificConvo.assignment_id || null);
          const messages = specificConvo.messages as any[] | null;
          if (messages && messages.length > 0) {
            setMessages(messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })));
          }
          // Re-activate the conversation so it can be continued
          await supabase
            .from("elya_conversations")
            .update({ is_active: true, updated_at: new Date().toISOString() })
            .eq("id", continueConversationId);
        }
        return;
      }

      // If we have a locked assignment (from URL), don't load existing conversation
      // Start fresh in the specified mode with the specified assignment
      if (lockedAssignmentId) {
        return;
      }

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
  }, [userData?.id, lockedAssignmentId, continueConversationId]);

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

  // Check if assignment already has a wellness check-in (to prevent duplicate prompts)
  const checkExistingWellnessCheckin = async (assignmentId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data: existingCheckin } = await supabase
        .from("wellness_checkins")
        .select("id")
        .eq("assignment_id", assignmentId)
        .eq("user_id", session.user.id)
        .limit(1)
        .single();

      return !!existingCheckin;
    } catch {
      return false;
    }
  };

  // Submit post-debrief wellness check-in
  const submitWellnessCheckin = async (feeling: string) => {
    if (!userData?.id || !selectedAssignment) return;

    setSubmittingWellness(true);
    try {
      // Get auth session for API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("No session found for wellness check-in");
        setShowWellnessPrompt(false);
        setSubmittingWellness(false);
        return;
      }

      const response = await fetch("/api/wellness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
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
        // After wellness logged, proceed to the conversation feedback modal
        setShowMoodPicker(true);
      } else {
        // If API fails, still proceed to mood picker to close conversation
        console.warn("Wellness check-in failed, proceeding to feedback");
        setShowWellnessPrompt(false);
        setShowMoodPicker(true);
      }
    } catch (error) {
      console.error("Error submitting wellness check-in:", error);
      // Proceed to mood picker even on error
      setShowWellnessPrompt(false);
      setShowMoodPicker(true);
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

    // Update prep_status to 'in_progress' when first message is sent in prep mode
    const userMessageCount = messages.filter(m => m.role === "user").length;
    if (mode === "prep" && selectedAssignment && userMessageCount === 0) {
      updatePrepStatus(selectedAssignment, 'in_progress');
    }

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
      // Get auth token for API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userId: userData?.id,
          context: {
            type: mode,
            mode_label: currentConfig.label,
            mode_description: currentConfig.description,
            assignment_id: selectedAssignment,
            assignment_title: selectedAssignmentData?.title,
            assignment_type: selectedAssignmentData?.assignment_type,
            assignment_date: selectedAssignmentData?.date,
            assignment_time: selectedAssignmentData?.time,
            assignment_setting: selectedAssignmentData?.setting,
            assignment_description: selectedAssignmentData?.description,
            assignment_duration: selectedAssignmentData?.duration_minutes,
            assignment_location_type: selectedAssignmentData?.location_type
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

  const startNewConversation = async () => {
    // Only show mood picker if there's a meaningful conversation (more than just opening message)
    if (messages.length > 1 && conversationId) {
      // For debrief/free-write with assignment, check if wellness prompt should show
      if ((mode === "debrief" || mode === "free-write") && selectedAssignment) {
        // Check if assignment already has a wellness check-in
        const hasExistingCheckin = await checkExistingWellnessCheckin(selectedAssignment);
        if (!hasExistingCheckin) {
          // Show wellness prompt instead of mood picker for debrief sessions
          setShowWellnessPrompt(true);
          return;
        }
      }
      setShowMoodPicker(true);
    } else {
      setShowNewChatModal(true);
    }
  };

  // Save feedback and end conversation with AI-generated title and tags
  const saveFeedbackAndEndConversation = async (feedbackId: string | null) => {
    setSavingMood(true);

    // Find the sentiment for this feedback
    const feedbackData = CHAT_FEEDBACK_OPTIONS.find(f => f.id === feedbackId);

    if (conversationId && messages.length > 1) {
      // First, save the feedback data immediately
      await supabase
        .from("elya_conversations")
        .update({
          is_active: false,
          mood_emoji: feedbackId, // Store the feedback ID (e.g., "helpful", "okay", "not-helpful")
          sentiment: feedbackData?.sentiment || null,
          user_feedback: feedbackText.trim() || null, // Store optional feedback text
          ended_at: new Date().toISOString()
        })
        .eq("id", conversationId);

      // Then, generate AI title and tags asynchronously (don't block UI)
      generateTitleAndTags(conversationId, messages).catch(err => {
        console.error("Error generating title/tags:", err);
      });
    }

    // Update prep_status to 'completed' when ending a prep conversation with an assignment
    if (mode === "prep" && selectedAssignment && messages.filter(m => m.role === "user").length > 0) {
      updatePrepStatus(selectedAssignment, 'completed');
    }

    // Update debriefed to true when ending a debrief conversation with an assignment
    if (mode === "debrief" && selectedAssignment && messages.filter(m => m.role === "user").length > 0) {
      await supabase
        .from("assignments")
        .update({ debriefed: true })
        .eq("id", selectedAssignment);
    }

    // Reset state
    setConversationId(null);
    setSelectedAssignment(null);
    setMessages([{ role: "elya", content: OPENING_MESSAGE, timestamp: new Date() }]);
    setShowWellnessPrompt(false);
    setWellnessSubmitted(false);
    setShowMoodPicker(false);
    setSavingMood(false);
    setFeedbackText("");
    setSelectedFeedback(null);
  };

  // Generate AI title and tags for conversation
  const generateTitleAndTags = async (convoId: string, convoMessages: Message[]) => {
    try {
      const response = await fetch("/api/conversation/generate-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convoId,
          messages: convoMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          mode: mode
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate metadata");
      }

      // The API will update the database directly
    } catch (error) {
      console.error("Error generating conversation metadata:", error);
    }
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

  // Dynamic styles based on mode - subtle left accent only
  const getLeftAccentStyle = () => {
    switch (mode) {
      case "chat": return "border-l-violet-500/50";
      case "prep": return "border-l-teal-500/50";
      case "debrief": return "border-l-blue-500/50";
      case "research": return "border-l-amber-500/50";
      case "patterns": return "border-l-fuchsia-500/50";
      case "free-write": return "border-l-rose-500/50";
      default: return "border-l-slate-700";
    }
  };

  const filteredAssignments = getFilteredAssignments();

  return (
    <div className="h-full flex flex-col" ref={containerRef}>
      <div className={`flex-1 rounded-xl border border-slate-800 border-l-2 ${getLeftAccentStyle()} bg-slate-900 overflow-hidden flex flex-col min-h-[688px] max-h-[calc(100vh-180px)] transition-colors duration-300`}>

        {/* Header - Hero style */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-800/30">
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
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 text-sm hover:bg-slate-800 hover:border-slate-600 transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New
          </button>
        </div>

        {/* Assignment Selector - Shows for relevant modes */}
        {currentConfig.showAssignmentSelector && (filteredAssignments.length > 0 || isAssignmentLocked) && (
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/30">
            <div className="flex items-center gap-2">
              <span className={`text-xs ${currentConfig.textColor}`}>
                {mode === "prep" ? "Preparing for:" : mode === "debrief" ? "Debriefing:" : "Assignment:"}
              </span>
              {isAssignmentLocked && lockedAssignmentData ? (
                // Show locked assignment as read-only display
                <div className={`flex-1 px-3 py-1.5 rounded-lg border ${currentConfig.borderColor} bg-slate-800/50 text-slate-200 text-sm`}>
                  {lockedAssignmentData.title} ({lockedAssignmentData.date}) - {lockedAssignmentData.assignment_type}
                </div>
              ) : (
                // Show editable dropdown
                <select
                  value={selectedAssignment || ""}
                  onChange={(e) => setSelectedAssignment(e.target.value || null)}
                  className={`flex-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-sm focus:outline-none focus:ring-1 ${currentConfig.ringColor}`}
                >
                  <option value="">No assignment selected</option>
                  {filteredAssignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.date}) - {a.assignment_type}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Prep Mode Quick Actions */}
        {mode === "prep" && selectedAssignment && (
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-800/20">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#9ca3af] mr-1">Quick actions:</span>
              <motion.button
                onClick={() => {
                  const assignmentType = selectedAssignmentData?.assignment_type || "this assignment";
                  setInput(`Generate key vocabulary and terminology I should know for a ${assignmentType} assignment. Include both English terms and their interpretations.`);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500/10 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Generate Vocabulary
              </motion.button>
              <motion.button
                onClick={() => {
                  const assignmentType = selectedAssignmentData?.assignment_type || "this assignment";
                  const setting = selectedAssignmentData?.setting || "";
                  setInput(`What topics and discussions should I anticipate for this ${assignmentType} assignment${setting ? ` at ${setting}` : ""}? What might come up?`);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Anticipate Topics
              </motion.button>
              <motion.button
                onClick={() => {
                  const assignmentType = selectedAssignmentData?.assignment_type || "this assignment";
                  const setting = selectedAssignmentData?.setting || "";
                  setInput(`Help me understand the world of this ${assignmentType} assignment${setting ? ` at ${setting}` : ""}. Who are the key players, what are the power dynamics, what procedures should I know, and what's the emotional landscape like?`);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Explain This Setting
              </motion.button>
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
                        className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 mt-1 elya-orb-sm"
                        animate={isThinking ? {
                          boxShadow: [
                            "0 0 0 0 rgba(168, 85, 247, 0)",
                            "0 0 0 10px rgba(168, 85, 247, 0.3)",
                            "0 0 0 0 rgba(168, 85, 247, 0)"
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
                          ? `${currentConfig.bgLight} border ${currentConfig.borderColor} text-[#d1d5db]`
                          : "bg-[#252d46] border border-[#1f1a30] text-white ml-12"
                      }`}
                      layout
                    >
                      {isThinking ? (
                        <ThinkingDots color={currentConfig.color} />
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs text-[#9ca3af] mt-2">{message.timestamp.toLocaleTimeString()}</p>
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
        <div className="px-4 py-4 bg-slate-800/20 border-t border-slate-800 flex-shrink-0 space-y-3">

          {/* Post-Debrief Wellness Prompt */}
          <AnimatePresence>
            {showWellnessPrompt && !wellnessSubmitted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-[#a855f7]/30 bg-gradient-to-r from-[#a855f7]/10 to-[#ec4899]/10 p-4 mb-3">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-medium text-white">How are you feeling after this session?</p>
                        <p className="text-xs text-[#d1d5db]">Optional - helps track how different assignments affect you</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        // Skip wellness and proceed to conversation feedback
                        setShowWellnessPrompt(false);
                        setShowMoodPicker(true);
                      }}
                      className="text-[#9ca3af] hover:text-white transition-colors px-2 py-1 text-xs"
                      title="Skip"
                    >
                      Skip
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
                          <span>{feeling.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
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
                        : "bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] hover:text-slate-300 border border-white/[0.08]"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    layout
                  >
                    {config.icon}
                    {config.label}
                  </motion.button>
                  {/* Tooltip with 800ms delay */}
                  <div className={`absolute bottom-full mb-2 w-44 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 text-center leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-[800ms] pointer-events-none z-50 shadow-xl ${
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
                className={`flex-1 px-4 py-3 rounded-xl border border-[#252d46] bg-[#1a1f3a] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 ${currentConfig.ringColor} focus:border-transparent resize-none transition-all duration-200`}
              />
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={getPlaceholder()}
                className={`flex-1 px-4 py-3 rounded-xl border border-[#252d46] bg-[#1a1f3a] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 ${currentConfig.ringColor} focus:border-transparent transition-all duration-200`}
              />
            )}
            {speechSupported && (
              <button
                onClick={toggleSpeechRecognition}
                className={`px-4 py-3 rounded-xl border transition-colors ${
                  isListening
                    ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                    : "border-[#252d46] bg-[#252d46] text-[#9ca3af] hover:bg-[#1f1a30]"
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
          <div className="bg-[#1a1f3a] rounded-xl border border-[#252d46] max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full elya-orb-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Start New Chat?</h3>
            </div>
            <p className="text-sm text-[#d1d5db] mb-6">
              Your current conversation will be saved and you can start fresh with Elya.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[#252d46] text-[#d1d5db] hover:bg-[#252d46] transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmNewConversation}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#a855f7] hover:bg-[#9333ea] text-white font-medium text-sm transition-colors"
              >
                Start New Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showMoodPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1f3a] rounded-xl border border-[#252d46] max-w-md w-full p-6 shadow-2xl"
          >
            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full overflow-hidden elya-orb">
                <img src="/elya.jpg" alt="Elya" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Was this chat helpful?</h3>
              <p className="text-sm text-[#d1d5db]">
                Your feedback helps Elya improve.
              </p>
            </div>

            {/* Feedback Options - now just selects, doesn't submit */}
            <div className="flex justify-center gap-3 mb-4">
              {CHAT_FEEDBACK_OPTIONS.map(({ id, label }) => {
                const isSelected = selectedFeedback === id;
                return (
                  <motion.button
                    key={id}
                    onClick={() => setSelectedFeedback(id)}
                    disabled={savingMood}
                    className={`px-5 py-2.5 rounded-lg border transition-all text-sm font-medium disabled:opacity-50 ${
                      id === 'helpful'
                        ? isSelected
                          ? 'border-emerald-500 bg-emerald-500/30 text-emerald-200 ring-2 ring-emerald-500/50'
                          : 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:border-emerald-500/50'
                        : id === 'okay'
                        ? isSelected
                          ? 'border-slate-400 bg-slate-600/50 text-slate-100 ring-2 ring-slate-400/50'
                          : 'border-slate-600 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 hover:border-slate-500'
                        : isSelected
                          ? 'border-rose-500 bg-rose-500/30 text-rose-200 ring-2 ring-rose-500/50'
                          : 'border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:border-rose-500/50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>

            {/* Optional Feedback Text */}
            <div className="mb-5">
              <label className="block text-xs text-slate-400 mb-2">
                Anything else you'd like to share? (optional)
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="What worked well? What could be better?"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-[#252d46] bg-[#252d46]/30 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-[#a855f7] resize-none"
              />
            </div>

            {/* Done Button */}
            <div className="flex gap-3">
              <button
                onClick={() => saveFeedbackAndEndConversation(null)}
                disabled={savingMood}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[#252d46] text-[#d1d5db] hover:bg-[#252d46] transition-colors font-medium text-sm disabled:opacity-50"
              >
                Skip
              </button>
              <button
                onClick={() => saveFeedbackAndEndConversation(selectedFeedback)}
                disabled={savingMood}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#a855f7] hover:bg-[#9333ea] text-white font-medium text-sm transition-colors disabled:opacity-50"
              >
                {savingMood ? "Saving..." : "Done"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
