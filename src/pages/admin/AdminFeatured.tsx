import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  CheckCircle
} from "lucide-react";
import { useFeaturedContentAdmin, useAddFeaturedContent, useUpdateFeaturedContent, useRemoveFeaturedContent, FeaturedContentType } from "@/hooks/useFeaturedContent";
import { useArtists } from "@/hooks/useArtists";
import { useLabels } from "@/hooks/useLabels";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const DISPLAY_LOCATIONS = {
  artist: [
    { value: "artists_page", label: "Artists Page - Featured Section" },
    { value: "home_hero", label: "Home Page - Hero Carousel" },
  ],
  label: [
    { value: "labels_page", label: "Labels Page - Featured Section" },
    { value: "home_hero", label: "Home Page - Hero Carousel" },
  ],
};

export default function AdminFeatured() {
  const [activeTab, setActiveTab] = useState<FeaturedContentType>("artist");
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  
  const { user } = useAuth();
  const { data: featuredContent, isLoading: featuredLoading } = useFeaturedContentAdmin(activeTab);
  const { data: artists, isLoading: artistsLoading } = useArtists({ searchQuery: searchQuery || undefined });
  const { data: labels, isLoading: labelsLoading } = useLabels({ searchQuery: searchQuery || undefined });
  
  const addMutation = useAddFeaturedContent();
  const updateMutation = useUpdateFeaturedContent();
  const removeMutation = useRemoveFeaturedContent();

  const contentList = activeTab === "artist" ? artists : labels;
  const isContentLoading = activeTab === "artist" ? artistsLoading : labelsLoading;

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

  const getContentName = (contentId: string) => {
    if (activeTab === "artist") {
      return artists?.find(a => a.id === contentId)?.display_name || "Unknown Artist";
    }
    return labels?.find(l => l.id === contentId)?.display_name || "Unknown Label";
  };

  const getContentAvatar = (contentId: string) => {
    if (activeTab === "artist") {
      return artists?.find(a => a.id === contentId)?.avatar_url;
    }
    return labels?.find(l => l.id === contentId)?.avatar_url;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
          <Star className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Featured Content</h2>
          <p className="text-sm text-muted-foreground">Manage featured artists and labels across the platform</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FeaturedContentType)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="artist" className="gap-2">
              <User className="w-4 h-4" />
              Artists
            </TabsTrigger>
            <TabsTrigger value="label" className="gap-2">
              <Building2 className="w-4 h-4" />
              Labels
            </TabsTrigger>
          </TabsList>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Featured
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Featured {activeTab === "artist" ? "Artist" : "Label"}</DialogTitle>
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
                  <Label>Search {activeTab === "artist" ? "Artists" : "Labels"}</Label>
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
                  ) : contentList && contentList.length > 0 ? (
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
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {content.avatar_url ? (
                              <img src={content.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : activeTab === "artist" ? (
                              <User className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <Building2 className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{content.display_name || "Unknown"}</span>
                              {content.is_verified && (
                                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                              )}
                            </div>
                          </div>
                          {selectedContentId === content.id && (
                            <CheckCircle className="w-5 h-5 text-primary" />
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

              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddFeatured} 
                  disabled={!selectedContentId || !selectedLocation || addMutation.isPending}
                >
                  {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add to Featured
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="artist" className="mt-0">
          <FeaturedList
            items={featuredContent || []}
            isLoading={featuredLoading}
            onToggleActive={handleToggleActive}
            onRemove={handleRemove}
            onMovePriority={handleMovePriority}
            getContentName={getContentName}
            getContentAvatar={getContentAvatar}
            contentType="artist"
          />
        </TabsContent>

        <TabsContent value="label" className="mt-0">
          <FeaturedList
            items={featuredContent || []}
            isLoading={featuredLoading}
            onToggleActive={handleToggleActive}
            onRemove={handleRemove}
            onMovePriority={handleMovePriority}
            getContentName={getContentName}
            getContentAvatar={getContentAvatar}
            contentType="label"
          />
        </TabsContent>
      </Tabs>
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
  getContentAvatar: (id: string) => string | null | undefined;
  contentType: "artist" | "label";
}

function FeaturedList({
  items,
  isLoading,
  onToggleActive,
  onRemove,
  onMovePriority,
  getContentName,
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
          <h3 className="font-semibold mb-1">No featured {contentType}s yet</h3>
          <p className="text-sm text-muted-foreground">Add your first featured {contentType} to get started</p>
        </CardContent>
      </Card>
    );
  }

  const locationLabels: Record<string, string> = {
    artists_page: "Artists Page",
    labels_page: "Labels Page",
    home_hero: "Home Hero",
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <Card key={item.id} className={!item.is_active ? "opacity-60" : ""}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex flex-col gap-1">
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

            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {getContentAvatar(item.content_id) ? (
                <img src={getContentAvatar(item.content_id)!} alt="" className="w-full h-full object-cover" />
              ) : contentType === "artist" ? (
                <User className="w-6 h-6 text-muted-foreground" />
              ) : (
                <Building2 className="w-6 h-6 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate">{getContentName(item.content_id)}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {locationLabels[item.display_location] || item.display_location}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Priority: {item.priority}
                </span>
              </div>
              {item.ends_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ends: {format(new Date(item.ends_at), "MMM d, yyyy")}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor={`active-${item.id}`} className="text-sm text-muted-foreground">
                  Active
                </Label>
                <Switch
                  id={`active-${item.id}`}
                  checked={item.is_active}
                  onCheckedChange={() => onToggleActive(item.id, item.is_active)}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
