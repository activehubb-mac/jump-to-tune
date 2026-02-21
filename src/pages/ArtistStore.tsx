import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, Package, ShoppingCart, BarChart3, Lock, Loader2, AlertCircle, Brain, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StoreSetupTab } from "@/components/store/StoreSetupTab";
import { ProductsTab } from "@/components/store/ProductsTab";
import { OrdersTab } from "@/components/store/OrdersTab";
import { StoreAnalyticsTab } from "@/components/store/StoreAnalyticsTab";
import { SuperfanCenterTab } from "@/components/store/SuperfanCenterTab";
import { AnnouncementsTab } from "@/components/store/AnnouncementsTab";

export default function ArtistStore() {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Lock className="w-10 h-10 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Sign In Required</h1>
          <Button className="gradient-accent" asChild>
            <Link to="/auth?role=artist">Sign In as Artist</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (role !== "artist") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Artist Access Only</h1>
          <p className="text-muted-foreground">This page is for artists only.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <Store className="w-6 h-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Store & Earnings</h1>
        </div>

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="glass w-full justify-start overflow-x-auto">
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Store className="w-4 h-4" /> Setup
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" /> Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Orders
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> Announcements
            </TabsTrigger>
            <TabsTrigger value="superfan" className="flex items-center gap-2">
              <Brain className="w-4 h-4" /> Superfan Center
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup"><StoreSetupTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="analytics"><StoreAnalyticsTab /></TabsContent>
          <TabsContent value="announcements"><AnnouncementsTab /></TabsContent>
          <TabsContent value="superfan"><SuperfanCenterTab /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
