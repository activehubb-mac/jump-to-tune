import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DMCAReportData {
  name: string;
  email: string;
  content_url: string;
  reason: string;
  description?: string;
}

export function useDMCAReport() {
  const [isPending, setIsPending] = useState(false);

  const submitReport = async (data: DMCAReportData) => {
    setIsPending(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('send-dmca-report', {
        body: data,
      });

      if (error) throw error;
      if (result && !result.success) throw new Error(result.error || 'Failed to submit report');

      toast.success('Your report has been submitted and will be reviewed.');
      return true;
    } catch (err: any) {
      toast.error('Failed to submit report', { description: err.message });
      return false;
    } finally {
      setIsPending(false);
    }
  };

  return { submitReport, isPending };
}
