import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutor-chat`;

export function TutorChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const streamChat = useCallback(async (allMessages: Msg[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages }),
    });

    if (!resp.ok || !resp.body) {
      const errorData = await resp.json().catch(() => null);
      throw new Error(errorData?.error || `Request failed with status ${resp.status}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            const snapshot = assistantSoFar;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: snapshot } : m);
              }
              return [...prev, { role: "assistant", content: snapshot }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // flush remaining
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            const snapshot = assistantSoFar;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: snapshot } : m);
              }
              return [...prev, { role: "assistant", content: snapshot }];
            });
          }
        } catch { /* ignore */ }
      }
    }
  }, []);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    const userMsg: Msg = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat(updatedMessages);
    } catch (e) {
      console.error("Tutor chat error:", e);
      setMessages(prev => [...prev, { role: "assistant", content: `Sorry, I encountered an error: ${e instanceof Error ? e.message : "Please try again."}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl gradient-btn flex items-center justify-center focus-ring"
            aria-label="Open AI Tutor"
          >
            <Sparkles size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[520px] max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl overflow-hidden border border-border/50"
            style={{ background: 'hsl(var(--card) / 0.85)', backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)', boxShadow: '0 8px 40px hsl(var(--primary) / 0.15)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">AI Tutor</p>
                  <p className="text-[10px] text-muted-foreground">Ask anything about your studies</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-muted rounded-lg transition-colors focus-ring" aria-label="Close tutor chat">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot size={40} className="mx-auto text-primary/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">Hi! I'm your AI Tutor 👋</p>
                  <p className="text-xs text-muted-foreground/70">Ask me about any topic, get hints on questions, or request explanations.</p>
                  <div className="mt-4 space-y-2">
                    {["Explain Ohm's Law simply", "What are orthographic projections?", "Tips for employability skills"].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); }}
                        className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot size={14} className="text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-foreground"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>p:last-child]:mb-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="h-6 w-6 rounded-md bg-secondary flex items-center justify-center shrink-0 mt-1">
                      <User size={14} className="text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-primary" />
                  </div>
                  <div className="bg-muted/50 rounded-xl px-3 py-2">
                    <Loader2 size={16} className="animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/50 p-3">
              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your tutor..."
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 bg-muted/30 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50"
                  aria-label="Type your question"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="h-9 w-9 rounded-xl gradient-btn flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
