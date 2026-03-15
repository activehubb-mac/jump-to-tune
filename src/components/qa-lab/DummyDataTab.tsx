import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQALab, type QADummyAsset } from '@/hooks/useQALab';
import { DUMMY_ASSET_TYPES } from '@/lib/qaTestSuites';
import { useFeedbackSafe } from '@/contexts/FeedbackContext';
import { Database, RefreshCw, Trash2, Plus, Music, Image, FileText, ShoppingBag, User } from 'lucide-react';

const assetIcons: Record<string, React.ElementType> = {
  track: Music, instrumental: Music, lyrics: FileText, cover: Image, merch: ShoppingBag, artist_profile: User, fan_profile: User,
};

export function DummyDataTab() {
  const [assets, setAssets] = useState<QADummyAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchDummyAssets, seedDummyAssets, resetDummyAssets, isLoading } = useQALab();
  const { showFeedback } = useFeedbackSafe();

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await fetchDummyAssets();
      setAssets(data);
    } catch (err) {
      showFeedback({ type: 'error', title: 'Error', message: 'Failed to load dummy assets' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAssets(); }, []);

  const handleSeed = async () => {
    try {
      await seedDummyAssets();
      showFeedback({ type: 'success', title: 'Seeded', message: 'Default dummy assets created' });
      loadAssets();
    } catch {
      showFeedback({ type: 'error', title: 'Error', message: 'Failed to seed assets' });
    }
  };

  const handleReset = async () => {
    try {
      await resetDummyAssets();
      showFeedback({ type: 'success', title: 'Reset', message: 'All dummy assets cleared' });
      setAssets([]);
    } catch {
      showFeedback({ type: 'error', title: 'Error', message: 'Failed to reset assets' });
    }
  };

  const typeLabel = (type: string) => DUMMY_ASSET_TYPES.find(t => t.value === type)?.label || type;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Dummy Data Library
        </h2>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={loadAssets} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={handleSeed} disabled={isLoading || assets.length > 0}>
            <Plus className="w-4 h-4 mr-1" /> Seed Default Data
          </Button>
          <Button size="sm" variant="destructive" onClick={handleReset} disabled={isLoading || assets.length === 0}>
            <Trash2 className="w-4 h-4 mr-1" /> Reset All
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {DUMMY_ASSET_TYPES.map(type => {
          const count = assets.filter(a => a.asset_type === type.value).length;
          const Icon = assetIcons[type.value] || Database;
          return (
            <div key={type.value} className="glass-card p-3 text-center">
              <Icon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{count}</div>
              <div className="text-xs text-muted-foreground">{type.label}</div>
            </div>
          );
        })}
      </div>

      {/* Assets table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading assets...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <Database className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground mb-3">No dummy assets yet</p>
          <Button size="sm" onClick={handleSeed} disabled={isLoading}>
            <Plus className="w-4 h-4 mr-1" /> Seed Default Data
          </Button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map(asset => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{typeLabel(asset.asset_type)}</Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{asset.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{asset.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
