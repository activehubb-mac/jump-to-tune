import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Bell, BellOff, CheckCheck, Loader2, 
  Heart, UserPlus, Music, ShoppingCart, Settings, ArrowLeft
} from "lucide-react";
import { SwipeableNotification } from "@/components/notifications/SwipeableNotification";

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
      case "track_purchase":
      case "track_sale":
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
      case "track_purchase":
        navigate("/library");
        break;
      case "track_sale":
        if (metadata?.track_id) {
          navigate(`/track/${metadata.track_id}/edit`);
        }
        break;
      default:
        break;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Notifications</h1>
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
            className="shrink-0"
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
              <span className="hidden sm:inline">Mark all read</span>
              <span className="sm:hidden">All read</span>
            </Button>
          )}
        </div>

        {/* Swipe hint for mobile */}
        <p className="text-xs text-muted-foreground mb-3 sm:hidden">
          Swipe left on a notification to delete it
        </p>

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
              <SwipeableNotification
                key={notification.id}
                notification={notification}
                onDelete={deleteNotification}
                onMarkRead={markAsRead}
                onClick={handleNotificationClick}
                getIcon={getNotificationIcon}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
