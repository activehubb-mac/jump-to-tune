import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FeedbackProvider } from "@/contexts/FeedbackContext";
import { FeedbackModal } from "@/components/ui/feedback-modal";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Browse from "./pages/Browse";
import Artists from "./pages/Artists";
import Labels from "./pages/Labels";
import ArtistProfile from "./pages/ArtistProfile";
import LabelProfile from "./pages/LabelProfile";
import Collection from "./pages/Collection";
import ArtistDashboard from "./pages/ArtistDashboard";
import LabelDashboard from "./pages/LabelDashboard";
import Upload from "./pages/Upload";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FeedbackProvider>
        <TooltipProvider>
          <FeedbackModal />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/artists" element={<Artists />} />
              <Route path="/labels" element={<Labels />} />
              <Route path="/artist/:id" element={<ArtistProfile />} />
              <Route path="/label/:id" element={<LabelProfile />} />
              <Route path="/collection" element={<Collection />} />
              <Route path="/artist/dashboard" element={<ArtistDashboard />} />
              <Route path="/label/dashboard" element={<LabelDashboard />} />
              <Route path="/upload" element={<Upload />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </FeedbackProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
