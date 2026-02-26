import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Disc3, Users, Headphones, Music } from "lucide-react";
import { DJBadge } from "./DJBadge";
import { CountdownTimer } from "./CountdownTimer";
import type { DJSession } from "@/hooks/useDJSessions";

interface SessionCardProps {
  session: DJSession;
  artistName?: string;
  artistAvatar?: string;
  listenerCount?: number;
  tier?: number;
}

export function SessionCard({ session, artistName, artistAvatar, listenerCount, tier }: SessionCardProps) {
  const isScheduled = session.status === "scheduled" && session.scheduled_at;
  const isSpotify = session.session_type === "spotify";

  return (
    <Link to={`/go-dj/${session.id}`}>
      <Card className="group hover:border-primary/30 transition-all duration-300 overflow-hidden cursor-pointer">
        <div className="aspect-square relative bg-muted/30 overflow-hidden">
          {session.cover_image_url ? (
            <img
              src={session.cover_image_url}
              alt={session.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Disc3 className="w-16 h-16 text-primary/40" />
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            {isScheduled ? (
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
                ⏳ Upcoming
              </Badge>
            ) : session.status === "active" ? (
              <Badge className="bg-green-500/90 text-white text-xs">
                🔴 Live
              </Badge>
            ) : null}
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-[10px]">
              {isSpotify ? (
                <><Disc3 className="w-3 h-3 mr-0.5" />Spotify</>
              ) : (
                <><Music className="w-3 h-3 mr-0.5" />JumTunes</>
              )}
            </Badge>
          </div>

          {/* Listener count */}
          {typeof listenerCount === "number" && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs gap-1">
                <Headphones className="w-3 h-3" />
                {listenerCount}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-3 space-y-2">
          <h3 className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {session.title}
          </h3>

          <div className="flex items-center gap-2">
            {artistAvatar ? (
              <img src={artistAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
            <span className="text-xs text-muted-foreground truncate">{artistName || "DJ"}</span>
            {tier && tier >= 2 && <DJBadge tier={tier} className="text-[10px] py-0 px-1.5" />}
          </div>

          {isScheduled && session.scheduled_at && (
            <CountdownTimer targetDate={session.scheduled_at} className="text-xs" />
          )}

          {session.gating !== "public" && (
            <Badge variant="outline" className="text-[10px]">
              {session.gating === "followers" ? "Followers Only" : session.gating === "superfan" ? "Superfan Only" : "Limited"}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
