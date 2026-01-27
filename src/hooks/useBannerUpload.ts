import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseBannerUploadOptions {
  userId: string;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function useBannerUpload({ userId, onSuccess, onError }: UseBannerUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadBanner = async (file: File) => {
    if (!userId) {
      onError?.(new Error("User not authenticated"));
      return null;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      onError?.(new Error("Please upload a valid image (JPEG, PNG, WebP, or GIF)"));
      return null;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      onError?.(new Error("Image must be less than 5MB"));
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Delete existing banner if any
      const { data: existingFiles } = await supabase.storage
        .from("banners")
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from("banners").remove(filesToDelete);
      }

      setProgress(30);

      // Upload new banner
      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      setProgress(70);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("banners")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update profile with new banner URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ banner_image_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setProgress(100);
      onSuccess?.(publicUrl);

      return publicUrl;
    } catch (error) {
      onError?.(error as Error);
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadBanner,
    isUploading,
    progress,
  };
}
