import { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Sparkles, 
  RefreshCw, 
  HelpCircle, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Cpu, 
  Briefcase, 
  Layers, 
  ShieldAlert 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RecommendationItem {
  name: string;
  url: string;
  test_type: "K" | "P";
}

// In-scope catalog preview list to guide the user in the UI
const CATALOG_PREVIEW = [
  { name: "Occupational Personality Questionnaire (OPQ32)", type: "P", desc: "Global benchmark for behavioral workplace preferences." },
  { name: "Verify G+ (General Ability)", type: "K", desc: "Combined mental agility (Numerical, Deductive, Inductive)." },
  { name: "Verify Numerical Reasoning", type: "K", desc: "Quantitative critical thinking and data analysis." },
  { name: "Verify Verbal Reasoning", type: "K", desc: "Reading comprehension and verbal logic evaluation." },
  { name: "Verify Deductive Reasoning", type: "K", desc: "Structured logical deduction and system troubleshooting." },
  { name: "Verify Inductive Reasoning", type: "K", desc: "Abstract shape/diagram sequence pattern recognition." },
  { name: "Verify Coding Skills", type: "K", desc: "Technical coding and algorithm tests across languages." },
  { name: "Java 8 (New)", type: "K", desc: "Specialized Java syntax, OOP, and stream-processing skills." },
  { name: "Situational Judgment Test (SJT)", type: "P", desc: "Scenario-based simulation measuring professional workplace conduct." },
  { name: "Motivation Questionnaire (MQ)", type: "P", desc: "Measures 18 values that drive engagement and retention." }
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your SHL Conversational Assessment Recommender. I can help you select the ideal Individual Test Solutions for your hiring pipeline.\n\nTo begin, **what is the job role** or **key skills** you are looking to assess?"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [endOfConversation, setEndOfConversation] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"shortlist" | "catalog">("shortlist");
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setInputText("");
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error(`API returned standard error status ${response.status}`);
      }

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant" as const, content: data.reply }
      ]);
      
      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
      }
      setEndOfConversation(data.end_of_conversation || false);
    } catch (err: any) {
      console.error("Chat request failed:", err);
      setApiError("Failed to communicate with the recommender engine. Please ensure your Gemini Key is set.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hello! I am your SHL Conversational Assessment Recommender. I can help you select the ideal Individual Test Solutions for your hiring pipeline.\n\nTo begin, **what is the job role** or **key skills** you are looking to assess?"
      }
    ]);
    setRecommendations([]);
    setEndOfConversation(false);
    setInputText("");
    setApiError(null);
  };

  // Pre-configured scenario starters to make user exploration simple
  const scenarios = [
    { label: "Java Developer", text: "Hiring a senior Java developer who needs to write high-quality OOP code and collaborate with stakeholders." },
    { label: "Compare assessments", text: "What is the difference between Verify G+ and OPQ32?" },
    { label: "Sales Executive", text: "I'm looking to hire a fast-paced Sales manager. What behavioral assessments fit?" },
    { label: "Scope Defense Check", text: "Can you write some Python interview questions or give me legal advice?" }
  ];

  return (
    <div id="shl_app_container" className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Upper Navigation Header */}
      <header id="shl_header" className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2.5 rounded-lg flex items-center justify-center shadow-sm">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                SHL Assessment Recommender
                <span className="text-xs font-normal bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  AI Intern Assignment
                </span>
              </h1>
              <p className="text-xs text-slate-500">Conversational search over SHL Individual Test Solutions catalog</p>
            </div>
          </div>
          
          <button
            id="clear_chat_btn"
            onClick={handleClearChat}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Restart Conversation
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main id="shl_main_workspace" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Conversational Workspace (7 / 12) */}
        <section id="chat_workspace_pane" className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[580px]">
          {/* Chat Pane Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Interactive RAG Chat
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs text-slate-500 font-medium">State: Stateless</span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div id="messages_scroll_pane" className="flex-1 p-6 overflow-y-auto space-y-6 max-h-[480px]">
            <AnimatePresence initial={false}>
              {messages.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-xs text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-emerald-600 text-white rounded-tr-none"
                        : "bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 opacity-75">
                      <span className="font-semibold text-xs uppercase tracking-wider">
                        {m.role === "user" ? "Recruiter" : "SHL Agent"}
                      </span>
                    </div>
                    {/* Render basic markdown highlights / lists */}
                    <div className="whitespace-pre-wrap break-words prose prose-slate">
                      {m.content.split("\n").map((line, lIdx) => {
                        // Bold parsing **text**
                        const boldRegex = /\*\*(.*?)\*\*/g;
                        const parts = [];
                        let lastIndex = 0;
                        let match;
                        let partIdx = 0;
                        while ((match = boldRegex.exec(line)) !== null) {
                          if (match.index > lastIndex) {
                            parts.push(<span key={`text-${partIdx++}`}>{line.substring(lastIndex, match.index)}</span>);
                          }
                          parts.push(<strong key={`bold-${partIdx++}`}>{match[1]}</strong>);
                          lastIndex = boldRegex.lastIndex;
                        }
                        if (lastIndex < line.length) {
                          parts.push(<span key={`text-${partIdx++}`}>{line.substring(lastIndex)}</span>);
                        }

                        const lineContent = parts.length > 0 ? parts : line;

                        if (line.trim().startsWith("- ")) {
                          const bulletText = line.trim().substring(2);
                          const bulletParts = [];
                          let bLastIndex = 0;
                          let bMatch;
                          let bPartIdx = 0;
                          while ((bMatch = boldRegex.exec(bulletText)) !== null) {
                            if (bMatch.index > bLastIndex) {
                              bulletParts.push(<span key={`btext-${bPartIdx++}`}>{bulletText.substring(bLastIndex, bMatch.index)}</span>);
                            }
                            bulletParts.push(<strong key={`bbold-${bPartIdx++}`}>{bMatch[1]}</strong>);
                            bLastIndex = boldRegex.lastIndex;
                          }
                          if (bLastIndex < bulletText.length) {
                            bulletParts.push(<span key={`btext-${bPartIdx++}`}>{bulletText.substring(bLastIndex)}</span>);
                          }
                          const bulletContent = bulletParts.length > 0 ? bulletParts : bulletText;

                          return (
                            <ul key={lIdx} className="list-disc pl-4 my-1">
                              <li>{bulletContent}</li>
                            </ul>
                          );
                        }
                        return <p key={lIdx} className="my-1.5 min-h-[1.2rem]">{lineContent}</p>;
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-slate-50 border border-slate-200 text-slate-500 rounded-2xl px-5 py-4 rounded-tl-none text-sm flex items-center gap-3 shadow-xs">
                    <span className="flex gap-1 items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                    </span>
                    <span>Consulting vector database and Gemini...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={chatEndRef} />
          </div>

          {/* Quick Scenario Starters */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-150">
            <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              Scenario Starters (Click to test behaviors):
            </p>
            <div className="flex flex-wrap gap-2">
              {scenarios.map((sc, scIdx) => (
                <button
                  key={scIdx}
                  onClick={() => handleSendMessage(sc.text)}
                  className="bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 transition-all text-left cursor-pointer"
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Panel Form */}
          <form
            id="chat_input_form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
          >
            <input
              id="chat_text_input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask for recommendations, compare assessments, or change constraints..."
              disabled={isLoading}
              className="flex-1 bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 text-sm px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden transition-all disabled:opacity-50"
            />
            <button
              id="chat_submit_btn"
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          {/* Warning banner for errors */}
          {apiError && (
            <div className="bg-red-50 border-t border-red-200 px-6 py-3 flex items-center gap-3 text-red-700 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Shortlist Display & Catalog Guide (5 / 12) */}
        <section id="sidebar_pane" className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tabs header */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => setActiveTab("shortlist")}
              className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "shortlist"
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Active Shortlist ({recommendations.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab("catalog")}
              className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "catalog"
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <BookOpen className="w-4 h-4" />
                In-Scope Catalog
              </span>
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto max-h-[550px]">
            {activeTab === "shortlist" ? (
              <div id="shortlist_content" className="space-y-4">
                {recommendations.length > 0 ? (
                  <>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-emerald-900">Grounded Recommendations</h4>
                        <p className="text-xs text-emerald-700 mt-1">
                          The recommendations below were matched dynamically using FAISS vector search and RAG based on your hiring criteria.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {recommendations.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="border border-slate-200 bg-white hover:bg-slate-50 rounded-xl p-4 transition-all shadow-xs flex items-center justify-between group"
                        >
                          <div className="flex-1 pr-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${
                                item.test_type === "K"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}>
                                {item.test_type === "K" ? "Cognitive / Skill" : "Behavioral / Style"}
                              </span>
                            </div>
                            <h3 className="font-semibold text-sm text-slate-900 mt-1.5">{item.name}</h3>
                          </div>
                          
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white p-2 rounded-lg transition-all"
                            title="View official SHL product catalog URL"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </motion.div>
                      ))}
                    </div>

                    {endOfConversation && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center mt-6">
                        <CheckCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                        <h5 className="font-semibold text-sm text-amber-900">Conversation Complete</h5>
                        <p className="text-xs text-amber-700 mt-1">
                          The agent considers the shortlist optimal and complete! You can download this repo or start a new chat.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Layers className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-medium text-sm">No Active Recommendations</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
                      Provide details about your role, skills, or target qualities to build your grounded assessment shortlist.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div id="catalog_content" className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Scraped In-Scope Bound</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      To prevent hallucinations and secure boundaries, recommendations are restricted exclusively to these SHL Individual Test Solutions.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {CATALOG_PREVIEW.map((item, idx) => (
                    <div key={idx} className="border border-slate-150 p-3.5 rounded-xl bg-white">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-800">{item.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                          item.type === "K"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}>
                          {item.type === "K" ? "Type K" : "Type P"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer Info Area */}
      <footer id="shl_footer" className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SHL Labs - Take-home Take-away Assignment AI Intern Role</span>
          <span>© 2026 SHL and its affiliates. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
