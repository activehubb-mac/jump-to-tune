

## Fix: Video Generation Stuck on "Processing" — Edge Function Timeout

### Root Cause
The edge function polls Replicate every 5 seconds for up to 5 minutes, but **Supabase edge functions have a ~150 second wall-clock timeout**. The function gets killed at poll 27 (~135s), leaving the job permanently stuck as "processing" with no completion or refund.

The minimax/video-01 model typically takes 3-5 minutes to generate — far longer than the edge function can stay alive.

### Solution: Split into Create + Poll

**Architecture change**: The edge function should only create the Replicate prediction and return immediately. A separate lightweight function handles polling, called