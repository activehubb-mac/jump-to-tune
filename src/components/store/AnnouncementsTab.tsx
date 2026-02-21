import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Loader2, Trash2 } from "lucide-react";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useAuth } from "@/contexts/AuthContext";
import { AnnouncementCard } from "@/components/artist/AnnouncementCard";

export function AnnouncementsTab() {
  const { user } = useAuth();
  const { announcements, isLoading, createAnnouncement, deleteAnnouncement } = useAnnouncements(user?.id);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [audience, setAudience] = useState("all_followers");

  const handlePost = () => {
    if (!title.trim() || !body.trim()) return;
    createAnnouncement.mutate(
      {
        title: title.trim(),
        body: body.trim(),
        cta_label: ctaLabel.trim() || undefined,
        cta_url: ctaUrl.trim() || undefined,
        is_highlighted: isHighlighted,
        audience_filter: { type: audience },
      },
      {
        onSuccess: () => {
          setTitle("");
          setBody("");
          setCtaLabel("");
          setCtaUrl("");
          setIsHighlighted(false);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Composer */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" /> New Announcement
        </h3>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What's happening?" rows={3} />

        <div className="grid grid-cols-2 gap-3">
          <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="CTA label (optional)" />
          <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="CTA link (optional)" />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_followers">All Followers</SelectItem>
              <SelectItem value="paying_supporters">Paying Supporters</SelectItem>
              <SelectItem value="drop_owners">Drop Owners</SelectItem>
              <SelectItem value="waitlist_members">Waitlist Members</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch checked={isHighlighted} onCheckedChange={setIsHighlighted} />
            <span className="text-sm text-foreground">Highlight as banner</span>
          </div>
        </div>

        <Button
          onClick={handlePost}
          disabled={!title.trim() || !body.trim() || createAnnouncement.isPending}
          className="gradient-accent"
        >
          {createAnnouncement.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Post Announcement
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No announcements yet. Post your first update above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="relative">
              <AnnouncementCard announcement={a} />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                onClick={() => deleteAnnouncement.mutate(a.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
