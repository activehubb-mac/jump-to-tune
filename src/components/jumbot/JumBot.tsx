import { useState, useRef, useEffect } from "react";
import { Send, X, Trash2, Minus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useJumBot, type JumBotMessage } from "@/hooks/useJumBot";
import ReactMarkdown from "react-markdown";
import jumbotMascot from "@/assets/jumbot-mascot.png";

/* ─── Floating Robot FAB ─── */
function RobotFab({ onClick }: { onClick: () => void }) {
  const [blink, setBlink] = useState(false);

  // Random blinking
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 4000;
      return setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 180);
        timerRef = scheduleBlink();
      }, delay);
    };
    let timerRef = scheduleBlink();
    return () => clearTimeout(timerRef);
  }, []);

  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 md:bottom-8 group focus:outline-none"
      aria-label="Open JumBot"
    >
      {/* Pulsing glow behind */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-150 animate-pulse pointer-events-none" />
      <div className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary)/0.3) 0%, transparent 70%)",
        }}
      />

      {/* Robot mascot */}
      <div className="relative w-[72px] h-[72px] transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
        style={{ animation: "jumbot-float 3s ease-in-out infinite" }}
      >
        <img
          src={jumbotMascot}
          alt="JumBot"
          className="w-full h-full object-contain drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
          style={{
            filter: blink
              ? "brightness(0.7)"
              : "brightness(1) drop-shadow(0 0 12px hsl(var(--primary)/0.4))",
            transition: "filter 0.15s ease",
          }}
        />
        {/* Eye glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-screen"
          style={{
            opacity: blink ? 0 : 0.3,
            transition: "opacity 0.15s ease",
            background: "radial-gradient(ellipse 30% 15% at 38% 38%, hsl(var(--primary)) 0%, transparent 100%), radial-gradient(ellipse 30% 15% at 62% 38%, hsl(var(--primary)) 0%, transparent 100%)",
          }}
        />
        {/* Status dot */}
        <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-background shadow-[0_0_8px_rgba(34,197,94,0.6)]"
          style={{ animation: "jumbot-status-pulse 2s ease-in-out infinite" }}
        />
      </div>
    </button>
  );
}

