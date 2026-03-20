// QA Lab: Test suite definitions for end-to-end platform testing

export interface QATestStep {
  name: string;
  description: string;
  actionLocation: string; // route or component where this action happens
  action: string; // action key for the test runner
  params?: Record<string, unknown>;
  timeoutMs?: number;
}

export interface QATestSuite {
  id: string;
  name: string;
  description: string;
  category: 'onboarding' | 'ai-tools' | 'content' | 'commerce' | 'social';
  steps: QATestStep[];
}

export const QA_TEST_SUITES: QATestSuite[] = [
  {
    id: 'artist-onboarding',
    name: 'Artist Onboarding',
    description: 'Test full artist signup, profile setup, and first track upload flow',
    category: 'onboarding',
    steps: [
      { name: 'Create test artist account', description: 'Create a sandbox artist user via admin API', actionLocation: '/auth', action: 'create-test-user', params: { role: 'artist' } },
      { name: 'Verify profile created', description: 'Check profiles table has entry', actionLocation: '/artist/dashboard', action: 'verify-profile-exists' },
      { name: 'Verify subscription created', description: 'Check 30-day trial subscription', actionLocation: '/subscription', action: 'verify-subscription-trial' },
      { name: 'Verify wallet created', description: 'Check credit wallet with 15 AI credits', actionLocation: '/wallet', action: 'verify-wallet-created' },
      { name: 'Verify artist role assigned', description: 'Check user_roles has artist role', actionLocation: '/artist/dashboard', action: 'verify-role', params: { role: 'artist' } },
      { name: 'Update display name', description: 'Set profile display name', actionLocation: '/artist/dashboard', action: 'update-profile', params: { display_name: 'QA Test Artist' } },
    ],
  },
  {
    id: 'fan-onboarding',
    name: 'Fan Onboarding',
    description: 'Test fan signup and initial library setup',
    category: 'onboarding',
    steps: [
      { name: 'Create test fan account', description: 'Create a sandbox fan user', actionLocation: '/auth', action: 'create-test-user', params: { role: 'fan' } },
      { name: 'Verify profile created', description: 'Check profiles table has entry', actionLocation: '/fan/dashboard', action: 'verify-profile-exists' },
      { name: 'Verify subscription trial', description: 'Check 30-day trial active', actionLocation: '/subscription', action: 'verify-subscription-trial' },
      { name: 'Verify wallet initialized', description: 'Check 15 starting AI credits', actionLocation: '/wallet', action: 'verify-wallet-created' },
      { name: 'Verify fan role', description: 'Check user_roles entry', actionLocation: '/fan/dashboard', action: 'verify-role', params: { role: 'fan' } },
    ],
  },
  // ===== AI TOOLS — Phase 2: All edge function calls now include required body params =====
  {
    id: 'ai-release-builder',
    name: 'AI Release Builder',
    description: 'Test AI release builder flow with credit deduction',
    category: 'ai-tools',
    steps: [
      { name: 'Ensure test artist exists', description: 'Get or create test artist', actionLocation: '/ai-release', action: 'ensure-test-artist' },
      { name: 'Ensure sufficient credits', description: 'Add 100 AI credits to test user', actionLocation: '/wallet', action: 'add-test-credits', params: { credits: 100 } },
      { name: 'Call AI release builder', description: 'Invoke ai-release-builder edge function', actionLocation: '/ai-release', action: 'call-edge-function', params: {
        functionName: 'ai-release-builder',
        body: { prompt: 'QA test release plan for electronic album', genre: 'Electronic' },
      }, timeoutMs: 30000 },
      { name: 'Verify credits deducted', description: 'Check 60 credits were deducted', actionLocation: '/wallet', action: 'verify-credits-deducted', params: { expected: 60 } },
    ],
  },
  {
    id: 'cover-art-generation',
    name: 'Cover Art Generation',
    description: 'Test AI cover art generation',
    category: 'ai-tools',
    steps: [
      { name: 'Ensure test artist exists', description: 'Get or create test artist', actionLocation: '/ai-cover-art', action: 'ensure-test-artist' },
      { name: 'Ensure sufficient credits', description: 'Add 20 AI credits', actionLocation: '/wallet', action: 'add-test-credits', params: { credits: 20 } },
      { name: 'Call cover art generator', description: 'Invoke ai-cover-art edge function', actionLocation: '/ai-cover-art', action: 'call-edge-function', params: {
        functionName: 'ai-cover-art',
        body: { prompt: 'Abstract neon geometry for QA test album', genre: 'Electronic', style: 'abstract' },
      }, timeoutMs: 30000 },
      { name: 'Verify credits deducted', description: 'Check 10 credits deducted', actionLocation: '/wallet', action: 'verify-credits-deducted', params: { expected: 10 } },
    ],
  },
  {
    id: 'avatar-generation',
    name: 'AI Avatar Generation',
    description: 'Test AI avatar/identity builder',
    category: 'ai-tools',
    steps: [
      { name: 'Ensure test artist exists', description: 'Get or create test artist', actionLocation: '/ai-identity', action: 'ensure-test-artist' },
      { name: 'Ensure sufficient credits', description: 'Add 30 AI credits', actionLocation: '/wallet', action: 'add-test-credits', params: { credits: 30 } },
      { name: 'Call identity builder', description: 'Invoke ai-identity-builder edge function', actionLocation: '/ai-identity', action: 'call-edge-function', params: {
        functionName: 'ai-identity-builder',
        body: { genre: 'Electronic', style: 'futuristic' },
      }, timeoutMs: 30000 },
      { name: 'Verify credits deducted', description: 'Check 25 credits deducted', actionLocation: '/wallet', action: 'verify-credits-deducted', params: { expected: 25 } },
    ],
  },
  {
    id: 'music-video-generation',
    name: 'Music Video Generation',
    description: 'Test AI video generator flow',
    category: 'ai-tools',
    steps: [
      { name: 'Ensure test artist exists', description: 'Get or create test artist', actionLocation: '/ai-video', action: 'ensure-test-artist' },
      { name: 'Ensure sufficient credits', description: 'Add 120 AI credits', actionLocation: '/wallet', action: 'add-test-credits', params: { credits: 120 } },
      { name: 'Call video generator', description: 'Invoke ai-video-generator edge function', actionLocation: '/ai-video', action: 'call-edge-function', params: {
        functionName: 'ai-video-generator',
        body: { prompt: 'QA test cyberpunk city music video', duration_seconds: 15 },
      }, timeoutMs: 60000 },
      { name: 'Verify video queue entry', description: 'Check ai_video_queue has new entry', actionLocation: '/ai-video', action: 'verify-table-entry', params: { table: 'ai_video_queue' } },
    ],
  },
  {
    id: 'karaoke-sing-mode',
    name: 'Karaoke / Sing Mode',
    description: 'Test sing mode availability and credit flow',
    category: 'content',
    steps: [
      { name: 'Ensure test artist exists', description: 'Get or create test artist', actionLocation: '/karaoke', action: 'ensure-test-artist' },
      { name: 'Verify dummy track exists', description: 'Check for test track with karaoke enabled', actionLocation: '/karaoke', action: 'verify-dummy-track' },
      { name: 'Ensure sufficient credits', description: 'Add 10 AI credits', actionLocation: '/wallet', action: 'add-test-credits', params: { credits: 10 } },
      { name: 'Test stem separation call', description: 'Invoke stem-separation edge function', actionLocation: '/sing/:trackId', action: 'call-edge-function', params: {
        functionName: 'stem-separation',
        body: { track_id: '$context.testTrackId', audio_url: '$context.testTrackAudioUrl' },
      }, timeoutMs: 30000 },
    ],
  },
  {
    id: 'jumtunes-stage',
    name: 'JumTunes Stage',
    description: 'Test Stage mode feature availability',
    category: 'content',
    steps: [
      { name: 'Ensure test fan exists', description: 'Get or create test fan', actionLocation: '/stage/:trackId', action: 'ensure-test-fan' },
      { name: 'Verify dummy track with stage enabled', description: 'Check for test track with stage modes', actionLocation: '/stage/:trackId', action: 'verify-dummy-track-stage' },
      { name: 'Ensure sufficient credits', description: 'Add 50 AI credits', actionLocation: '/wallet', action: 'add-test-credits', params: { credits: 50 } },
      { name: 'Test avatar performance call', description: 'Invoke ai-avatar-performance edge function', actionLocation: '/stage/:trackId', action: 'call-edge-function', params: {
        functionName: 'ai-avatar-performance',
        body: { track_id: '$context.testTrackId' },
      }, timeoutMs: 60000 },
    ],
  },
  // ===== SOCIAL — Phase 1: All operations routed through proxy =====
  {
    id: 'playlist-creation',
    name: 'Playlist Creation',
    description: 'Test playlist CRUD operations',
    category: 'social',
    steps: [
      { name: 'Ensure test fan exists', description: 'Get or create test fan', actionLocation: '/library', action: 'ensure-test-fan' },
      { name: 'Create playlist', description: 'Insert a new playlist via proxy', actionLocation: '/library', action: 'create-test-playlist' },
      { name: 'Add track to playlist', description: 'Add dummy track to playlist via proxy', actionLocation: '/library/playlist/:id', action: 'add-track-to-playlist' },
      { name: 'Verify playlist content', description: 'Check playlist has 1 track', actionLocation: '/library/playlist/:id', action: 'verify-playlist-tracks', params: { expected: 1 } },
      { name: 'Delete playlist', description: 'Clean up test playlist via proxy', actionLocation: '/library', action: 'delete-test-playlist' },
    ],
  },
  {
    id: 'vault-save',
    name: 'Vault Save Flow',
    description: 'Test collection bookmark/vault functionality',
    category: 'social',
    steps: [
      { name: 'Ensure test fan exists', description: 'Get or create test fan', actionLocation: '/vault', action: 'ensure-test-fan' },
      { name: 'Bookmark a track', description: 'Save dummy track to collection via proxy', actionLocation: '/vault', action: 'bookmark-track' },
      { name: 'Verify bookmark exists', description: 'Check collection_bookmarks via proxy', actionLocation: '/vault', action: 'verify-bookmark' },
      { name: 'Remove bookmark', description: 'Remove test bookmark via proxy', actionLocation: '/vault', action: 'remove-bookmark' },
    ],
  },
  // ===== COMMERCE — Phase 2+3: Correct params + ledger assertions =====
  {
    id: 'store-checkout',
    name: 'Store Checkout',
    description: 'Test store checkout flow using Stripe test mode',
    category: 'commerce',
    steps: [
      { name: 'Ensure test artist with store', description: 'Get or create test artist with active store', actionLocation: '/artist/store', action: 'ensure-test-artist-store' },
      { name: 'Verify dummy store product', description: 'Check for test product in store_products', actionLocation: '/artist/store', action: 'verify-dummy-product' },
      { name: 'Call store checkout (test mode)', description: 'Invoke create-store-checkout with test product', actionLocation: '/artist/store', action: 'call-edge-function', params: {
        functionName: 'create-store-checkout',
        body: { productId: '$context.testProductId' },
      }, timeoutMs: 15000 },
      { name: 'Verify checkout URL returned', description: 'Check Stripe test checkout URL was generated', actionLocation: '/artist/store', action: 'verify-checkout-url' },
    ],
  },
  {
    id: 'credit-deduction',
    name: 'Credit Deduction',
    description: 'Test wallet credit operations with ledger verification',
    category: 'commerce',
    steps: [
      { name: 'Ensure test user exists', description: 'Get or create test user', actionLocation: '/wallet', action: 'ensure-test-fan' },
      { name: 'Set initial credits', description: 'Set wallet to 50 AI credits', actionLocation: '/wallet', action: 'add-test-credits', params: { credits: 50 } },
      { name: 'Deduct credits via proxy', description: 'Deduct 10 credits through ledger-verified proxy', actionLocation: '/wallet', action: 'deduct-test-credits', params: { credits: 10 } },
      { name: 'Verify balance decreased', description: 'Check credit balance matches expected', actionLocation: '/wallet', action: 'verify-credit-balance' },
    ],
  },
  {
    id: 'subscription-logic',
    name: 'Subscription Logic (Stripe Test)',
    description: 'Test subscription check and trial enforcement',
    category: 'commerce',
    steps: [
      { name: 'Ensure test user exists', description: 'Get or create test user', actionLocation: '/subscription', action: 'ensure-test-fan' },
      { name: 'Verify trial subscription', description: 'Check subscriptions table for trial', actionLocation: '/subscription', action: 'verify-subscription-trial' },
      { name: 'Call check-subscription', description: 'Invoke check-subscription edge function', actionLocation: '/subscription', action: 'call-edge-function', params: {
        functionName: 'check-subscription',
        body: {},
      }, timeoutMs: 10000 },
      { name: 'Verify response format', description: 'Check response has subscribed, product_id, subscription_end', actionLocation: '/subscription', action: 'verify-subscription-response' },
    ],
  },
];

