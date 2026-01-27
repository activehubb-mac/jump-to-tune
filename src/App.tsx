import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FeedbackProvider } from "@/contexts/FeedbackContext";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { FeedbackModal } from "@/components/ui/feedback-modal";
import { GlobalAudioPlayer } from "@/components/audio/GlobalAudioPlayer";
import { useStatusBar } from "@/hooks/useStatusBar";
import { useDeepLinkHandler } from "@/hooks/useDeepLinkHandler";
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
import UserProfile from "./pages/UserProfile";
import Collection from "./pages/Collection";
import FanDashboard from "./pages/FanDashboard";
import ForYou from "./pages/ForYou";
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
import AlbumUpload from "./pages/AlbumUpload";
import TrackEdit from "./pages/TrackEdit";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import Subscription from "./pages/Subscription";
import Wallet from "./pages/Wallet";
import ArtistPayouts from "./pages/ArtistPayouts";
import NotificationSettings from "./pages/NotificationSettings";
import ThemePreview from "./pages/ThemePreview";
import Karaoke from "./pages/Karaoke";
import NotFound from "./pages/NotFound";
import AlbumDetail from "./pages/AlbumDetail";
import AccountSettings from "./pages/AccountSettings";
import PlaylistDetail from "./pages/PlaylistDetail";
import LikedSongsDetail from "./pages/LikedSongsDetail";
// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTracks from "./pages/admin/AdminTracks";
import AdminFeatured from "./pages/admin/AdminFeatured";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminReports from "./pages/admin/AdminReports";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import HelpCenter from "./pages/HelpCenter";
import Install from "./pages/Install";
import NotificationCenter from "./pages/NotificationCenter";

const queryClient = new QueryClient();

function AppContent() {
  // Initialize native status bar configuration
  useStatusBar();
  // Handle deep links from jumtunes:// URL scheme (iOS/Android)
  useDeepLinkHandler();

  return (
    <>
      <FeedbackModal />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/karaoke" element={<Karaoke />} />
          <Route path="/for-you" element={<ForYou />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/labels" element={<Labels />} />
          <Route path="/artist/:id" element={<ArtistProfile />} />
          <Route path="/label/:id" element={<LabelProfile />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/library" element={<Collection />} />
          <Route path="/collection" element={<Navigate to="/library" replace />} />
          <Route path="/fan/dashboard" element={<FanDashboard />} />
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
          <Route path="/upload/album" element={<AlbumUpload />} />
          <Route path="/album/:id" element={<AlbumDetail />} />
          <Route path="/library/liked" element={<LikedSongsDetail />} />
          <Route path="/library/playlist/:playlistId" element={<PlaylistDetail />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-canceled" element={<PaymentCanceled />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/artist/payouts" element={<ArtistPayouts />} />
          <Route path="/settings/notifications" element={<NotificationSettings />} />
          <Route path="/settings" element={<AccountSettings />} />
          <Route path="/theme-preview" element={<ThemePreview />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/install" element={<Install />} />
          <Route path="/notifications" element={<NotificationCenter />} />
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="tracks" element={<AdminTracks />} />
            <Route path="featured" element={<AdminFeatured />} />
            <Route path="finance" element={<AdminFinance />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <GlobalAudioPlayer />
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FeedbackProvider>
        <AudioPlayerProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </AudioPlayerProvider>
      </FeedbackProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
