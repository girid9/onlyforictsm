import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChatMsg {
  id: string;
  nickname: string;
  text: string;
  created_at: string;
}

export function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem("chat-nickname") || "";
  });
  const [showNicknameInput, setShowNicknameInput] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch messages on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("global_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) setMessages(data as ChatMsg[]);
    };

    fetchMessages();

    // Subscribe to realtime
    const channel = supabase
      .channel("global-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "global_messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || !nickname.trim()) return;
    const msgText = text.trim();
    setText("");
    await supabase.from("global_messages").insert({
      nickname: nickname.trim(),
      text: msgText,
    });
  }, [text, nickname]);

  const handleSetNickname = () => {
    if (nickname.trim()) {
      localStorage.setItem("chat-nickname", nickname.trim());
      setShowNicknameInput(false);
      inputRef.current?.focus();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          if (!nickname) setShowNicknameInput(true);
        }}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 max-h-[480px] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider">Global Chat</span>
          <span className="h-2 w-2 bg-success rounded-full animate-pulse" />
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded-md transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Nickname prompt */}
      {showNicknameInput && (
        <div className="p-4 border-b border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">Enter a nickname to start chatting:</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Your name..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              onKeyDown={(e) => e.key === "Enter" && handleSetNickname()}
              className="flex-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:border-primary/50"
            />
            <button
              onClick={handleSetNickname}
              disabled={!nickname.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold disabled:opacity-30"
            >
              Go
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[320px] custom-scrollbar">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-xs py-8">
            No messages yet. Say hello! 👋
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.nickname === nickname;
          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
              <span className="text-[9px] text-muted-foreground font-medium mb-0.5 px-1">
                {msg.nickname}
              </span>
              <div
                className={`px-3 py-2 rounded-lg text-sm max-w-[85%] break-words ${
                  isMine
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      {!showNicknameInput && nickname && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:border-primary/50"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-all"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
