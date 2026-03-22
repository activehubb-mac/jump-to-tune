import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Zap } from "lucide-react";
import { useAutoReload } from "@/hooks/useAutoReload";

const RELOAD_PACKS = [
  { productId: "prod_U64QH9DtMPUYNi", credits: 100, label: "100 credits ($10)" },
  { productId: "prod_U64Scf2yEj3f3R", credits: 500, label: "500 credits ($40)" },
  { productId: "prod_U64VwSdypd7g5x", credits: 2000, label: "2,000 credits ($98)" },
];

export function AutoReloadPanel() {
  const { settings, isLoading, saveSettings, isSaving } = useAutoReload();

  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState("100");
  const [selectedPack, setSelectedPack] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!isLoading && settings) {
      setEnabled(settings.auto_reload_enabled);
      setThreshold(String(settings.auto_reload_threshold || 100));
      setSelectedPack(settings.auto_reload_pack_product_id || "");
    }
  }, [isLoading, settings]);

  useEffect(() => {
    if (!settings) return;
    const changed =
      enabled !== settings.auto_reload_enabled ||
      Number(threshold) !== (settings.auto_reload_threshold || 100) ||
      selectedPack !== (settings.auto_reload_pack_product_id || "");
    setHasChanges(changed);
  }, [enabled, threshold, selectedPack, settings]);

  const handleSave = async () => {
    const pack = RELOAD_PACKS.find(p => p.productId === selectedPack);
    await saveSettings({
      auto_reload_enabled: enabled,
      auto_reload_threshold: Math.max(10, Math.min(500, Number(threshold) || 100)),
      auto_reload_pack_product_id: selectedPack || null,
      auto_reload_pack_credits: pack?.credits ?? null,
    });
    setHasChanges(false);
  };

  const thresholdNum = Number(threshold) || 100;
  const pack = RELOAD_PACKS.find(p => p.productId === selectedPack);

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Auto-Reload
        </CardTitle>
        <CardDescription className="text-xs">
          Automatically top up credits when your balance runs low
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-reload-toggle" className="text-sm text-foreground">
            Enable Auto-Reload
          </Label>
          <Switch
            id="auto-reload-toggle"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Reload Pack</Label>
              <Select value={selectedPack} onValueChange={setSelectedPack}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select a pack" />
                </SelectTrigger>
                <SelectContent>
                  {RELOAD_PACKS.map(p => (
                    <SelectItem key={p.productId} value={p.productId}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Threshold (reload when below)
              </Label>
              <Input
                type="number"
                min={10}
                max={500}
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                className="bg-background/50"
              />
            </div>

            {pack && thresholdNum > 0 && (
              <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                When your credits drop below <strong>{thresholdNum}</strong>, we'll automatically purchase <strong>{pack.credits} credits</strong>.
              </p>
            )}

            {enabled && !selectedPack && (
              <p className="text-xs text-destructive">Please select a reload pack.</p>
            )}
          </>
        )}

        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={isSaving || (enabled && !selectedPack)}
            className="w-full"
            size="sm"
          >
            {isSaving ? <RefreshCw className="h-3 w-3 animate-spin mr-2" /> : null}
            Save Settings
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
