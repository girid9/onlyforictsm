import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, X } from "lucide-react";
import type { ChatMessage } from "@/types/multiplayer";

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  playerId: string;
}

export function BattleChat({ messages, onSend, playerId }: Props) {
  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
    inputRef.current?.focus();
  };

  const unreadCount = messages.length;

  return (
    <>
      {/* Toggle button for mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat panel */}
      <div
        className={`${
          isOpen ? "fixed inset-0 z-40 bg-background md:relative md:inset-auto" : "hidden md:flex"
        } flex-col border-l border-border w-full md:w-72 lg:w-80`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider">Chat</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-1 hover:bg-muted rounded">
            <X size={16} />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar min-h-0"
          style={{ maxHeight: "calc(100vh - 140px)" }}
        >
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-xs py-8">
              No messages yet. Say hello! 👋
            </p>
          )}
          {messages.map((msg) => {
            const isMine = msg.senderId === playerId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
              >
                <span className="text-[9px] text-muted-foreground font-medium mb-0.5 px-1">
                  {msg.senderName}
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

        <div className="p-3 border-t border-border bg-card/50">
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
      </div>
    </>
  );
}
