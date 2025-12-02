"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

// Opening prompts based on feeling
const getOpeningPrompt = (feeling: string | null) => {
  switch (feeling) {
    case 'overwhelmed':
      return "I can tell things feel heavy right now. There's no pressure to figure anything out - I'm just here to listen. What's been on your mind?";
    case 'drained':
      return "It sounds like you've been giving a lot of yourself lately. Sometimes we just need someone to hear us. What would feel good to get off your chest?";
    case 'okay':
      return "Even when things are okay on the surface, there can be a lot going on underneath. I'm here if you want to explore anything.";
    case 'calm':
      return "This seems like a good moment for reflection. Is there anything you've been wanting to process or think through?";
    case 'energized':
      return "Great energy! Sometimes when we're feeling good, it's a perfect time to capture insights or process things we've been putting off. What's on your mind?";
    default:
      return "I'm here to listen. You can type whatever's on your mind - there's no agenda, no right or wrong thing to say. What would you like to talk about?";
  }
};

export default function FreeWritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const feeling = searchParams.get('feeling');

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }
      setUser(session.user);

      // Create a new session ID for this free write
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);

      // Add Elya's opening message
      const openingMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: getOpeningPrompt(feeling),
        timestamp: new Date()
      };
      setMessages([openingMessage]);

      setLoading(false);
    };
    loadUser();
  }, [router, feeling]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })).concat([
            { role: "user", content: userMessage.content }
          ]),
          userId: user.id,
          context: {
            type: "free_write",
            session_id: sessionId,
            feeling: feeling,
            mode: "holding_space" // Signal to Elya to be supportive, not solution-oriented
          }
        })
      });

      const data = await response.json();

      if (data.reply) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Take your time - I'm still here when you're ready.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <NavBar />

      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/wellness')}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-slate-100">Free Write</h1>
                <p className="text-xs text-slate-400">A safe space to process your thoughts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-sm text-slate-400">Elya is listening</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-500/20 to-rose-500/20 border border-purple-500/30 text-slate-100'
                      : 'bg-slate-800/50 border border-slate-700 text-slate-200'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💜</span>
                      <span className="text-xs font-medium text-purple-300">Elya</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💜</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write whatever's on your mind..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-100 placeholder-slate-500 resize-none text-sm"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || sending}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-rose-500 hover:from-purple-400 hover:to-rose-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all"
            >
              {sending ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
