"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import { motion, AnimatePresence } from "framer-motion";

// Mood emoji options
const MOOD_EMOJIS = [
  { emoji: "😤", label: "Frustrated", sentiment: "difficult" },
  { emoji: "😢", label: "Sad", sentiment: "difficult" },
  { emoji: "😐", label: "Neutral", sentiment: "neutral" },
  { emoji: "😊", label: "Happy", sentiment: "joyful" },
  { emoji: "🌟", label: "Amazing", sentiment: "joyful" },
];

// Map mood to color for heatmap
const moodToColor: Record<string, string> = {
  "😤": "bg-rose-500",
  "😢": "bg-blue-500",
  "😐": "bg-slate-500",
  "😊": "bg-emerald-500",
  "🌟": "bg-amber-500",
};

// Map sentiment to color for filtering badges
const sentimentColors: Record<string, { bg: string; text: string; border: string }> = {
  difficult: { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/30" },
  neutral: { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30" },
  joyful: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
};

type Conversation = {
  id: string;
  user_id: string;
  mode: string;
  assignment_id: string | null;
  messages: any;
  message_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // New fields (may not exist in DB yet until migration runs)
  mood_emoji?: string | null;
  ai_title?: string | null;
  ai_tags?: string[] | null;
  sentiment?: string | null;
  ai_summary?: string | null;
  ended_at?: string | null;
};

type CalendarDay = {
  date: Date;
  conversations: Conversation[];
  isCurrentMonth: boolean;
  isToday: boolean;
};

export default function JournalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const [sentimentFilter, setSentimentFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setUserData(profile);

      // Load conversations
      const { data: convos, error } = await supabase
        .from("elya_conversations")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading conversations:", error);
      } else {
        setConversations(convos || []);
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

  // Filter conversations based on sentiment and search
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    if (sentimentFilter) {
      filtered = filtered.filter(c => c.sentiment === sentimentFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.ai_title?.toLowerCase().includes(query) ||
        c.ai_summary?.toLowerCase().includes(query) ||
        c.ai_tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [conversations, sentimentFilter, searchQuery]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        conversations: [],
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split("T")[0];

      const dayConvos = conversations.filter(c => {
        const convoDate = new Date(c.created_at).toISOString().split("T")[0];
        return convoDate === dateStr;
      });

      days.push({
        date,
        conversations: dayConvos,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
      });
    }

    // Next month padding to complete the grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        conversations: [],
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [currentMonth, conversations]);

  // Generate calendar days for current week
  const weekDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get start of week (Sunday)
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const days: CalendarDay[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const dayConvos = conversations.filter(c => {
        const convoDate = new Date(c.created_at).toISOString().split("T")[0];
        return convoDate === dateStr;
      });

      days.push({
        date,
        conversations: dayConvos,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
      });
    }

    return days;
  }, [currentWeek, conversations]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Generate title from conversation if no ai_title
  const getConversationTitle = (convo: Conversation) => {
    if (convo.ai_title) return convo.ai_title;

    // Fallback: generate from mode and first message
    const modeLabels: Record<string, string> = {
      chat: "Conversation with Elya",
      prep: "Assignment Prep",
      debrief: "Post-Assignment Debrief",
      research: "Research Session",
      patterns: "Pattern Exploration",
      "free-write": "Free Writing Session",
    };

    return modeLabels[convo.mode] || "Conversation";
  };

  // Get preview text from conversation
  const getPreviewText = (convo: Conversation) => {
    if (convo.ai_summary) return convo.ai_summary;

    // Fallback: get first user message
    const firstUserMsg = convo.messages?.find((m: any) => m.role === "user");
    if (firstUserMsg) {
      const text = firstUserMsg.content || "";
      return text.length > 100 ? text.substring(0, 100) + "..." : text;
    }

    return "No preview available";
  };

  // Check if user has Growth+ tier for advanced features
  const hasGrowthFeatures = userData?.subscription_tier === "growth" || userData?.subscription_tier === "pro";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <NavBar />
        <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-800 rounded w-48"></div>
            <div className="h-64 bg-slate-900/50 rounded border border-slate-800"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />

      <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              My Journal
            </h1>
            <p className="text-slate-400 mt-1">
              {conversations.length} reflection{conversations.length !== 1 ? "s" : ""} with Elya
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "list"
                  ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20"
                  : "bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-700"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "calendar"
                  ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20"
                  : "bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-700"
              }`}
            >
              Calendar
            </button>
          </div>
        </motion.div>

        {/* Filters - Growth+ only for sentiment */}
        <motion.div
          className="flex flex-wrap gap-3 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              placeholder="Search reflections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Sentiment Filter - Growth+ */}
          {hasGrowthFeatures ? (
            <div className="flex gap-2">
              <button
                onClick={() => setSentimentFilter(null)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  !sentimentFilter
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                    : "bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-700"
                }`}
              >
                All
              </button>
              {Object.entries(sentimentColors).map(([sentiment, colors]) => (
                <button
                  key={sentiment}
                  onClick={() => setSentimentFilter(sentimentFilter === sentiment ? null : sentiment)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    sentimentFilter === sentiment
                      ? `${colors.bg} ${colors.text} border ${colors.border}`
                      : "bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {sentiment}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-lg border border-slate-800">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm text-slate-500">Sentiment filtering</span>
              <span className="text-xs px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded">Growth+</span>
            </div>
          )}
        </motion.div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Left: List or Calendar */}
          <div className="flex-1">
            {viewMode === "list" ? (
              /* List View - Styled like Elya interface */
              <motion.div
                className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">Recent Reflections</h3>
                    <p className="text-xs text-violet-400">{filteredConversations.length} conversations</p>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 text-sm hover:bg-slate-800 hover:border-slate-600 transition-colors flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    New
                  </button>
                </div>

                {/* Content - darker inner bg */}
                <div className="p-3 bg-slate-950/60 max-h-[600px] overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h3 className="text-base font-semibold text-slate-300 mb-2">No reflections yet</h3>
                      <p className="text-sm text-slate-500 mb-4">Start a conversation with Elya to begin your journal</p>
                      <button
                        onClick={() => router.push("/dashboard")}
                        className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg font-medium text-sm transition-all shadow-lg shadow-teal-500/20"
                      >
                        Talk to Elya
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredConversations.map((convo, index) => (
                        <motion.div
                          key={convo.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => setSelectedConversation(convo)}
                          className={`p-3 rounded-lg cursor-pointer transition-all group ${
                            selectedConversation?.id === convo.id
                              ? "bg-violet-500/10 border border-violet-500/30"
                              : "bg-slate-800/50 border border-slate-800 hover:border-slate-700 hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Mood Emoji */}
                            <span className="text-lg">{convo.mood_emoji || "💭"}</span>

                            <div className="flex-1 min-w-0">
                              {/* Title */}
                              <p className="text-sm text-slate-200 truncate group-hover:text-violet-300 transition-colors">
                                {getConversationTitle(convo)}
                              </p>
                              {/* Date & Mode */}
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  convo.mode === "chat" ? "bg-violet-500" :
                                  convo.mode === "prep" ? "bg-teal-500" :
                                  convo.mode === "debrief" ? "bg-blue-500" :
                                  convo.mode === "research" ? "bg-amber-500" :
                                  convo.mode === "patterns" ? "bg-fuchsia-500" :
                                  "bg-rose-500"
                                }`} />
                                <span className="text-xs text-slate-500">
                                  {new Date(convo.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {convo.mode}
                                </span>
                              </div>
                            </div>

                            {/* Sentiment Badge - Growth+ */}
                            {hasGrowthFeatures && convo.sentiment && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${sentimentColors[convo.sentiment]?.bg} ${sentimentColors[convo.sentiment]?.text}`}>
                                {convo.sentiment}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Calendar View */
              <motion.div
                className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Calendar Header */}
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (calendarMode === "week") {
                          const newWeek = new Date(currentWeek);
                          newWeek.setDate(newWeek.getDate() - 7);
                          setCurrentWeek(newWeek);
                        } else {
                          setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
                        }
                      }}
                      className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-sm font-semibold text-slate-200 min-w-[140px] text-center">
                      {calendarMode === "week"
                        ? (() => {
                            const startOfWeek = new Date(currentWeek);
                            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                            const endOfWeek = new Date(startOfWeek);
                            endOfWeek.setDate(endOfWeek.getDate() + 6);
                            return `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
                          })()
                        : currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                      }
                    </h3>
                    <button
                      onClick={() => {
                        if (calendarMode === "week") {
                          const newWeek = new Date(currentWeek);
                          newWeek.setDate(newWeek.getDate() + 7);
                          setCurrentWeek(newWeek);
                        } else {
                          setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
                        }
                      }}
                      className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Week/Month Toggle */}
                  <div className="flex items-center gap-1 bg-slate-950/50 rounded-lg p-0.5">
                    <button
                      onClick={() => setCalendarMode("week")}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        calendarMode === "week"
                          ? "bg-teal-500 text-slate-950"
                          : "text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setCalendarMode("month")}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        calendarMode === "month"
                          ? "bg-teal-500 text-slate-950"
                          : "text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      Month
                    </button>
                  </div>
                </div>

                {/* Calendar Content - with darker inner bg */}
                <div className="p-3 bg-slate-950/60">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                      <div key={i} className="text-center text-[10px] font-medium text-slate-500 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  {calendarMode === "week" ? (
                    /* Week View - Compact */
                    <div className="grid grid-cols-7 gap-1">
                      {weekDays.map((day, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            if (day.conversations.length > 0) {
                              setSelectedConversation(day.conversations[0]);
                            }
                          }}
                          className={`p-2 rounded-lg relative flex flex-col items-center ${
                            day.isToday
                              ? "bg-teal-500/20 border border-teal-500/50"
                              : "bg-slate-800/50 hover:bg-slate-800 border border-slate-800"
                          } ${day.conversations.length > 0 ? "cursor-pointer" : ""}`}
                        >
                          <span className={`text-sm font-medium ${
                            day.isToday ? "text-teal-300" : "text-slate-300"
                          }`}>
                            {day.date.getDate()}
                          </span>

                          {/* Conversation count */}
                          {day.conversations.length > 0 && (
                            <div className="mt-1 flex gap-0.5">
                              {day.conversations.slice(0, 3).map((c, i) => (
                                <div
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    hasGrowthFeatures && c.mood_emoji
                                      ? moodToColor[c.mood_emoji] || "bg-teal-500"
                                      : "bg-teal-500"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Month View - Compact */
                    <div className="grid grid-cols-7 gap-0.5">
                      {calendarDays.map((day, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            if (day.conversations.length > 0) {
                              setSelectedConversation(day.conversations[0]);
                            }
                          }}
                          className={`aspect-square p-0.5 rounded relative flex flex-col items-center justify-center ${
                            day.isCurrentMonth
                              ? day.isToday
                                ? "bg-teal-500/20 border border-teal-500/50"
                                : "bg-slate-800/30 hover:bg-slate-800/50"
                              : "bg-transparent opacity-20"
                          } ${day.conversations.length > 0 ? "cursor-pointer" : ""}`}
                        >
                          <span className={`text-[10px] ${
                            day.isToday ? "text-teal-300 font-bold" : "text-slate-400"
                          }`}>
                            {day.date.getDate()}
                          </span>

                          {/* Dots for conversations */}
                          {day.conversations.length > 0 && (
                            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-px">
                              {day.conversations.slice(0, 2).map((c, i) => (
                                <div
                                  key={i}
                                  className={`w-1 h-1 rounded-full ${
                                    hasGrowthFeatures && c.mood_emoji
                                      ? moodToColor[c.mood_emoji] || "bg-teal-500"
                                      : "bg-teal-500"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Legend for Growth+ - Compact */}
                {hasGrowthFeatures && (
                  <div className="flex justify-center gap-3 px-4 py-2 border-t border-slate-800 bg-slate-800/30">
                    {MOOD_EMOJIS.map(({ emoji }) => (
                      <div key={emoji} className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${moodToColor[emoji]}`} />
                        <span className="text-[10px] text-slate-500">{emoji}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Right: Conversation Detail */}
          <AnimatePresence mode="wait">
            {selectedConversation && (
              <motion.div
                key={selectedConversation.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="hidden lg:block w-[380px] rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{selectedConversation.mood_emoji || "💭"}</span>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-100 truncate max-w-[220px]">
                          {getConversationTitle(selectedConversation)}
                        </h3>
                        <p className="text-xs text-blue-400">
                          {formatDate(selectedConversation.created_at)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Conversation Messages - darker inner bg */}
                <div className="h-[450px] overflow-y-auto p-3 space-y-3 bg-slate-950/60">
                  {selectedConversation.messages?.map((msg: any, index: number) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] p-2.5 rounded-lg text-sm ${
                          msg.role === "user"
                            ? "bg-teal-500/15 text-teal-100 border border-teal-500/20"
                            : "bg-slate-800/80 border border-slate-700 text-slate-300"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Actions */}
                <div className="px-4 py-3 border-t border-slate-800 bg-slate-800/30">
                  <button
                    onClick={() => router.push(`/dashboard?conversation=${selectedConversation.id}`)}
                    className="w-full px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg font-medium text-sm transition-all shadow-lg shadow-teal-500/20"
                  >
                    Continue Conversation
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
