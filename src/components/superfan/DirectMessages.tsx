import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lock, Send, Loader2 } from "lucide-react";
import { useSuperfanMessages } from "@/hooks/useSuperfanMessages";
import { format } from "date-fns";

interface DirectMessagesProps {
  artistId: string;
  fanId: string | undefined;
  isSubscribed: boolean;
  currentUserId: string | undefined;
  artistName: string;
}

export function DirectMessages({ artistId, fanId, isSubscribed, currentUserId, artistName }: DirectMessagesProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, isSending } = useSuperfanMessages(
    isSubscribed ? artistId : undefined,
    isSubscribed ? fanId : undefined
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isSubscribed) {
    return (
      <div className="glass-card-bordered p-6 flex flex-col items-center gap-3 text-center">
        <Lock className="w-8 h-8 text-primary/50" />
        <div>
          <h3 className="text-sm font-bold text-foreground">Direct Messages</h3>
          <p className="text-sm text-muted-foreground mt-1">Subscribe to message this artist.</p>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!newMessage.trim() || !currentUserId) return;
    sendMessage({ message: newMessage.trim(), senderId: currentUserId });
    setNewMessage("");
  };

  return (
    <div className="glass-card-bordered p-6">
      <h3 className="text-sm font-bold text-foreground mb-3">Message {artistName}</h3>

      <div className="h-48 overflow-y-auto space-y-2 mb-3 scrollbar-hide">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  msg.sender_id === currentUserId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p>{msg.message}</p>
                <p className="text-[10px] opacity-60 mt-1">
                  {format(new Date(msg.created_at), "h:mm a")}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="min-h-[40px] max-h-[80px] resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!newMessage.trim() || isSending}
          className="flex-shrink-0"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