/* ─── Chat header mascot with personality ─── */
function HeaderMascot({ isStreaming }: { isStreaming: boolean }) {
  return (
    <div className="relative w-12 h-12 shrink-0">
      <div
        className="w-full h-full"
        style={{
          animation: isStreaming
            ? "jumbot-talk 0.4s ease-in-out infinite alternate"
            : "jumbot-idle 4s ease-in-out infinite",
        }}
      >
        <img
          src={jumbotMascot}
          alt="JumBot"
          className="w-full h-full object-contain"
          style={{
            filter: `drop-shadow(0 0 10px hsl(var(--primary)/0.4)) ${isStreaming ? "brightness(1.15)" : "brightness(1)"}`,
            transition: "filter 0.3s ease",
          }}
        />
        {/* Dynamic eye glow - brighter when streaming */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-screen"
          style={{
            opacity: isStreaming ? 0.5 : 0.25,
            transition: "opacity 0.3s ease",
            background: "radial-gradient(ellipse 30% 15% at 38% 38%, hsl(var(--primary)) 0%, transparent 100%), radial-gradient(ellipse 30% 15% at 62% 38%, hsl(var(--primary)) 0%, transparent 100%)",
          }}
        />
      </div>
    </div>
  );
}

/* ─── Welcome mascot - larger, animated ─── */
function WelcomeMascot() {
  return (
    <div className="relative w-28 h-28 mx-auto">
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl scale-150 pointer-events-none" style={{ animation: "jumbot-glow-pulse 3s ease-in-out infinite" }} />
      <div
        className="w-full h-full"
        style={{ animation: "jumbot-wave 2.5s ease-in-out infinite" }}
      >
        <img
          src={jumbotMascot}
          alt="JumBot"
          className="w-full h-full object-contain"
          style={{
            filter: "drop-shadow(0 0 25px hsl(var(--primary)/0.5)) drop-shadow(0 8px 20px rgba(0,0,0,0.5))",
          }}
        />
        {/* Eye glow */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-screen"
          style={{
            opacity: 0.35,
            background: "radial-gradient(ellipse 30% 15% at 38% 38%, hsl(var(--primary)) 0%, transparent 100%), radial-gradient(ellipse 30% 15% at 62% 38%, hsl(var(--primary)) 0%, transparent 100%)",
            animation: "jumbot-eye-flicker 3s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

/* ─── Message bubble ─── */
function MessageBubble({ msg }: { msg: JumBotMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg overflow-hidden mr-2 mt-1 shrink-0 shadow-[0_0_10px_hsl(var(--primary)/0.2)]">
          <img src={jumbotMascot} alt="" className="w-full h-full object-contain" style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary)/0.5))" }} />
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
        {!isUser && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
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
  const { messages, isStreaming, isOpen, setIsOpen, sendMessage, clearChat } = useJumBot();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!isOpen) return <RobotFab onClick={() => setIsOpen(true)} />;

  return (
    <div
      className="fixed bottom-0 right-0 z-40 w-full sm:w-[400px] sm:bottom-4 sm:right-4 flex flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl"
      style={{ maxHeight: "min(80vh, 640px)" }}
    >
      {/* Conic glow frame */}
      <div className="absolute -inset-px rounded-[inherit] pointer-events-none"
        style={{ background: "conic-gradient(from 180deg, hsl(var(--primary)/0.3), transparent 25%, transparent 75%, hsl(var(--primary)/0.3))" }}
      />

      <div className="relative flex flex-col h-full border border-primary/20 rounded-[inherit] overflow-hidden shadow-[0_0_60px_hsl(var(--primary)/0.15),0_0_120px_hsl(var(--primary)/0.05)]"
        style={{ background: "linear-gradient(180deg, hsl(0 0% 8%) 0%, hsl(0 0% 5%) 100%)" }}
      >
        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none z-[1] opacity-[0.025]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary)) 2px, hsl(var(--primary)) 3px)" }}
        />

        {/* ─── Header ─── */}
        <div className="relative z-10 flex items-center gap-3 px-4 py-2.5 border-b border-primary/15 shrink-0"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.08) 0%, transparent 60%)" }}
        >
          <HeaderMascot isStreaming={isStreaming} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-foreground tracking-wide">JUMBOT</p>
              <Zap className="w-3 h-3 text-primary" />
              {isStreaming && (
                <span className="text-[10px] text-primary font-mono animate-pulse">THINKING...</span>
              )}
            </div>
            <p className="text-[10px] text-primary/70 font-mono tracking-widest uppercase">AI Core · Online</p>
          </div>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={clearChat}><Trash2 className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => setIsOpen(false)}><Minus className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => setIsOpen(false)}><X className="w-3.5 h-3.5" /></Button>
          </div>
        </div>

        {/* ─── Messages ─── */}
        <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 scrollbar-hide">
          {messages.length === 0 && (
            <div className="text-center py-4 space-y-3">
              <WelcomeMascot />
              <div>
                <p className="text-sm font-bold text-foreground tracking-wide">HEY! I'M JUMBOT 🎵</p>
                <p className="text-xs text-muted-foreground mt-1">Your AI music assistant. Ask me anything!</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {["How do I upload music?", "What is JumTunes Stage?", "How do AI credits work?", "Help me get started"].map((q) => (
                  <button key={q} onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-2.5 rounded-lg border border-primary/20 bg-card text-foreground hover:border-primary/50 hover:shadow-[0_0_15px_hsl(var(--primary)/0.15)] transition-all text-left">
                    <span className="text-primary mr-1">›</span>{q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-lg overflow-hidden mr-2 shrink-0">
                <img src={jumbotMascot} alt="" className="w-full h-full object-contain" style={{ animation: "jumbot-talk 0.4s ease-in-out infinite alternate" }} />
              </div>
              <div className="bg-card border border-border rounded-xl rounded-bl-sm px-4 py-3 shadow-[0_0_15px_hsl(var(--primary)/0.08)]">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Input ─── */}
        <div className="relative z-10 px-3 py-3 border-t border-primary/15 shrink-0"
          style={{ background: "linear-gradient(0deg, hsl(0 0% 6%) 0%, transparent 100%)" }}
        >
          <div className="flex items-center gap-2">
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Ask JumBot anything..."
              className="flex-1 bg-card border border-primary/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_20px_hsl(var(--primary)/0.15)] transition-all"
              disabled={isStreaming}
            />
            <Button size="icon" onClick={handleSend} disabled={isStreaming || !input.trim()}
              className="rounded-xl w-10 h-10 bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all shrink-0 disabled:opacity-30">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
