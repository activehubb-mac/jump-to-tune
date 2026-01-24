import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Bell, BellOff, Check, CheckCheck, Trash2, Loader2, 
  Heart, UserPlus, Music, ShoppingCart, Settings, ArrowLeft
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, isLoading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  if (!user) {
    navigate("/auth");
    return null;
  }

  const filteredNotifications = filter === "unread" 
    ? notifications?.filter(n => !n.read) 
    : notifications;

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "track_liked":
      case "like":
        return <Heart className="w-5 h-5 text-pink-500" />;
      case "new_follower":
      case "follow":
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case "new_release":
        return <Music className="w-5 h-5 text-primary" />;
      case "purchase":
        return <ShoppingCart className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type and metadata
    const { type, metadata } = notification;
    
    switch (type) {
      case "track_liked":
      case "like":
        if (metadata?.track_id) {
          navigate(`/track/${metadata.track_id}`);
        }
        break;
      case "new_follower":
      case "follow":
        if (metadata?.follower_id) {
          navigate(`/artist/${metadata.follower_id}`);
        }
        break;
      case "new_release":
        if (metadata?.album_id) {
          navigate(`/album/${metadata.album_id}`);
        } else if (metadata?.track_id) {
          navigate(`/track/${metadata.track_id}`);
        }
        break;
      case "purchase":
        navigate("/collection");
        break;
      default:
        break;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="ml-auto"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredNotifications?.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filter === "unread" 
                ? "You're all caught up!" 
                : "When you get notifications, they'll appear here"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications?.map((notification) => (
              <div
                key={notification.id}
                className={`glass-card p-4 cursor-pointer transition-all hover:bg-muted/50 ${
                  !notification.read ? "border-l-2 border-l-primary bg-primary/5" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-medium text-sm ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}