"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

export default function CommunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<"connections" | "suggested" | "messages" | "discussions" | "mentor">("connections");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
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
      setLoading(false);
    };
    loadUserData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  // Mock connections data
  const myConnections = [
    {
      id: "1",
      name: "Sarah Johnson",
      strongDomains: ["Linguistic", "Cognitive"],
      specialties: ["Medical", "Mental Health"],
      yearsExperience: 12,
      lastMessage: "Thanks for the oncology tips!",
      lastMessageTime: "2 hours ago",
      unreadCount: 0,
      openToMentoring: true
    },
    {
      id: "2",
      name: "Marcus Chen",
      strongDomains: ["Linguistic", "Interpersonal"],
      specialties: ["Medical", "Legal"],
      yearsExperience: 8,
      lastMessage: "Let's grab coffee next week",
      lastMessageTime: "1 day ago",
      unreadCount: 2,
      openToMentoring: true
    },
    {
      id: "3",
      name: "Taylor Rodriguez",
      strongDomains: ["Cultural", "Cognitive"],
      specialties: ["Educational", "VRS"],
      yearsExperience: 5,
      lastMessage: "See you at the conference!",
      lastMessageTime: "3 days ago",
      unreadCount: 0,
      openToMentoring: false
    }
  ];

  // Mock suggested connections based on user's weak areas
  const suggestedConnections = [
    {
      id: "4",
      name: "Dr. Patricia Williams",
      strongDomains: ["Cultural", "Interpersonal"],
      specialties: ["Educational", "Community"],
      yearsExperience: 15,
      bio: "Educational interpreter with Deaf community background. Passionate about cultural mediation.",
      reason: "Strong in Cultural domain (88%) - matches your development area",
      basedOnDomain: "Cultural",
      openToMentoring: true,
      linkedinUrl: "https://linkedin.com/in/pwilliams"
    },
    {
      id: "5",
      name: "James Park",
      strongDomains: ["Linguistic", "Cognitive"],
      specialties: ["Medical", "Scientific"],
      yearsExperience: 10,
      bio: "Specialized in medical and scientific interpreting. Happy to help with terminology building.",
      reason: "Your last 3 medical debriefs showed terminology gaps - James excels in medical vocabulary",
      basedOnDomain: "Linguistic",
      openToMentoring: true,
      linkedinUrl: "https://linkedin.com/in/jamespark"
    },
    {
      id: "6",
      name: "Elena Martinez",
      strongDomains: ["Interpersonal", "Cultural"],
      specialties: ["Legal", "Community"],
      yearsExperience: 9,
      bio: "Legal interpreter focusing on team collaboration and ethical decision-making.",
      reason: "Strong in Interpersonal domain - can help with team collaboration skills",
      basedOnDomain: "Interpersonal",
      openToMentoring: true,
      linkedinUrl: null
    }
  ];

  // Mock conversations
  const conversations = [
    {
      id: "1",
      name: "Sarah Johnson",
      messages: [
        { sender: "Sarah Johnson", content: "Hey! How did the oncology appointment go?", timestamp: "Yesterday 3:15 PM" },
        { sender: "You", content: "It went really well! Your flashcard tip was super helpful.", timestamp: "Yesterday 3:42 PM" },
        { sender: "Sarah Johnson", content: "That's great! Feel free to reach out anytime you need prep help.", timestamp: "Yesterday 4:10 PM" },
        { sender: "You", content: "Thanks for the oncology tips!", timestamp: "Today 9:30 AM" }
      ]
    },
    {
      id: "2",
      name: "Marcus Chen",
      messages: [
        { sender: "Marcus Chen", content: "I saw you're working on legal terminology. Want to grab coffee and go over some terms?", timestamp: "2 days ago 11:20 AM" },
        { sender: "You", content: "That would be amazing! When are you free?", timestamp: "2 days ago 2:15 PM" },
        { sender: "Marcus Chen", content: "Let's grab coffee next week", timestamp: "Yesterday 10:45 AM" }
      ]
    }
  ];

  // Mock community discussions
  const communityDiscussions = [
    {
      id: 1,
      domain: "Linguistic",
      title: "How do you prep for oncology appointments?",
      author: "Jamie R.",
      authorStrength: ["Linguistic", "Cognitive"],
      replies: 12,
      upvotes: 24,
      topAnswer: "I create flashcards for common oncology terms and review them the night before. Also helpful to research the specific type of cancer the patient has so you understand the context better.",
      topAnswerAuthor: "Sarah J.",
      timestamp: "2 days ago"
    },
    {
      id: 2,
      domain: "Cognitive",
      title: "Managing decision fatigue in back-to-back assignments",
      author: "Alex M.",
      authorStrength: ["Cognitive", "Interpersonal"],
      replies: 8,
      upvotes: 18,
      topAnswer: "I use the BREATHE protocol between assignments. Even 5 minutes of mental reset makes a huge difference. Also, I keep healthy snacks in my car for energy management.",
      topAnswerAuthor: "Marcus C.",
      timestamp: "4 days ago"
    },
    {
      id: 3,
      domain: "Cultural",
      title: "Navigating family dynamics in IEP meetings",
      author: "Taylor K.",
      authorStrength: ["Cultural", "Interpersonal"],
      replies: 15,
      upvotes: 31,
      topAnswer: "Remember you're not mediating the conflict - you're interpreting it. Stay neutral but aware of cultural context. I also make sure to prep on family communication styles beforehand.",
      topAnswerAuthor: "Dr. Patricia W.",
      timestamp: "1 week ago"
    },
    {
      id: 4,
      domain: "Interpersonal",
      title: "When to speak up about ethical concerns in team settings",
      author: "Jordan S.",
      authorStrength: ["Interpersonal", "Cognitive"],
      replies: 10,
      upvotes: 22,
      topAnswer: "I follow the RID Code of Professional Conduct. If something feels off, I request a private moment with the team coordinator. Document everything.",
      topAnswerAuthor: "Elena M.",
      timestamp: "5 days ago"
    }
  ];

  const getColorClasses = (domain: string) => {
    const colors: any = {
      Linguistic: { border: "border-teal-500/30", bg: "bg-teal-500/10", text: "text-teal-400" },
      Cultural: { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400" },
      Cognitive: { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-400" },
      Interpersonal: { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400" }
    };
    return colors[domain];
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-50">Community</h1>
          <p className="mt-1 text-sm text-slate-400">Connect with interpreters, share knowledge, and grow together</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-slate-800 overflow-x-auto">
          {[
            { key: "connections", label: "My Connections", count: myConnections.length },
            { key: "suggested", label: "Suggested", count: suggestedConnections.length },
            { key: "messages", label: "Messages", count: myConnections.filter(c => c.unreadCount > 0).length },
            { key: "discussions", label: "Discussions", count: null },
            { key: "mentor", label: "Become a Mentor", count: null }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                selectedTab === tab.key
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  selectedTab === tab.key ? "bg-teal-500/20 text-teal-300" : "bg-slate-700 text-slate-400"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {selectedTab === "connections" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-100">Your Network</h3>
                <button className="px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-sm font-medium border border-teal-500/30 transition-all">
                  Find Interpreters
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myConnections.map((connection) => (
                  <div key={connection.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-100 mb-1">{connection.name}</h4>
                        <p className="text-xs text-slate-400">{connection.yearsExperience} years experience</p>
                        {connection.openToMentoring && (
                          <span className="inline-block mt-2 px-2 py-1 rounded-md bg-violet-500/20 text-violet-400 text-xs">
                            Open to Mentoring
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-slate-500 mb-1">Strong in:</p>
                      <div className="flex gap-1 flex-wrap">
                        {connection.strongDomains.map((domain, idx) => (
                          <span key={idx} className={`px-2 py-0.5 rounded-md text-xs ${getColorClasses(domain).bg} ${getColorClasses(domain).text}`}>
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-1">Specialties:</p>
                      <div className="flex gap-1 flex-wrap">
                        {connection.specialties.map((spec, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-400 text-xs">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedConversation(connection.id);
                        setSelectedTab("messages");
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-teal-500 text-slate-950 text-sm font-medium hover:bg-teal-400 transition-colors"
                    >
                      Message
                    </button>
                  </div>
                ))}
              </div>

              {myConnections.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-400 mb-4">You haven't connected with anyone yet</p>
                  <button className="px-6 py-3 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors">
                    Find Interpreters to Connect With
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === "suggested" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-lg font-semibold text-slate-100">Suggested Connections</h3>
              </div>
              <p className="text-sm text-slate-400 mb-6">Based on your ECCI profile and recent debriefs, these interpreters can help you grow</p>

              <div className="space-y-4">
                {suggestedConnections.map((suggestion) => (
                  <div key={suggestion.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-100">{suggestion.name}</h4>
                          {suggestion.openToMentoring && (
                            <span className="px-2 py-1 rounded-md bg-violet-500/20 text-violet-400 text-xs font-medium">
                              Open to Mentoring
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{suggestion.yearsExperience} years experience</p>

                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-3">
                          <p className="text-sm text-amber-300">{suggestion.reason}</p>
                        </div>

                        <p className="text-sm text-slate-300 mb-3">{suggestion.bio}</p>

                        <div className="flex items-center gap-4 mb-3">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Strong in:</p>
                            <div className="flex gap-1 flex-wrap">
                              {suggestion.strongDomains.map((domain, idx) => (
                                <span key={idx} className={`px-2 py-0.5 rounded-md text-xs ${getColorClasses(domain).bg} ${getColorClasses(domain).text}`}>
                                  {domain}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Specialties:</p>
                            <div className="flex gap-1 flex-wrap">
                              {suggestion.specialties.map((spec, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-400 text-xs">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {suggestion.linkedinUrl && (
                          <a
                            href={suggestion.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mb-3"
                          >
                            View LinkedIn Profile →
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 text-sm font-medium hover:bg-teal-400 transition-colors">
                        Send Connection Request
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors">
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === "messages" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation List */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Messages</h3>
                <div className="space-y-2">
                  {myConnections.map((connection) => (
                    <button
                      key={connection.id}
                      onClick={() => setSelectedConversation(connection.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedConversation === connection.id
                          ? "bg-teal-500/20 border border-teal-500/30"
                          : "bg-slate-800/50 border border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-medium text-slate-100">{connection.name}</p>
                        {connection.unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-teal-500 text-slate-950 text-xs font-medium">
                            {connection.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{connection.lastMessage}</p>
                      <p className="text-xs text-slate-500 mt-1">{connection.lastMessageTime}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                  {/* Conversation Header */}
                  <div className="border-b border-slate-800 p-4">
                    <h3 className="font-semibold text-slate-100">
                      {myConnections.find(c => c.id === selectedConversation)?.name}
                    </h3>
                  </div>

                  {/* Messages */}
                  <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                    {conversations.find(c => c.id === selectedConversation)?.messages.map((message, idx) => (
                      <div key={idx} className={`flex ${message.sender === "You" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] ${
                          message.sender === "You"
                            ? "bg-teal-500/20 border border-teal-500/30"
                            : "bg-slate-800 border border-slate-700"
                        } rounded-lg p-3`}>
                          <p className="text-sm text-slate-100 mb-1">{message.content}</p>
                          <p className="text-xs text-slate-500">{message.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-slate-800 p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                      <button className="px-6 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors">
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
                  <p className="text-slate-400">Select a conversation to view messages</p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === "discussions" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Community Knowledge Base</h3>
              <p className="text-sm text-slate-400 mb-4">Real interpreters sharing what actually works, organized by ECCI competency</p>

              <div className="flex gap-2 mb-6 overflow-x-auto">
                <button className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 text-sm font-medium whitespace-nowrap">
                  All Domains
                </button>
                {["Linguistic", "Cultural", "Cognitive", "Interpersonal"].map((domain) => (
                  <button key={domain} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors whitespace-nowrap">
                    {domain}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {communityDiscussions.map((discussion) => (
                  <div key={discussion.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-5 hover:border-slate-600 transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${getColorClasses(discussion.domain).bg} ${getColorClasses(discussion.domain).text}`}>
                            {discussion.domain}
                          </span>
                          <span className="text-xs text-slate-500">{discussion.timestamp}</span>
                        </div>
                        <h4 className="font-semibold text-slate-100 mb-2">{discussion.title}</h4>
                        <p className="text-sm text-slate-400 mb-3">by {discussion.author}</p>
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-slate-500">Top Answer by {discussion.topAnswerAuthor}:</p>
                            <span className="text-xs text-emerald-400">✓ Verified</span>
                          </div>
                          <p className="text-sm text-slate-300">{discussion.topAnswer}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>↑ {discussion.upvotes} upvotes</span>
                      <span>💬 {discussion.replies} replies</span>
                      <button className="text-teal-400 hover:text-teal-300">View Discussion →</button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-6 w-full px-4 py-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium border border-blue-500/30 transition-all">
                Ask the Community
              </button>
            </div>
          </div>
        )}

        {selectedTab === "mentor" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Become a Mentor</h3>
              <p className="text-sm text-slate-400 mb-6">Share your expertise, help new interpreters succeed, and strengthen the community</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-2xl font-bold text-violet-400 mb-1">0</p>
                  <p className="text-sm text-slate-400">Connections helped</p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-2xl font-bold text-teal-400 mb-1">0h</p>
                  <p className="text-sm text-slate-400">Community contributions</p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-2xl font-bold text-emerald-400 mb-1">0</p>
                  <p className="text-sm text-slate-400">Discussion replies</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6 mb-6">
                <h4 className="font-semibold text-slate-100 mb-4">Set Up Your Public Profile</h4>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 mb-4">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-2 focus:ring-teal-400" />
                      <span className="text-sm text-slate-300">I'm open to mentoring other interpreters</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Your Strong ECCI Domains (auto-detected from debriefs)</label>
                    <div className="flex gap-2 flex-wrap">
                      {["Linguistic", "Cultural", "Cognitive", "Interpersonal"].map((domain) => (
                        <button key={domain} className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-sm hover:border-teal-500 hover:bg-teal-500/10 hover:text-teal-300 transition-all">
                          {domain}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Based on your ECCI scores. Select domains where you score 80% or higher.</p>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Your Specialty Settings</label>
                    <div className="flex gap-2 flex-wrap">
                      {["Medical", "Legal", "Educational", "Mental Health", "VRS", "Community"].map((setting) => (
                        <button key={setting} className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-sm hover:border-teal-500 hover:bg-teal-500/10 hover:text-teal-300 transition-all">
                          {setting}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Bio</label>
                    <textarea
                      placeholder="Share your background, expertise, and how you can help others..."
                      className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">LinkedIn Profile (optional)</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                    <p className="text-xs text-slate-500 mt-2">Other interpreters can view your LinkedIn to learn more about your background</p>
                  </div>
                </div>

                <button className="mt-6 w-full px-6 py-3 rounded-lg bg-violet-500 text-slate-950 font-semibold hover:bg-violet-400 transition-colors">
                  Save Profile & Make Discoverable
                </button>
              </div>

              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                <p className="text-sm text-slate-300">
                  <strong className="text-slate-100">How it works:</strong> When you're marked as "Open to Mentoring", interpreters who are developing in your strong domains will see you in their Suggested Connections. They can send you a connection request and message you directly.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
