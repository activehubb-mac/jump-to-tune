-- Create enum for content types
CREATE TYPE public.featured_content_type AS ENUM ('artist', 'label', 'track', 'album');

-- Create featured_content table
CREATE TABLE public.featured_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type featured_content_type NOT NULL,
  content_id UUID NOT NULL,
  display_location TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (content_type, content_id, display_location)
);

-- Enable RLS
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;

-- Only admins can manage featured content
CREATE POLICY "Admins can manage featured content"
ON public.featured_content
FOR ALL
USING (public.has_admin_role(auth.uid()));

-- Everyone can view active featured content
CREATE POLICY "Anyone can view active featured content"
ON public.featured_content
FOR SELECT
USING (
  is_active = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at > now())
);

-- Create trigger for updated_at
CREATE TRIGGER update_featured_content_updated_at
BEFORE UPDATE ON public.featured_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for efficient queries
CREATE INDEX idx_featured_content_type_location ON public.featured_content(content_type, display_location);
CREATE INDEX idx_featured_content_active ON public.featured_content(is_active, starts_at, ends_at);