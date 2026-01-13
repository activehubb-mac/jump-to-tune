import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload as UploadIcon, Music, Image, Lock, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Upload() {
  const { user, role, isLoading } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Not logged in - show sign in prompt
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Upload Music</h1>
            <p className="text-muted-foreground mb-8">
              Sign in as an artist or label to upload your music.
            </p>
            <div className="flex gap-4 justify-center">
              <Button className="gradient-accent neon-glow-subtle" asChild>
                <Link to="/auth?role=artist">Sign In as Artist</Link>
              </Button>
              <Button variant="outline" className="border-glass-border" asChild>
                <Link to="/auth?role=label">Sign In as Label</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Logged in but not an artist or label - show access denied
  if (role !== "artist" && role !== "label") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Artist or Label Access Only</h1>
            <p className="text-muted-foreground mb-8">
              Only artists and labels can upload music. Browse our collection instead!
            </p>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/browse">Browse Music</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Upload Track</h1>
          <p className="text-muted-foreground">Share your music with the world</p>
        </div>

        <div className="glass-card p-8">
          <form className="space-y-6">
            {/* Audio Upload */}
            <div>
              <Label className="text-foreground mb-2 block">Audio File</Label>
              <div className="border-2 border-dashed border-glass-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Music className="w-8 h-8 text-primary" />
                </div>
                <p className="text-foreground font-medium mb-1">Drop your audio file here</p>
                <p className="text-sm text-muted-foreground">MP3, WAV, FLAC up to 50MB</p>
                <Button variant="outline" className="mt-4 border-glass-border">
                  Choose File
                </Button>
              </div>
            </div>

            {/* Cover Art */}
            <div>
              <Label className="text-foreground mb-2 block">Cover Art</Label>
              <div className="border-2 border-dashed border-glass-border rounded-xl p-8 text-center hover:border-accent/50 transition-colors cursor-pointer">
                <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-4">
                  <Image className="w-8 h-8 text-accent" />
                </div>
                <p className="text-foreground font-medium mb-1">Drop your cover art here</p>
                <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB (1:1 ratio recommended)</p>
                <Button variant="outline" className="mt-4 border-glass-border">
                  Choose Image
                </Button>
              </div>
            </div>

            {/* Track Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">Track Title</Label>
                <Input
                  id="title"
                  placeholder="Enter track title"
                  className="bg-muted/50 border-glass-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genre" className="text-foreground">Genre</Label>
                <Input
                  id="genre"
                  placeholder="e.g., Electronic, Hip Hop"
                  className="bg-muted/50 border-glass-border focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell listeners about this track..."
                className="bg-muted/50 border-glass-border focus:border-primary min-h-24"
              />
            </div>

            {/* Pricing */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-foreground">Price (ETH)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.001"
                  placeholder="0.05"
                  className="bg-muted/50 border-glass-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editions" className="text-foreground">Number of Editions</Label>
                <Input
                  id="editions"
                  type="number"
                  placeholder="100"
                  className="bg-muted/50 border-glass-border focus:border-primary"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="flex-1 border-glass-border">
                Save Draft
              </Button>
              <Button
                type="submit"
                className="flex-1 gradient-accent neon-glow-subtle hover:neon-glow"
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <UploadIcon className="w-4 h-4 mr-2" />
                )}
                Upload Track
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}