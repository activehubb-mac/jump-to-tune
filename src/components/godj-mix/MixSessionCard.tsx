import { useNavigate } from "react-router-dom";
import { GoDJSession } from "@/hooks/useGoDJSessions";
import { Badge } from "@/components/ui/badge";
import { Disc3, Clock, Music } from "lucide-react";

interface MixSessionCardProps {
  session: GoDJSession;
  djName?: string;
  djAvatar?: string | null;
  isOwner?: boolean;
  segmentCount?: number;
}

export function MixSessionCard({ session, djName, djAvatar, isOwner, segmentCount }: MixSessionCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (session.status === "draft" && isOwner) {
      navigate(`/go-dj/mix/${session.id}/edit`);
    } else if (session.status === "published") {
      navigate(`/go-dj/mix/${session.id}`);
    }
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    rendering: "bg-yellow-500/20 text-yellow-400",
    published: "bg-green-500/20 text-green-400",
    failed: "bg-destructive/20 text-destructive",
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer rounded-lg border border-border bg-card overflow-hidden hover:border-primary/40 transition-all"
    >
      {/* Cover */}
      <div className="aspect-square relative bg-muted/30">
        {session.cover_url ? (
          <img
            src={session.cover_url}
            alt={session.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc3 className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        <Badge className={`absolute top-2 right-2 text-xs ${statusColors[session.status] || ""}`}>
          {session.status}
        </Badge>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium truncate">{session.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {djAvatar ? (
            <img src={djAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
          ) : null}
          <span className="truncate">{djName || "DJ"}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {session.duration_sec && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {Math.floor(session.duration_sec / 60)}:{String(session.duration_sec % 60).padStart(2, "0")}
            </span>
          )}
          {segmentCount !== undefined && (
            <span className="flex items-center gap-1">
              <Music className="w-3 h-3" />
              {segmentCount} segments
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
