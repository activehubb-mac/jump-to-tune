import { useState } from 'react';
import { useAdminReports, Report, ReportStatus } from '@/hooks/useReports';
import { AdminSingModeTab } from '@/components/admin/AdminSingModeTab';
import { AdminStageTab } from '@/components/admin/AdminStageTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Flag, Loader2, Eye, Trash2, Music, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  reviewed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
  dismissed: 'bg-muted text-muted-foreground border-muted',
};

const REASON_LABELS: Record<string, string> = {
  inappropriate: 'Inappropriate',
  copyright: 'Copyright',
  spam: 'Spam',
  harassment: 'Harassment',
  other: 'Other',
};

export default function AdminReports() {
  const { reports, isLoading, updateReport, deleteReport } = useAdminReports();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState<ReportStatus>('pending');
  const [filter, setFilter] = useState<'all' | ReportStatus>('all');

  const filteredReports = reports?.filter(
    (r) => filter === 'all' || r.status === filter
  );

  const pendingCount = reports?.filter((r) => r.status === 'pending').length || 0;

  const handleOpenReport = (report: Report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setNewStatus(report.status);
  };

  const handleUpdateReport = async () => {
    if (!selectedReport) return;
    await updateReport.mutateAsync({
      id: selectedReport.id,
      status: newStatus,
      admin_notes: adminNotes,
    });
    setSelectedReport(null);
  };

  const handleDeleteReport = async (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      await deleteReport.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold text-yellow-500">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{reports?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Tracks
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">
              {reports?.filter((r) => r.reported_type === 'track').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Users
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">
              {reports?.filter((r) => r.reported_type === 'user').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 md:px-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Flag className="w-4 h-4 md:w-5 md:h-5" />
            Reports
          </CardTitle>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          {filteredReports && filteredReports.length > 0 ? (
            <div className="space-y-2">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg glass-card"
                >
                  {/* Report Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      {report.reported_type === 'track' ? (
                        <Music className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium capitalize">{report.reported_type}</span>
                        <Badge variant="outline" className="text-xs">
                          {REASON_LABELS[report.reason] || report.reason}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2 ml-auto">
                    <Badge className={`${STATUS_COLORS[report.status]} text-xs`}>
                      {report.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenReport(report)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No reports found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedReport.reported_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reason</p>
                  <p className="font-medium">{REASON_LABELS[selectedReport.reason]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reported ID</p>
                  <p className="font-mono text-xs truncate">{selectedReport.reported_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reporter ID</p>
                  <p className="font-mono text-xs truncate">{selectedReport.reporter_id}</p>
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ReportStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this report..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedReport(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateReport} disabled={updateReport.isPending}>
                  {updateReport.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sing Mode Moderation */}
      <AdminSingModeTab />

      {/* JumTunes Stage Moderation */}
      <AdminStageTab />
    </div>
  );
}