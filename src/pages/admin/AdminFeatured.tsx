import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminAvatarPromotions from "@/components/admin/AdminAvatarPromotions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Star, 
  Plus, 
  Trash2, 
  Search, 
  User, 
  Building2, 
  Loader2, 
  GripVertical,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Music,
  Album
} from "lucide-react";
import { useFeaturedContentAdmin, useAddFeaturedContent, useUpdateFeaturedContent, useRemoveFeaturedContent, FeaturedContentType } from "@/hooks/useFeaturedContent";
import { useArtists } from "@/hooks/useArtists";
import { useLabels } from "@/hooks/useLabels";
import { useTracks } from "@/hooks/useTracks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const DISPLAY_LOCATIONS: Record<FeaturedContentType, { value: string; label: string }[]> = {
  artist: [
    { value: "artists_page", label: "Artists Page - Featured Section" },
    { value: "home_hero", label: "Home Page - Hero Carousel" },
    { value: "home_discover_artists", label: "Home Page - Discover Artists" },
  ],
  label: [
    { value: "labels_page", label: "Labels Page - Featured Section" },
    { value: "home_hero", label: "Home Page - Hero Carousel" },
  ],
  track: [
    { value: "home_hero", label: "Home Page - Hero Carousel" },
    { value: "browse_page", label: "Browse Page - Featured Section" },
    { value: "home_new_releases", label: "Home Page - New Releases" },
    { value: "home_trending", label: "Home Page - Trending Now" },
  ],
  album: [
    { value: "browse_page", label: "Browse Page - Featured Section" },
    { value: "home_hero", label: "Home Page - Hero Carousel" },
    { value: "home_new_releases", label: "Home Page - New Releases" },
  ],
};

const TAB_CONFIG = [
  { value: "track" as const, label: "Tracks", icon: Music },
  { value: "artist" as const, label: "Artists", icon: User },
  { value: "label" as const, label: "Labels", icon: Building2 },
  { value: "album" as const, label: "Albums", icon: Album },
];

