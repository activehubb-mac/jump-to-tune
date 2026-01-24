-- Create push_tokens table for storing user notification tokens
CREATE TABLE public.push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'ios', 'android', 'web'
  device_id TEXT, -- Optional device identifier
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own tokens
CREATE POLICY "Users can view their own push tokens"
ON public.push_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert their own push tokens"
ON public.push_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update their own push tokens"
ON public.push_tokens
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete their own push tokens"
ON public.push_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- Service role can manage all tokens (for sending notifications)
CREATE POLICY "Service role can manage all push tokens"
ON public.push_tokens
FOR ALL
USING (auth.role() = 'service_role');

-- Create index for efficient lookups
CREATE INDEX idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON public.push_tokens(is_active) WHERE is_active = true;

-- Add trigger for updated_at
CREATE TRIGGER update_push_tokens_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();