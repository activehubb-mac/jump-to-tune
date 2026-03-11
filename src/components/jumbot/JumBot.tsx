import { useState, useRef, useEffect } from "react";
import { Send, X, Trash2, Minus, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useJumBot, type JumBotMessage } from "@/hooks/useJumBot";
import ReactMarkdown from "react-markdown";

/* ─── Robot eye animation for the FAB ─── */
function RobotFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 md:bottom-8 group"
      aria-label="Open JumBot"
    >
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl animate-pulse-ring" />
      {/* Body */}
      <div className="relative w-16 h-16 rounded-2xl border border-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.35),inset_0_1px_0_hsl(var(--primary)/0.2)] flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110 group-active:scale-95"
        style={{
          background: "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(0 0% 6%) 100%)",
        }}
      >
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary)/0.15) 2px, hsl(var(--primary)/0.15) 4px)",
          }}
        />
        {/* Robot face */}
        <div className="relative flex flex-col items-center gap-1.5">
          {/* Eyes */}
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)] animate-pulse" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)] animate-pulse" style={{ animationDelay: "0.3s" }} />
          </div>
          {/* Mouth */}
          <div className="w-5 h-1 rounded-full bg-primary/60" />
        </div>
        {/* Corner accents */}
        <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-primary/50 rounded-tl-md" />
        <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-primary/50 rounded-tr-md" />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-primary/50 rounded-bl-md" />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-primary/50 rounded-br-md" />
      </div>
    </button>
  );
}

/* ─── Message bubble ─── */
function MessageBubble({ msg }: { msg: JumBotMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg border border-primary/30 bg-card flex items-center justify-center mr-2 mt-1 shrink-0 shadow-[0_0_10px_hsl(var(--primary)/0.2)]">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_4px_hsl(var(--primary)/0.8)]" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_4px_hsl(var(--primary)/0.8)]" />
          </div>
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed relative overflow-hidden",
          isUser
            ? "bg-primary/15 border border-primary/30 text-foreground rounded-br-sm"
            : "bg-card border border-border text-foreground rounded-bl-sm shadow-[0_0_15px_hsl(var(--primary)/0.08)]"
        )}
      >
        {/* Subtle scanline on bot messages */}
        {!isUser && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, hsl(var(--primary)) 3px, hsl(var(--primary)) 4px)",
            }}
          />
        )}
        {isUser ? (
          <p className="relative z-10">{msg.content}</p>
        ) : (
          <div className="relative z-10 prose prose-sm prose-invert max-w-none [&_a]:text-primary [&_a]:underline [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export function JumBot() {
  const {
    messages,
    isStreaming,
    isOpen,
    setIsOpen,
    sendMessage,
    clearChat,
  } = useJumBot();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return <RobotFab onClick={() => setIsOpen(true)} />;
  }

  return (
    <div
      className="fixed bottom-0 right-0 z-40 w-full sm:w-[400px] sm:bottom-4 sm:right-4 flex flex-col overflow-hidden"
      style={{
        maxHeight: "min(80vh, 640px)",
        borderRadius: "1.25rem 1.25rem 0 0",
        ...(typeof window !== "undefined" && window.innerWidth >= 640 ? { borderRadius: "1.25rem" } : {}),
      }}
    >
      {/* Outer glow frame */}
      <div className="absolute -inset-px rounded-[inherit] pointer-events-none"
        style={{
          background: "conic-gradient(from 180deg, hsl(var(--primary)/0.3), transparent 25%, transparent 75%, hsl(var(--primary)/0.3))",
        }}
      />

      {/* Main container */}
      <div className="relative flex flex-col h-full border border-primary/20 rounded-[inherit] overflow-hidden shadow-[0_0_60px_hsl(var(--primary)/0.15),0_0_120px_hsl(var(--primary)/0.05)]"
        style={{
          background: "linear-gradient(180deg, hsl(0 0% 8%) 0%, hsl(0 0% 5%) 100%)",
        }}
      >
        {/* Scanline overlay on entire box */}
        <div className="absolute inset-0 pointer-events-none z-[1] opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary)) 2px, hsl(var(--primary)) 3px)",
          }}
        />

        {/* ─── Header ─── */}
        <div className="relative z-10 flex items-center gap-3 px-4 py-3 border-b border-primary/15 shrink-0"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)/0.08) 0%, transparent 60%)",
          }}
        >
          {/* Robot head icon */}
          <div className="relative w-10 h-10 rounded-xl border border-primary/30 flex items-center justify-center shrink-0 shadow-[0_0_20px_hsl(var(--primary)/0.25)]"
            style={{
              background: "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(0 0% 6%) 100%)",
            }}
          >
            {/* Eyes */}
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.9)] animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.9)] animate-pulse" style={{ animationDelay: "0.2s" }} />
            </div>
            {/* Antenna */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-px h-2 bg-primary/50" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.8)] animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-foreground tracking-wide">JUMBOT</p>
              <Zap className="w-3 h-3 text-primary" />
            </div>
            <p className="text-[10px] text-primary/70 font-mono tracking-widest uppercase">AI Core · Online</p>
          </div>

          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={clearChat} title="Clear chat">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => setIsOpen(false)} title="Minimize">
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => setIsOpen(false)} title="Close">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* ─── Messages ─── */}
        <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 scrollbar-hide">
          {messages.length === 0 && (
            <div className="text-center py-6 space-y-4">
              {/* Large robot face */}
              <div className="relative w-20 h-20 mx-auto rounded-2xl border border-primary/25 flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.2)]"
                style={{
                  background: "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(0 0% 6%) 100%)",
                }}
              >
                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-10"
                  style={{
                    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, hsl(var(--primary)/0.2) 3px, hsl(var(--primary)/0.2) 4px)",
                  }}
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.9)] animate-pulse" />
                    <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.9)] animate-pulse" style={{ animationDelay: "0.3s" }} />
                  </div>
                  <div className="w-6 h-1 rounded-full bg-primary/50" />
                </div>
                {/* Antenna */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-primary/40" />
                <div className="absolute -top-4.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)] animate-pulse" />
                {/* Corner brackets */}
                <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-primary/40 rounded-tl" />
                <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-primary/40 rounded-tr" />
                <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-primary/40 rounded-bl" />
                <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-primary/40 rounded-br" />
              </div>

              <div>
                <p className="text-sm font-bold text-foreground tracking-wide">JUMBOT ONLINE</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">AI Music Assistant · Ready to assist</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  "How do I upload music?",
                  "What is JumTunes Stage?",
                  "How do AI credits work?",
                  "Help me get started",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-2.5 rounded-lg border border-primary/20 bg-card text-foreground hover:border-primary/50 hover:shadow-[0_0_15px_hsl(var(--primary)/0.15)] transition-all text-left font-mono"
                  >
                    <span className="text-primary mr-1">›</span>{q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-lg border border-primary/30 bg-card flex items-center justify-center mr-2 shrink-0">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl rounded-bl-sm px-4 py-3 shadow-[0_0_15px_hsl(var(--primary)/0.08)]">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Input ─── */}
        <div className="relative z-10 px-3 py-3 border-t border-primary/15 shrink-0"
          style={{
            background: "linear-gradient(0deg, hsl(0 0% 6%) 0%, transparent 100%)",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter command..."
                className="w-full bg-card border border-primary/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_20px_hsl(var(--primary)/0.15)] transition-all font-mono"
                disabled={isStreaming}
              />
              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-px h-4 bg-primary/40 rounded-full" />
            </div>
            <Button
              size="icon"
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="rounded-xl w-10 h-10 bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all shrink-0 disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