export default function AdminFeatured() {
  const [activeTab, setActiveTab] = useState<FeaturedContentType>("track");
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  
  const { user } = useAuth();
  const { data: featuredContent, isLoading: featuredLoading } = useFeaturedContentAdmin(activeTab);
  const { data: artists, isLoading: artistsLoading } = useArtists({ searchQuery: searchQuery || undefined });
  const { data: labels, isLoading: labelsLoading } = useLabels({ searchQuery: searchQuery || undefined });
  const { data: tracks, isLoading: tracksLoading } = useTracks({ 
    publishedOnly: true, 
    searchQuery: searchQuery || undefined,
    limit: 50 
  });
  const { data: albums, isLoading: albumsLoading } = useQuery({
    queryKey: ["admin-albums", searchQuery],
    queryFn: async () => {
      // Step 1: Fetch albums without profile join
      let query = supabase
        .from("albums")
        .select("id, title, cover_art_url, release_type, artist_id")
        .eq("is_draft", false)
        .order("created_at", { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data: albumsData, error } = await query;
      if (error) throw error;
      if (!albumsData || albumsData.length === 0) return [];

      // Step 2: Get unique artist IDs and fetch profiles separately
      const artistIds = [...new Set(albumsData.map(a => a.artist_id).filter(Boolean))];
      
      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name")
        .in("id", artistIds);

      // Step 3: Map artists to albums
      const artistMap = new Map(artists?.map(a => [a.id, a]) || []);
      return albumsData.map(album => ({
        ...album,
        artist: artistMap.get(album.artist_id) || null
      }));
    },
  });
  
  const addMutation = useAddFeaturedContent();
  const updateMutation = useUpdateFeaturedContent();
  const removeMutation = useRemoveFeaturedContent();

  // Get content list based on active tab
  const getContentList = () => {
    switch (activeTab) {
      case "artist":
        return artists?.map(a => ({ 
          id: a.id, 
          name: a.display_name || "Unknown", 
          avatar: a.avatar_url,
          isVerified: a.is_verified 
        })) || [];
      case "label":
        return labels?.map(l => ({ 
          id: l.id, 
          name: l.display_name || "Unknown", 
          avatar: l.avatar_url,
          isVerified: l.is_verified 
        })) || [];
      case "track":
        return tracks?.map(t => ({ 
          id: t.id, 
          name: t.title, 
          avatar: t.cover_art_url,
          subtitle: t.artist?.display_name || "Unknown Artist"
        })) || [];
      case "album":
        return albums?.map(a => ({ 
          id: a.id, 
          name: a.title, 
          avatar: a.cover_art_url,
          subtitle: a.artist?.display_name || "Unknown Artist"
        })) || [];
      default:
        return [];
    }
  };

  const isContentLoading = 
    activeTab === "artist" ? artistsLoading : 
    activeTab === "label" ? labelsLoading :
    activeTab === "track" ? tracksLoading :
    albumsLoading;

  const contentList = getContentList();

  // Get already featured IDs to filter them out
  const featuredIds = new Set(featuredContent?.map(f => f.content_id) || []);

  const handleAddFeatured = async () => {
    if (!selectedContentId || !selectedLocation || !user) return;
    
    try {
      const maxPriority = Math.max(0, ...(featuredContent?.map(f => f.priority) || [0]));
      await addMutation.mutateAsync({
        content_type: activeTab,
        content_id: selectedContentId,
        display_location: selectedLocation,
        priority: maxPriority + 1,
        created_by: user.id,
      });
      toast.success("Content added to featured");
      setAddDialogOpen(false);
      setSelectedContentId("");
      setSelectedLocation("");
      setSearchQuery("");
    } catch (error) {
      toast.error("Failed to add featured content");
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, is_active: !currentState });
      toast.success(currentState ? "Featured content disabled" : "Featured content enabled");
    } catch (error) {
      toast.error("Failed to update featured content");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeMutation.mutateAsync(id);
      toast.success("Featured content removed");
    } catch (error) {
      toast.error("Failed to remove featured content");
    }
  };

  const handleMovePriority = async (id: string, direction: "up" | "down") => {
    const currentIndex = featuredContent?.findIndex(f => f.id === id) ?? -1;
    if (currentIndex === -1 || !featuredContent) return;

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= featuredContent.length) return;

    const currentItem = featuredContent[currentIndex];
    const swapItem = featuredContent[swapIndex];

    try {
      await Promise.all([
        updateMutation.mutateAsync({ id: currentItem.id, priority: swapItem.priority }),
        updateMutation.mutateAsync({ id: swapItem.id, priority: currentItem.priority }),
      ]);
      toast.success("Priority updated");
    } catch (error) {
      toast.error("Failed to update priority");
    }
  };

  const getContentName = (contentId: string): string => {
    switch (activeTab) {
      case "artist":
        return artists?.find(a => a.id === contentId)?.display_name || "Unknown Artist";
      case "label":
        return labels?.find(l => l.id === contentId)?.display_name || "Unknown Label";
      case "track":
        return tracks?.find(t => t.id === contentId)?.title || "Unknown Track";
      case "album":
        return albums?.find(a => a.id === contentId)?.title || "Unknown Album";
      default:
        return "Unknown";
    }
  };

  const getContentSubtitle = (contentId: string): string | null => {
    switch (activeTab) {
      case "track":
        return tracks?.find(t => t.id === contentId)?.artist?.display_name || null;
      case "album":
        return albums?.find(a => a.id === contentId)?.artist?.display_name || null;
      default:
        return null;
    }
  };

  const getContentAvatar = (contentId: string): string | null | undefined => {
    switch (activeTab) {
      case "artist":
        return artists?.find(a => a.id === contentId)?.avatar_url;
      case "label":
        return labels?.find(l => l.id === contentId)?.avatar_url;
      case "track":
        return tracks?.find(t => t.id === contentId)?.cover_art_url;
      case "album":
        return albums?.find(a => a.id === contentId)?.cover_art_url;
      default:
        return null;
    }
  };

  const getContentIcon = () => {
    switch (activeTab) {
      case "artist":
        return User;
      case "label":
        return Building2;
      case "track":
        return Music;
      case "album":
        return Album;
      default:
        return Music;
    }
  };

  const ContentIcon = getContentIcon();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
          <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg md:text-xl font-bold">Featured Content</h2>
          <p className="text-xs md:text-sm text-muted-foreground truncate">Manage featured tracks, artists, labels & albums</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FeaturedContentType)}>
        <div className="flex flex-col gap-3 mb-4">
          <TabsList className="w-full grid grid-cols-4">
            {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="gap-1 text-xs sm:text-sm px-1 sm:px-3">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto" size="sm">
                <Plus className="w-4 h-4" />
                Add Featured {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Featured {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</DialogTitle>
                <DialogDescription>
                  Select a {activeTab} to feature on the platform
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Display Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISPLAY_LOCATIONS[activeTab].map((loc) => (
                        <SelectItem key={loc.value} value={loc.value}>
                          {loc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Search {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}s</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={`Search ${activeTab}s...`}
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                  {isContentLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : contentList.length > 0 ? (
                    contentList
                      .filter(c => !featuredIds.has(c.id))
                      .map((content) => (
                        <button
                          key={content.id}
                          onClick={() => setSelectedContentId(content.id)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                            selectedContentId === content.id
                              ? "bg-primary/10 border border-primary"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className={`w-10 h-10 ${activeTab === "artist" || activeTab === "label" ? "rounded-full" : "rounded-lg"} bg-muted flex items-center justify-center overflow-hidden shrink-0`}>
                            {content.avatar ? (
                              <img src={content.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ContentIcon className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-medium truncate">{content.name}</span>
                              {"isVerified" in content && content.isVerified && (
                                <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                              )}
                            </div>
                            {"subtitle" in content && content.subtitle && (
                              <span className="text-xs text-muted-foreground truncate block">{content.subtitle}</span>
                            )}
                          </div>
                          {selectedContentId === content.id && (
                            <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                          )}
                        </button>
                      ))
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No {activeTab}s found
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddFeatured} 
                  disabled={!selectedContentId || !selectedLocation || addMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {TAB_CONFIG.map(({ value }) => (
          <TabsContent key={value} value={value} className="mt-0">
            <FeaturedList
              items={featuredContent || []}
              isLoading={featuredLoading}
              onToggleActive={handleToggleActive}
              onRemove={handleRemove}
              onMovePriority={handleMovePriority}
              getContentName={getContentName}
              getContentSubtitle={getContentSubtitle}
              getContentAvatar={getContentAvatar}
              contentType={value}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Avatar Promotions Section */}
      <div className="border-t border-border pt-6 mt-6">
        <AdminAvatarPromotions />
      </div>
    </div>
  );
}

interface FeaturedListProps {
  items: Array<{
    id: string;
    content_id: string;
    display_location: string;
    priority: number;
    is_active: boolean;
    starts_at: string | null;
    ends_at: string | null;
  }>;
  isLoading: boolean;
  onToggleActive: (id: string, currentState: boolean) => void;
  onRemove: (id: string) => void;
  onMovePriority: (id: string, direction: "up" | "down") => void;
  getContentName: (id: string) => string;
  getContentSubtitle: (id: string) => string | null;
  getContentAvatar: (id: string) => string | null | undefined;
  contentType: FeaturedContentType;
}

function FeaturedList({
  items,
  isLoading,
  onToggleActive,
  onRemove,
  onMovePriority,
  getContentName,
  getContentSubtitle,
  getContentAvatar,
  contentType,
}: FeaturedListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Star className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold mb-1 text-center">No featured {contentType}s yet</h3>
          <p className="text-sm text-muted-foreground text-center">Add your first featured {contentType} to get started</p>
        </CardContent>
      </Card>
    );
  }

  const locationLabels: Record<string, string> = {
    artists_page: "Artists Page",
    labels_page: "Labels Page",
    home_hero: "Home Hero",
    browse_page: "Browse Page",
  };

  const getIcon = () => {
    switch (contentType) {
      case "artist":
        return User;
      case "label":
        return Building2;
      case "track":
        return Music;
      case "album":
        return Album;
      default:
        return Music;
    }
  };

  const ContentIcon = getIcon();
  const isRounded = contentType === "artist" || contentType === "label";

  return (
    <div className="space-y-2 md:space-y-3">
      {items.map((item, index) => {
        const subtitle = getContentSubtitle(item.content_id);
        return (
          <Card key={item.id} className={!item.is_active ? "opacity-60" : ""}>
            <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 md:p-4">
              {/* Reorder Controls - Hidden on mobile, shown on tablet+ */}
              <div className="hidden sm:flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === 0}
                  onClick={() => onMovePriority(item.id, "up")}
                >
                  <ArrowUp className="w-3 h-3" />
                </Button>
                <GripVertical className="w-4 h-4 text-muted-foreground mx-auto" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === items.length - 1}
                  onClick={() => onMovePriority(item.id, "down")}
                >
                  <ArrowDown className="w-3 h-3" />
                </Button>
              </div>

              {/* Content Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 md:w-12 md:h-12 ${isRounded ? "rounded-full" : "rounded-lg"} bg-muted flex items-center justify-center overflow-hidden shrink-0`}>
                  {getContentAvatar(item.content_id) ? (
                    <img src={getContentAvatar(item.content_id)!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ContentIcon className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm md:text-base truncate">{getContentName(item.content_id)}</h4>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {locationLabels[item.display_location] || item.display_location}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden xs:inline">
                      #{item.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                {/* Mobile reorder buttons */}
                <div className="flex items-center gap-1 sm:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === 0}
                    onClick={() => onMovePriority(item.id, "up")}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === items.length - 1}
                    onClick={() => onMovePriority(item.id, "down")}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden sm:inline">Active</span>
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={() => onToggleActive(item.id, item.is_active)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onRemove(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}