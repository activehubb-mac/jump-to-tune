import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lock, Send, Loader2, Pin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface ChatRoomProps {
  artistId: string;
  isSubscribed: boolean;
  currentUserId?: string;
}

export function ChatRoom({ artistId, isSubscribed, currentUserId }: ChatRoomProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat-room", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("superfan_messages")
        .select("*")
        .eq("artist_id", artistId)
        .eq("message_type", "chat")
        .eq("is_hidden", false)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: isSubscribed,
    refetchInterval: 5000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!isSubscribed) return;
    const channel = supabase
      .channel(`chat-${artistId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "superfan_messages",
        filter: `artist_id=eq.${artistId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["chat-room", artistId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [artistId, isSubscribed, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isSubscribed) {
    return (
      <div className="glass-card-bordered p-6 flex flex-col items-center gap-3 text-center">
        <Lock className="w-8 h-8 text-primary/50" />
        <div>
          <h3 className="text-sm font-bold text-foreground">Superfan Chat</h3>
          <p className="text-sm text-muted-foreground mt-1">Subscribe to join the chat room.</p>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!message.trim() || !currentUserId || isSending) return;
    setIsSending(true);
    try {
      await supabase.from("superfan_messages").insert({
        artist_id: artistId,
        fan_id: currentUserId,
        sender_id: currentUserId,
        message: message.trim(),
        message_type: "chat",
      } as any);
      setMessage("");
    } finally {
      setIsSending(false);
    }
  };

  const pinnedMessages = messages.filter((m: any) => m.is_pinned);

  return (
    <div className="glass-card-bordered p-6">
      <h3 className="text-sm font-bold text-foreground mb-3">Superfan Chat</h3>

      {/* Pinned messages */}
      {pinnedMessages.length > 0 && (
        <div className="mb-3 space-y-1">
          {pinnedMessages.map((msg: any) => (
            <div key={msg.id} className="flex items-start gap-2 bg-primary/5 rounded p-2 text-xs">
              <Pin className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <p className="text-foreground">{msg.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="h-48 overflow-y-auto space-y-2 mb-3 scrollbar-hide">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg: any) => (
            <div key={msg.id} className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                msg.sender_id === artistId
                  ? "bg-primary/20 text-foreground border border-primary/30"
                  : msg.sender_id === currentUserId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
              }`}>
                {msg.sender_id === artistId && (
                  <Badge className="text-[10px] mb-1 bg-primary/30 text-primary">Artist</Badge>
                )}
                <p>{msg.message}</p>
                <p className="text-[10px] opacity-60 mt-1">{format(new Date(msg.created_at), "h:mm a")}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button size="icon" onClick={handleSend} disabled={!message.trim() || isSending} className="flex-shrink-0">
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