export const QA_SUITE_CATEGORIES = [
  { id: 'onboarding', label: 'Onboarding', color: 'bg-blue-500/20 text-blue-400' },
  { id: 'ai-tools', label: 'AI Tools', color: 'bg-purple-500/20 text-purple-400' },
  { id: 'content', label: 'Content', color: 'bg-green-500/20 text-green-400' },
  { id: 'commerce', label: 'Commerce', color: 'bg-amber-500/20 text-amber-400' },
  { id: 'social', label: 'Social', color: 'bg-pink-500/20 text-pink-400' },
] as const;

export const DUMMY_ASSET_TYPES = [
  { value: 'track', label: 'Audio Track' },
  { value: 'instrumental', label: 'Instrumental File' },
  { value: 'lyrics', label: 'Lyric File' },
  { value: 'cover', label: 'Cover Image' },
  { value: 'merch', label: 'Merch Item' },
  { value: 'artist_profile', label: 'Artist Profile' },
  { value: 'fan_profile', label: 'Fan Profile' },
] as const;

export const DEFAULT_DUMMY_ASSETS = [
  { asset_type: 'track', name: 'QA Test Track - Midnight Glow', description: 'Dummy track for testing playback and uploads', metadata: { genre: 'Electronic', bpm: 128, duration: 180, audio_url: 'placeholder://qa-test-track.mp3' } },
  { asset_type: 'track', name: 'QA Test Track - Sunrise Beat', description: 'Secondary dummy track', metadata: { genre: 'Hip Hop', bpm: 95, duration: 210, audio_url: 'placeholder://qa-test-track-2.mp3' } },
  { asset_type: 'instrumental', name: 'QA Instrumental - Midnight Glow', description: 'Karaoke version of test track', metadata: { original_track: 'QA Test Track - Midnight Glow', audio_url: 'placeholder://qa-instrumental.mp3' } },
  { asset_type: 'lyrics', name: 'QA Lyrics - Midnight Glow', description: 'LRC lyrics file for test track', metadata: { format: 'lrc', content: '[00:00.00]Test line one\n[00:05.00]Test line two\n[00:10.00]Test line three' } },
  { asset_type: 'cover', name: 'QA Cover Art - Abstract', description: 'Test cover image', metadata: { width: 1000, height: 1000, image_url: 'placeholder://qa-cover.jpg' } },
  { asset_type: 'cover', name: 'QA Cover Art - Neon', description: 'Secondary test cover', metadata: { width: 1000, height: 1000, image_url: 'placeholder://qa-cover-2.jpg' } },
  { asset_type: 'merch', name: 'QA Merch - Test T-Shirt', description: 'Dummy merch product', metadata: { price_cents: 2500, category: 'apparel', inventory_limit: 100 } },
  { asset_type: 'merch', name: 'QA Merch - Digital Download', description: 'Dummy digital product', metadata: { price_cents: 999, category: 'digital', inventory_limit: null } },
  { asset_type: 'artist_profile', name: 'QA Artist - DJ TestBot', description: 'Test artist profile template', metadata: { display_name: 'DJ TestBot', genre: 'Electronic', bio: 'QA test artist profile' } },
  { asset_type: 'artist_profile', name: 'QA Artist - MC QualityCheck', description: 'Secondary test artist', metadata: { display_name: 'MC QualityCheck', genre: 'Hip Hop', bio: 'QA test artist #2' } },
  { asset_type: 'fan_profile', name: 'QA Fan - TestListener', description: 'Test fan profile template', metadata: { display_name: 'TestListener', bio: 'QA test fan profile' } },
  { asset_type: 'fan_profile', name: 'QA Fan - SuperFanTest', description: 'Test superfan profile', metadata: { display_name: 'SuperFanTest', bio: 'QA test superfan' } },
];
