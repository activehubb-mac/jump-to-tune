import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useAnnouncementReactions, ALLOWED_EMOJIS } from "@/hooks/useAnnouncementReactions";
import { useAuth } from "@/contexts/AuthContext";
import type { Announcement } from "@/hooks/useAnnouncements";

interface Props {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement }: Props) {
  const { user } = useAuth();
  const { reactionCounts, userReaction, toggleReaction } = useAnnouncementReactions(announcement.id);

  return (
    <div className="glass-card p-5 space-y-3 energy-card">
      {announcement.image_url && (
        <img
          src={announcement.image_url}
          alt=""
          className="w-full rounded-lg object-cover max-h-64"
        />
      )}
      <h3 className="text-lg font-bold text-foreground">{announcement.title}</h3>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{announcement.body}</p>

      {announcement.cta_label && announcement.cta_url && (
        <Button size="sm" className="gradient-accent" asChild>
          <a href={announcement.cta_url} target="_blank" rel="noopener noreferrer">
            {announcement.cta_label}
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </Button>
      )}

      {/* Emoji reactions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
        {ALLOWED_EMOJIS.map((emoji) => {
          const count = reactionCounts[emoji] || 0;
          const isSelected = userReaction === emoji;
          return (
            <button
              key={emoji}
              onClick={() => user && toggleReaction.mutate(emoji)}
              disabled={!user || toggleReaction.isPending}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all ${
                isSelected
                  ? "bg-primary/20 border border-primary/50"
                  : "bg-muted/30 border border-transparent hover:bg-muted/50"
              }`}
            >
              <span>{emoji}</span>
              {count > 0 && <span className="text-xs text-muted-foreground">{count}</span>}
            </button>
          );
        })}
      </div>

      <span className="text-[10px] text-muted-foreground">
        {new Date(announcement.created_at).toLocaleDateString()}
      </span>
    </div>
  );
}
