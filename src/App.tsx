import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FeedbackProvider } from "@/contexts/FeedbackContext";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { FeedbackModal } from "@/components/ui/feedback-modal";
import { GlobalAudioPlayer } from "@/components/audio/GlobalAudioPlayer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Browse from "./pages/Browse";
import Artists from "./pages/Artists";
import Labels from "./pages/Labels";
import ArtistProfile from "./pages/ArtistProfile";
import LabelProfile from "./pages/LabelProfile";
import Collection from "./pages/Collection";
import ArtistDashboard from "./pages/ArtistDashboard";
import ArtistAnalytics from "./pages/ArtistAnalytics";
import ArtistCollectors from "./pages/ArtistCollectors";
import ArtistTracks from "./pages/ArtistTracks";
import LabelDashboard from "./pages/LabelDashboard";
import LabelAnalytics from "./pages/LabelAnalytics";
import LabelCollectors from "./pages/LabelCollectors";
import LabelTracks from "./pages/LabelTracks";
import LabelPayouts from "./pages/LabelPayouts";
import LabelRoster from "./pages/LabelRoster";
import Upload from "./pages/Upload";
import TrackEdit from "./pages/TrackEdit";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import Subscription from "./pages/Subscription";
import Wallet from "./pages/Wallet";
import ArtistPayouts from "./pages/ArtistPayouts";
import NotificationSettings from "./pages/NotificationSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FeedbackProvider>
        <AudioPlayerProvider>
          <TooltipProvider>
            <FeedbackModal />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/artists" element={<Artists />} />
                <Route path="/labels" element={<Labels />} />
                <Route path="/artist/:id" element={<ArtistProfile />} />
                <Route path="/label/:id" element={<LabelProfile />} />
                <Route path="/collection" element={<Collection />} />
                <Route path="/artist/dashboard" element={<ArtistDashboard />} />
                <Route path="/artist/analytics" element={<ArtistAnalytics />} />
                <Route path="/artist/collectors" element={<ArtistCollectors />} />
                <Route path="/artist/tracks" element={<ArtistTracks />} />
                <Route path="/track/:id/edit" element={<TrackEdit />} />
                <Route path="/label/dashboard" element={<LabelDashboard />} />
                <Route path="/label/analytics" element={<LabelAnalytics />} />
                <Route path="/label/collectors" element={<LabelCollectors />} />
                <Route path="/label/tracks" element={<LabelTracks />} />
                <Route path="/label/payouts" element={<LabelPayouts />} />
                <Route path="/label/roster" element={<LabelRoster />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-canceled" element={<PaymentCanceled />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/artist/payouts" element={<ArtistPayouts />} />
                <Route path="/settings/notifications" element={<NotificationSettings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <GlobalAudioPlayer />
            </BrowserRouter>
          </TooltipProvider>
        </AudioPlayerProvider>
      </FeedbackProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
