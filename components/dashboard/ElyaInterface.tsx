"use client";

import { useState, useEffect, useRef } from "react";

type ElyaInterfaceProps = {
  userData: any;
  preFillMessage?: string;
  onMessageSent?: () => void;
};

type Message = {
  role: "elya" | "user";
  content: string;
  timestamp: Date;
};

export default function ElyaInterface({ userData, preFillMessage, onMessageSent }: ElyaInterfaceProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "elya",
      content: "Hi! I'm Elya, your AI interpreter assistant. I can help you:\n\n• Prep for assignments (research, vocab, domain knowledge)\n• Debrief sessions and track growth\n• Analyze performance patterns\n• Build skills and practice\n• Track CEUs and credentials\n\nWhat would you like to work on?",
      timestamp: new Date()
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setInput(prev => prev + finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Handle pre-fill message from parent component (e.g., "Start Prep" button)
  useEffect(() => {
    if (preFillMessage) {
      setInput(preFillMessage);
      // Scroll to Elya interface
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Focus input field
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
      // Call callback to clear the pre-fill message
      onMessageSent?.();
    }
  }, [preFillMessage, onMessageSent]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput("");

    // Add a loading message
    const loadingMessage: Message = {
      role: "elya",
      content: "Thinking...",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Call the Claude API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userId: userData?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Replace loading message with actual response
      setMessages(prev => {
        const withoutLoading = prev.slice(0, -1);
        return [
          ...withoutLoading,
          {
            role: "elya",
            content: data.response,
            timestamp: new Date()
          }
        ];
      });
    } catch (error: any) {
      console.error("Error calling Elya:", error);
      // Replace loading message with error
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

  return (
    <div className="h-full flex flex-col" ref={containerRef}>
      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-2xl overflow-hidden flex flex-col">

        {/* Chat Messages - Full Height */}
        <div className="flex-1 px-6 py-5 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                {message.role === "elya" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-semibold">E</span>
                  </div>
                )}
                <div
                  className={`flex-1 max-w-2xl rounded-lg px-4 py-3 ${
                    message.role === "elya"
                      ? "bg-violet-500/10 border border-violet-500/20 text-slate-200"
                      : "bg-teal-500/20 border border-teal-500/30 text-slate-100 ml-12"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs text-slate-500 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Area - Sticky at bottom */}
        <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800">
          {/* Quick-click suggestions */}
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              onClick={() => setInput("Help me prep for my next medical assignment")}
              className="px-3 py-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs hover:bg-teal-500/20 transition-colors"
            >
              Prep assignment
            </button>
            <button
              onClick={() => setInput("I want to debrief my last session")}
              className="px-3 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs hover:bg-violet-500/20 transition-colors"
            >
              Debrief session
            </button>
            <button
              onClick={() => setInput("Research medical terminology for cardiology")}
              className="px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs hover:bg-blue-500/20 transition-colors"
            >
              Research vocab
            </button>
            <button
              onClick={() => setInput("What patterns do you see in my performance?")}
              className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs hover:bg-amber-500/20 transition-colors"
            >
              Analyze patterns
            </button>
          </div>

          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me to prep, debrief, research, or analyze..."
              className="flex-1 px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
            />
            {speechSupported && (
              <button
                onClick={toggleSpeechRecognition}
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  isListening
                    ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                    : "border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
                title={isListening ? "Stop recording" : "Start voice input"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-6 py-3 rounded-lg bg-violet-500 text-white font-semibold hover:bg-violet-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {speechSupported ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline mr-1">
                  <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                  <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                </svg>
                Type or tap the microphone to speak
              </>
            ) : (
              "Press Enter to send"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
