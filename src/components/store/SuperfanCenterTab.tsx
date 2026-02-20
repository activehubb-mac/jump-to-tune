import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, Trophy, TrendingUp, AlertTriangle, ArrowUp, Sparkles, Brain, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useArtistSuperfanSettings } from "@/hooks/useArtistSuperfanSettings";
import { useFanInsights, type FanInsightEntry } from "@/hooks/useFanInsights";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getLevelDisplayName } from "@/hooks/useFanLoyalty";

function FanCard({ fan }: { fan: FanInsightEntry }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-glass-border">
      <Avatar className="w-9 h-9">
        <AvatarImage src={fan.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/20 text-primary text-xs">
          {fan.display_name?.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate text-foreground">{fan.display_name || "Anonymous"}</p>
        <p className="text-xs text-muted-foreground">
          ${fan.total_spent.toFixed(2)} spent • {fan.purchase_count} purchases
        </p>
      </div>
      <Badge variant="outline" className="shrink-0 text-xs">
        {getLevelDisplayName(fan.loyalty_level)}
      </Badge>
    </div>
  );
}

export function SuperfanCenterTab() {
  const { user } = useAuth();
  const { settings, isLoading, upsertSettings } = useArtistSuperfanSettings(user?.id);
  const { insights, isLoading: insightsLoading, error: insightsError, fetchInsights } = useFanInsights();
  const { showFeedback } = useFeedbackSafe();

  const handleToggle = async (key: string, value: boolean) => {
    try {
      await upsertSettings.mutateAsync({ [key]: value } as any);
      showFeedback({ type: "success", title: "Updated", message: "Setting saved", autoClose: true, autoCloseDelay: 1500 });
    } catch {
      showFeedback({ type: "error", title: "Error", message: "Failed to update setting" });
    }
  };

  const handleNumberChange = async (key: string, value: number) => {
    try {
      await upsertSettings.mutateAsync({ [key]: value } as any);
      showFeedback({ type: "success", title: "Updated", message: "Setting saved", autoClose: true, autoCloseDelay: 1500 });
    } catch {
      showFeedback({ type: "error", title: "Error", message: "Failed to update setting" });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Loyalty System Toggle */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Loyalty System</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Enable Loyalty Points</p>
            <p className="text-sm text-muted-foreground">Fans earn points for purchases and engagement</p>
          </div>
          <Switch
            checked={settings?.loyalty_enabled ?? false}
            onCheckedChange={(v) => handleToggle("loyalty_enabled", v)}
          />
        </div>
      </div>

      {/* Messaging Controls */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Messaging Controls</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground text-sm">Enable Paid Messaging</p>
            <p className="text-xs text-muted-foreground">Fans can send you paid messages</p>
          </div>
          <Switch
            checked={(settings as any)?.messaging_enabled ?? true}
            onCheckedChange={(v) => handleToggle("messaging_enabled", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground text-sm">Cost Per Message</p>
            <p className="text-xs text-muted-foreground">1-5 credits per message</p>
          </div>
          <Select
            value={String((settings as any)?.message_price_credits || 1)}
            onValueChange={(v) => handleNumberChange("message_price_credits", parseInt(v))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground text-sm">Response Window</p>
            <p className="text-xs text-muted-foreground">Auto-refund if no reply (hours)</p>
          </div>
          <Select
            value={String((settings as any)?.response_window_hours || 72)}
            onValueChange={(v) => handleNumberChange("response_window_hours", parseInt(v))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[24, 48, 72, 96, 120].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}h</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Leaderboard Settings */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Leaderboard Settings</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground text-sm">Public Leaderboard</p>
            <p className="text-xs text-muted-foreground">Show top supporters on your profile</p>
          </div>
          <Switch checked={settings?.public_leaderboard ?? false} onCheckedChange={(v) => handleToggle("public_leaderboard", v)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground text-sm">Show Top Supporters</p>
            <p className="text-xs text-muted-foreground">Display supporter badges</p>
          </div>
          <Switch checked={settings?.show_top_supporters ?? true} onCheckedChange={(v) => handleToggle("show_top_supporters", v)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground text-sm">Founding Fan Recognition</p>
            <p className="text-xs text-muted-foreground">Highlight founding superfans</p>
          </div>
          <Switch checked={settings?.show_founding_fans ?? true} onCheckedChange={(v) => handleToggle("show_founding_fans", v)} />
        </div>
      </div>

      {/* AI Insights */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Superfan Insights</h3>
          </div>
          <Button size="sm" onClick={fetchInsights} disabled={insightsLoading}>
            {insightsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
            {insights ? "Refresh" : "Analyze"}
          </Button>
        </div>

        {insightsError && (
          <p className="text-sm text-destructive mb-4">{insightsError}</p>
        )}

        {insights && (
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-glass border-glass-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" /> Top Supporters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insights.top_supporters.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No data yet</p>
                ) : (
                  insights.top_supporters.slice(0, 5).map((f) => <FanCard key={f.fan_id} fan={f} />)
                )}
              </CardContent>
            </Card>

            <Card className="bg-glass border-glass-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" /> Rising Supporters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insights.rising_supporters.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No data yet</p>
                ) : (
                  insights.rising_supporters.slice(0, 5).map((f) => <FanCard key={f.fan_id} fan={f} />)
                )}
              </CardContent>
            </Card>

            <Card className="bg-glass border-glass-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" /> At-Risk Subscribers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insights.at_risk_subscribers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">All subscribers active!</p>
                ) : (
                  insights.at_risk_subscribers.slice(0, 5).map((f) => <FanCard key={f.fan_id} fan={f} />)
                )}
              </CardContent>
            </Card>

            <Card className="bg-glass border-glass-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowUp className="w-4 h-4 text-primary" /> Near Next Level
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insights.fans_near_next_level.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No data yet</p>
                ) : (
                  insights.fans_near_next_level.slice(0, 5).map((f) => <FanCard key={f.fan_id} fan={f} />)
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
