import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ReportReason = 'inappropriate' | 'copyright' | 'spam' | 'harassment' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type ReportedType = 'track' | 'user';

export interface Report {
  id: string;
  reporter_id: string;
  reported_type: ReportedType;
  reported_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function useReports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createReport = useMutation({
    mutationFn: async (data: {
      reported_type: ReportedType;
      reported_id: string;
      reason: ReportReason;
      description?: string;
    }) => {
      if (!user) throw new Error('Must be logged in to report');
      
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_type: data.reported_type,
        reported_id: data.reported_id,
        reason: data.reason,
        description: data.description || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Report submitted', { description: 'Thank you for helping keep our community safe.' });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error) => {
      toast.error('Failed to submit report', { description: error.message });
    },
  });

  return { createReport };
}

export function useAdminReports() {
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Report[];
    },
  });

  const updateReport = useMutation({
    mutationFn: async (data: {
      id: string;
      status: ReportStatus;
      admin_notes?: string;
    }) => {
      const { error } = await supabase
        .from('reports')
        .update({
          status: data.status,
          admin_notes: data.admin_notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Report updated');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
    onError: (error) => {
      toast.error('Failed to update report', { description: error.message });
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reports').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Report deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
    onError: (error) => {
      toast.error('Failed to delete report', { description: error.message });
    },
  });

  return { reports, isLoading, updateReport, deleteReport };
}
